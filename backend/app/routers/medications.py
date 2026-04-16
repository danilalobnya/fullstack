import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.medication_scope import (
    assert_medication_readable,
    assert_medication_writable,
    resolve_target_user_id,
)
from app.models import db_models
from app.schemas.medications import (
    CreateMedicationRequest,
    MedicationResponse,
    MedicationSortField,
    PaginatedMedicationsResponse,
    SortOrder,
    UpdateMedicationRequest,
)
from app.services.object_storage import get_object_storage

router = APIRouter(prefix="/medications", tags=["Medications"])

_SORT_COLUMNS = {
    MedicationSortField.id: db_models.Medication.id,
    MedicationSortField.name: db_models.Medication.name,
    MedicationSortField.dosage: db_models.Medication.dosage,
    MedicationSortField.quantity: db_models.Medication.quantity,
}


@router.get("/", response_model=PaginatedMedicationsResponse)
def get_medications(
    db: Session = Depends(get_db),
    target_user_id: int = Depends(resolve_target_user_id),
    q: Optional[str] = Query(
        None,
        description="Поиск по названию, описанию и дозировке",
        max_length=200,
    ),
    take_with_food: Optional[str] = Query(
        None,
        description="Фильтр: before / with / after",
        pattern="^(before|with|after)$",
    ),
    quantity_contains: Optional[str] = Query(None, max_length=120, description="Подстрока в поле quantity"),
    dosage_contains: Optional[str] = Query(None, max_length=120, description="Подстрока в поле dosage"),
    sort_by: MedicationSortField = Query(MedicationSortField.id, description="Поле сортировки"),
    sort_order: SortOrder = Query(SortOrder.desc, description="Порядок: asc или desc"),
    page: int = Query(1, ge=1, le=10_000),
    page_size: int = Query(20, ge=1, le=100),
):

    query = db.query(db_models.Medication).filter(db_models.Medication.user_id == target_user_id)

    if q:
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                db_models.Medication.name.ilike(term),
                db_models.Medication.description.ilike(term),
                db_models.Medication.dosage.ilike(term),
            )
        )

    if take_with_food:
        query = query.filter(db_models.Medication.take_with_food == take_with_food)

    if quantity_contains:
        query = query.filter(db_models.Medication.quantity.ilike(f"%{quantity_contains}%"))

    if dosage_contains:
        query = query.filter(db_models.Medication.dosage.ilike(f"%{dosage_contains}%"))

    total = query.count()

    sort_col = _SORT_COLUMNS[sort_by]
    if sort_order == SortOrder.asc:
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    offset = (page - 1) * page_size
    rows = query.offset(offset).limit(page_size).all()

    pages = math.ceil(total / page_size) if total > 0 else 1

    items = [
        MedicationResponse(
            id=m.id,
            name=m.name,
            quantity=m.quantity,
            dosage=m.dosage,
            description=m.description,
            take_with_food=m.take_with_food,
        )
        for m in rows
    ]

    return PaginatedMedicationsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{medication_id}", response_model=MedicationResponse)
def get_medication(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    medication = db.get(db_models.Medication, medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    assert_medication_readable(medication, current_user)
    return MedicationResponse(
        id=medication.id,
        name=medication.name,
        quantity=medication.quantity,
        dosage=medication.dosage,
        description=medication.description,
        take_with_food=medication.take_with_food,
    )


@router.post("/", response_model=MedicationResponse)
def create_medication(
    medication_data: CreateMedicationRequest,
    db: Session = Depends(get_db),
    target_user_id: int = Depends(resolve_target_user_id),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Создать лекарство для target_user_id (для admin — выбранный user, иначе текущий).
    """
    medication = db_models.Medication(
        user_id=target_user_id,
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
def update_medication(
    medication_id: int,
    medication_data: UpdateMedicationRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    medication = db.get(db_models.Medication, medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    assert_medication_writable(medication, current_user)

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
def delete_medication(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    medication = db.get(db_models.Medication, medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    assert_medication_writable(medication, current_user)

    storage = get_object_storage()
    for f in list(medication.files):
        storage.delete_object(f.object_key)

    db.delete(medication)
    db.commit()
    return {"status": "deleted", "medication_id": medication_id}
