"""S3-совместимое хранилище (MinIO/AWS) или локальная файловая система."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import TYPE_CHECKING

from app.config import settings

if TYPE_CHECKING:
    pass


class ObjectStorage(ABC):
    @abstractmethod
    def put_object(self, key: str, data: bytes, content_type: str) -> None:
        ...

    @abstractmethod
    def delete_object(self, key: str) -> None:
        ...

    def try_presigned_get(self, key: str, expires_seconds: int) -> str | None:
        """S3/MinIO — прямая ссылка; локальное хранилище — None (токен в роутере)."""
        return None


class LocalFilesystemStorage(ObjectStorage):
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        if ".." in key or key.startswith("/"):
            raise ValueError("Некорректный ключ объекта")
        p = (self.root / key).resolve()
        if not str(p).startswith(str(self.root)):
            raise ValueError("Некорректный ключ объекта")
        return p

    def put_object(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        _ = content_type

    def delete_object(self, key: str) -> None:
        try:
            p = self._path(key)
            if p.is_file():
                p.unlink()
        except ValueError:
            return

    def read_bytes(self, key: str) -> bytes:
        return self._path(key).read_bytes()

class S3CompatibleStorage(ObjectStorage):
    def __init__(
        self,
        *,
        endpoint_url: str,
        bucket: str,
        access_key: str,
        secret_key: str,
        region: str,
    ) -> None:
        import boto3
        from botocore.client import Config

        self.bucket = bucket
        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
            config=Config(signature_version="s3v4"),
        )

    def put_object(self, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def delete_object(self, key: str) -> None:
        self._client.delete_object(Bucket=self.bucket, Key=key)

    def try_presigned_get(self, key: str, expires_seconds: int) -> str | None:
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_seconds,
        )


_storage: ObjectStorage | None = None


def build_object_key(user_id: int, medication_id: int) -> str:
    return f"users/{user_id}/medications/{medication_id}/{uuid.uuid4().hex}"


def get_object_storage() -> ObjectStorage:
    global _storage
    if _storage is not None:
        return _storage

    if (
        settings.s3_endpoint_url
        and settings.s3_bucket
        and settings.s3_access_key
        and settings.s3_secret_key
    ):
        _storage = S3CompatibleStorage(
            endpoint_url=settings.s3_endpoint_url,
            bucket=settings.s3_bucket,
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
            region=settings.s3_region,
        )
    else:
        _storage = LocalFilesystemStorage(Path(settings.object_storage_local_path))

    return _storage


def is_s3_storage() -> bool:
    return isinstance(get_object_storage(), S3CompatibleStorage)
