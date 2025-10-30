from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, time

router = APIRouter(prefix="/appointments", tags=["Appointments"])


class CreateAppointmentRequest(BaseModel):
    medication_id: int = Field(..., description="ID лекарства")
    start_date: date = Field(..., description="Начало приема")
    end_date: date = Field(..., description="Конец приема")
    times: List[str] = Field(..., description="Список времен приема в формате HH:MM")
    period_type: str = Field(..., description="Период приема: daily/every_other_day")


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


class DailyAppointmentsResponse(BaseModel):
    date: date
    appointments: List[AppointmentResponse]
    stats: dict  # {"pending": 1, "taken": 2, "skipped": 1, "total": 4}


class AppointmentsCalendarResponse(BaseModel):
    current_date: date
    selected_date: date
    total_appointments: int
    completed_today: str  # "1/4"
    appointments: List[AppointmentResponse]


# Endpoints
@router.get("/calendar", response_model=AppointmentsCalendarResponse)
async def get_appointments_calendar(
    user_id: int,
    selected_date: Optional[date] = None,
    view_type: str = Query("month", description="month/week"),
    selected_family_member: Optional[int] = None
):
    """
    Получить календарь приемов
    view_type: month (месяц) или week (неделя)
    selected_family_member: ID члена семьи для отображения его приемов
    """
    pass


@router.get("/day/{date}", response_model=DailyAppointmentsResponse)
async def get_day_appointments(
    date: date,
    user_id: int,
    family_member_id: Optional[int] = None
):
    """
    Получить приемы на конкретный день
    """
    pass


@router.post("/", response_model=AppointmentResponse)
async def create_appointment(appointment_data: CreateAppointmentRequest):
    """
    Создать прием лекарства
    """
    pass


@router.put("/status", response_model=AppointmentResponse)
async def update_appointment_status(status_data: UpdateAppointmentStatusRequest):
    """
    Обновить статус приема
    Статусы: pending (предстоит), taken (принял), skipped (не принял)
    """
    pass


@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: int):
    """
    Удалить прием
    """
    pass


@router.get("/pdf")
async def print_appointments_pdf(
    user_id: int,
    start_date: date,
    end_date: date,
    family_member_id: Optional[int] = None
):
    """
    Печать списка приемов в PDF формате
    """
    pass
