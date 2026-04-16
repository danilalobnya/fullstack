from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CreateMedicationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Название лекарства")
    quantity: str = Field(..., min_length=1, max_length=120, description="Количество")
    dosage: str = Field(..., min_length=1, max_length=120, description="Дозировка")
    description: Optional[str] = Field(None, max_length=2000, description="Описание")
    take_with_food: Optional[str] = Field(None, description="before/with/after - до/во время/после еды")

    @field_validator("take_with_food")
    @classmethod
    def validate_take_with_food(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        if v not in ("before", "with", "after"):
            raise ValueError("take_with_food должен быть одним из: before, with, after")
        return v


class UpdateMedicationRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[str] = Field(None, min_length=1, max_length=120)
    dosage: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=2000)
    take_with_food: Optional[str] = None

    @field_validator("take_with_food", mode="before")
    @classmethod
    def empty_take_food(cls, v: Optional[str]) -> Optional[str]:
        if v == "":
            return None
        return v

    @field_validator("take_with_food")
    @classmethod
    def validate_take_with_food(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        if v not in ("before", "with", "after"):
            raise ValueError("take_with_food должен быть одним из: before, with, after")
        return v


class MedicationResponse(BaseModel):
    id: int
    name: str
    quantity: str
    dosage: str
    description: Optional[str]
    take_with_food: Optional[str]


class MedicationSortField(str, Enum):
    id = "id"
    name = "name"
    dosage = "dosage"
    quantity = "quantity"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


class PaginatedMedicationsResponse(BaseModel):
    items: List[MedicationResponse]
    total: int
    page: int
    page_size: int
    pages: int


class MedicationFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medication_id: int
    original_filename: str
    content_type: str
    size_bytes: int
    created_at: datetime


class PresignedDownloadResponse(BaseModel):
    url: str
    expires_in: int
