from typing import List, Optional

from pydantic import BaseModel, Field


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

