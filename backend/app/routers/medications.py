from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import time

router = APIRouter(prefix="/medications", tags=["Medications"])


class CreateMedicationRequest(BaseModel):
    name: str = Field(..., description="Название лекарства")
    quantity: str = Field(..., description="Количество")
    dosage: str = Field(..., description="Дозировка")
    description: Optional[str] = Field(None, description="Описание")
    take_with_food: Optional[str] = Field(None, description="before/with/after - до/во время/после еды")


class UpdateMedicationRequest(BaseModel):
    name: Optional[str] = None
    quantity: Optional[str] = None
    dosage: Optional[str] = None
    description: Optional[str] = None
    take_with_food: Optional[str] = None


class MedicationResponse(BaseModel):
    id: int
    name: str
    quantity: str
    dosage: str
    description: Optional[str]
    take_with_food: Optional[str]


@router.get("/", response_model=List[MedicationResponse])
async def get_medications(
    search: Optional[str] = Query(None, description="Поиск по названию"),
    user_id: Optional[int] = None
):
    """
    Получить список лекарств
    Поиск по названию через параметр search
    """
    pass


@router.get("/{medication_id}", response_model=MedicationResponse)
async def get_medication(medication_id: int):
    """
    Получить информацию о лекарстве
    """
    pass


@router.post("/", response_model=MedicationResponse)
async def create_medication(medication_data: CreateMedicationRequest):
    """
    Создать новое лекарство
    """
    pass


@router.put("/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: int,
    medication_data: UpdateMedicationRequest
):
    """
    Обновить информацию о лекарстве
    """
    pass


@router.delete("/{medication_id}")
async def delete_medication(medication_id: int):
    """
    Удалить лекарство
    """
    pass
