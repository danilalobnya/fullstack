from datetime import date
from typing import List

from pydantic import BaseModel, Field


class CreateTimeSlotRequest(BaseModel):
    hour: int = Field(..., description="Час", ge=0, le=23)
    minute: int = Field(..., description="Минуты", ge=0, le=59)


class CreateScheduleRequest(BaseModel):
    medication_id: int = Field(..., description="ID лекарства")
    family_member_id: int = Field(..., description="ID члена семьи")
    start_date: date = Field(..., description="Начало приема")
    end_date: date = Field(..., description="Конец приема")
    time_slots: List[CreateTimeSlotRequest] = Field(..., description="Список времен приема")
    period_type: str = Field(..., description="daily/every_other_day - каждый день/через день")


class TimeSlotResponse(BaseModel):
    id: int
    time: str


class MedicationScheduleResponse(BaseModel):
    id: int
    medication_id: int
    medication_name: str
    family_member_id: int
    family_member_name: str
    start_date: date
    end_date: date
    time_slots: List[TimeSlotResponse]
    period_type: str

