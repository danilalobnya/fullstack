from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import db_models
from app.schemas.medications import CreateMedicationRequest, MedicationResponse, UpdateMedicationRequest

router = APIRouter(prefix="/medications", tags=["Medications"])


@router.get("/", response_model=List[MedicationResponse])
async def get_medications(
    search: Optional[str] = Query(None, description="Поиск по названию"),
    user_id: Optional[int] = None,
    user_id_header: int | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Получить список лекарств
    Поиск по названию через параметр search
    """
    target_user_id = user_id or user_id_header or current_user.id

    query = db.query(db_models.Medication).filter(db_models.Medication.user_id == target_user_id)
    if search:
        like = f"%{search.lower()}%"
        query = query.filter(db_models.Medication.name.ilike(like))
    medications = query.all()
    return [
        MedicationResponse(
            id=med.id,
            name=med.name,
            quantity=med.quantity,
            dosage=med.dosage,
            description=med.description,
            take_with_food=med.take_with_food,
        )
        for med in medications
    ]


@router.get("/{medication_id}", response_model=MedicationResponse)
async def get_medication(
    medication_id: int, db: Session = Depends(get_db), current_user: db_models.User = Depends(get_current_user)
):
    """
    Получить информацию о лекарстве
    """
    medication = db.get(db_models.Medication, medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    return MedicationResponse(
        id=medication.id,
        name=medication.name,
        quantity=medication.quantity,
        dosage=medication.dosage,
        description=medication.description,
        take_with_food=medication.take_with_food,
    )


@router.post("/", response_model=MedicationResponse)
async def create_medication(
    medication_data: CreateMedicationRequest,
    user_id_header: int | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Создать новое лекарство
    """
    user_id = user_id_header or current_user.id
    if medication_data.take_with_food and medication_data.take_with_food not in {"before", "with", "after"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="take_with_food должен быть одним из ['before', 'with', 'after']",
        )
    medication = db_models.Medication(
        user_id=user_id,
        name=medication_data.name,
        quantity=medication_data.quantity,
        dosage=medication_data.dosage,
        description=medication_data.description,
        take_with_food=medication_data.take_with_food,
    )
    db.add(medication)
    db.commit()
    db.refresh(medication)
    return MedicationResponse(
        id=medication.id,
        name=medication.name,
        quantity=medication.quantity,
        dosage=medication.dosage,
        description=medication.description,
        take_with_food=medication.take_with_food,
    )


@router.put("/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: int,
    medication_data: UpdateMedicationRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Обновить информацию о лекарстве
    """
    medication = db.get(db_models.Medication, medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    if medication.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя изменять чужое лекарство")
    if medication_data.take_with_food and medication_data.take_with_food not in {"before", "with", "after"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="take_with_food должен быть одним из ['before', 'with', 'after']",
        )
    for field in ["name", "quantity", "dosage", "description", "take_with_food"]:
        value = getattr(medication_data, field)
        if value is not None:
            setattr(medication, field, value)
    db.commit()
    db.refresh(medication)
    return MedicationResponse(
        id=medication.id,
        name=medication.name,
        quantity=medication.quantity,
        dosage=medication.dosage,
        description=medication.description,
        take_with_food=medication.take_with_food,
    )


@router.delete("/{medication_id}")
async def delete_medication(
    medication_id: int, db: Session = Depends(get_db), current_user: db_models.User = Depends(get_current_user)
):
    """
    Удалить лекарство
    """
    medication = db.get(db_models.Medication, medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    if medication.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя удалять чужое лекарство")
    db.delete(medication)
    db.commit()
    return {"status": "deleted", "medication_id": medication_id}
