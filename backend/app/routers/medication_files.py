"""Вложения к лекарствам: загрузка, список, pre-signed / токен на скачивание, удаление."""

from __future__ import annotations

import io
from typing import List
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.medication_scope import assert_medication_readable, assert_medication_writable
from app.models import db_models
from app.schemas.medications import MedicationFileResponse, PresignedDownloadResponse
from app.services.object_storage import LocalFilesystemStorage, build_object_key, get_object_storage, is_s3_storage
from app.utils.file_token import create_file_download_token, parse_file_download_token

router = APIRouter(prefix="/medications", tags=["Medication files"])


def _allowed_mime() -> set[str]:
    return {m.strip().lower() for m in settings.file_upload_allowed_mime.split(",") if m.strip()}


@router.get("/files/access", response_class=StreamingResponse)
def download_file_by_token(
    token: str = Query(..., min_length=8, description="Токен из presigned-ответа (локальный режим)"),
    db: Session = Depends(get_db),
):
    parsed = parse_file_download_token(settings.secret_key, token)
    if not parsed:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ссылка недействительна или истекла")
    file_id, medication_id = parsed
    row = db.get(db_models.MedicationFile, file_id)
    if not row or row.medication_id != medication_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    if is_s3_storage():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Для S3 используйте выданный presigned URL напрямую",
        )
    storage = get_object_storage()
    if not isinstance(storage, LocalFilesystemStorage):
        raise HTTPException(status_code=500, detail="Конфигурация хранилища не поддержана")
    data = storage.read_bytes(row.object_key)
    filename = row.original_filename.replace('"', "'")
    return StreamingResponse(
        io.BytesIO(data),
        media_type=row.content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/{medication_id}/files", response_model=List[MedicationFileResponse])
def list_medication_files(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    med = db.get(db_models.Medication, medication_id)
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    assert_medication_readable(med, current_user)
    rows = (
        db.query(db_models.MedicationFile)
        .filter(db_models.MedicationFile.medication_id == medication_id)
        .order_by(db_models.MedicationFile.created_at.desc())
        .all()
    )
    return rows


@router.post("/{medication_id}/files", response_model=MedicationFileResponse, status_code=status.HTTP_201_CREATED)
def upload_medication_file(
    medication_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    med = db.get(db_models.Medication, medication_id)
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    assert_medication_writable(med, current_user)

    ctype = (file.content_type or "application/octet-stream").split(";")[0].strip().lower()
    if ctype not in _allowed_mime():
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Допустимые типы: {settings.file_upload_allowed_mime}",
        )

    raw = file.file.read(settings.file_upload_max_bytes + 1)
    if len(raw) > settings.file_upload_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Максимальный размер файла: {settings.file_upload_max_bytes} байт",
        )

    key = build_object_key(med.user_id, medication_id)
    storage = get_object_storage()
    storage.put_object(key, raw, ctype)

    safe_name = (file.filename or "upload").replace("\x00", "")[:255]
    row = db_models.MedicationFile(
        medication_id=medication_id,
        user_id=current_user.id,
        object_key=key,
        original_filename=safe_name,
        content_type=ctype,
        size_bytes=len(raw),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{medication_id}/files/{file_id}/download-url", response_model=PresignedDownloadResponse)
def get_download_url(
    medication_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    med = db.get(db_models.Medication, medication_id)
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    assert_medication_readable(med, current_user)

    row = db.get(db_models.MedicationFile, file_id)
    if not row or row.medication_id != medication_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")

    ttl = settings.file_download_token_ttl_seconds
    storage = get_object_storage()
    direct = storage.try_presigned_get(row.object_key, ttl)
    if direct:
        return PresignedDownloadResponse(url=direct, expires_in=ttl)

    token = create_file_download_token(
        settings.secret_key,
        file_id=row.id,
        medication_id=medication_id,
        max_age_seconds=ttl,
    )
    base = settings.public_base_url.rstrip("/")
    prefix = settings.api_v1_prefix.rstrip("/")
    qs = urlencode({"token": token})
    url = f"{base}{prefix}/medications/files/access?{qs}"
    return PresignedDownloadResponse(url=url, expires_in=ttl)


@router.delete("/{medication_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication_file(
    medication_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    med = db.get(db_models.Medication, medication_id)
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    assert_medication_writable(med, current_user)

    row = db.get(db_models.MedicationFile, file_id)
    if not row or row.medication_id != medication_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")

    get_object_storage().delete_object(row.object_key)
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
