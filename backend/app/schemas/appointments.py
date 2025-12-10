from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class CreateAppointmentRequest(BaseModel):
    medication_id: int = Field(..., description="ID лекарства")
    start_date: date = Field(..., description="Начало приема")
    end_date: date = Field(..., description="Конец приема")
    times: List[str] = Field(..., description="Список времен приема в формате HH:MM")
    period_type: str = Field(..., description="Период приема: daily/every_other_day")
    family_member_id: Optional[int] = Field(None, description="ID члена семьи")


class UpdateAppointmentStatusRequest(BaseModel):
    appointment_id: int = Field(..., description="ID приема")
    status: str = Field(..., description="Статус: pending/taken/skipped")


class AppointmentResponse(BaseModel):
    id: int
    medication_id: int
    medication_name: str
    date: date
    time: str
    status: str
    family_member_id: Optional[int] = None


class DailyAppointmentsResponse(BaseModel):
    date: date
    appointments: List[AppointmentResponse]
    stats: dict


class AppointmentsCalendarResponse(BaseModel):
    current_date: date
    selected_date: date
    total_appointments: int
    completed_today: str
    appointments: List[AppointmentResponse]

