from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import db_models
from app.schemas.appointments import (
    AppointmentsCalendarResponse,
    AppointmentResponse,
    CreateAppointmentRequest,
    DailyAppointmentsResponse,
    UpdateAppointmentStatusRequest,
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("/calendar", response_model=AppointmentsCalendarResponse)
async def get_appointments_calendar(
    user_id: int,
    selected_date: Optional[date] = None,
    view_type: str = Query("month", description="month/week"),
    selected_family_member: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Получить календарь приемов
    view_type: month (месяц) или week (неделя)
    selected_family_member: ID члена семьи для отображения его приемов
    """
    if view_type not in {"month", "week"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="view_type должен быть month или week",
        )
    current = selected_date or date.today()
    target_user_id = user_id or current_user.id
    appointments = (
        db.query(db_models.Appointment)
        .filter(db_models.Appointment.user_id == target_user_id)
        .filter(db_models.Appointment.date == current)
        .filter(
            db_models.Appointment.family_member_id == selected_family_member
            if selected_family_member
            else True
        )
        .all()
    )
    total = len(appointments)
    completed = len([a for a in appointments if a.status == "taken"])
    return AppointmentsCalendarResponse(
        current_date=current,
        selected_date=current,
        total_appointments=total,
        completed_today=f"{completed}/{total or 0}",
        appointments=[
            AppointmentResponse(
                id=a.id,
                medication_id=a.medication_id,
                medication_name=a.medication.name if a.medication else "",
                date=a.date,
                time=a.time.strftime("%H:%M"),
                status=a.status,
                family_member_id=a.family_member_id,
            )
            for a in appointments
        ],
    )


@router.get("/day/{date}", response_model=DailyAppointmentsResponse)
async def get_day_appointments(
    date: date,
    user_id: int,
    family_member_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Получить приемы на конкретный день
    """
    target_user_id = user_id or current_user.id
    query = db.query(db_models.Appointment).filter(db_models.Appointment.user_id == target_user_id).filter(
        db_models.Appointment.date == date
    )
    if family_member_id:
        query = query.filter(db_models.Appointment.family_member_id == family_member_id)
    appointments = query.all()
    stats = {"pending": 0, "taken": 0, "skipped": 0}
    for a in appointments:
        if a.status in stats:
            stats[a.status] += 1
    stats["total"] = len(appointments)
    return DailyAppointmentsResponse(
        date=date,
        appointments=[
            AppointmentResponse(
                id=a.id,
                medication_id=a.medication_id,
                medication_name=a.medication.name if a.medication else "",
                date=a.date,
                time=a.time.strftime("%H:%M"),
                status=a.status,
                family_member_id=a.family_member_id,
            )
            for a in appointments
        ],
        stats=stats,
    )


@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    appointment_data: CreateAppointmentRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Создать прием лекарства
    """
    medication = db.get(db_models.Medication, appointment_data.medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    if medication.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя создавать приемы для чужого лекарства")
    if appointment_data.period_type not in {"daily", "every_other_day"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="period_type должен быть одним из ['daily', 'every_other_day']",
        )
    # family optional
    family_member_id = appointment_data.family_member_id
    if family_member_id:
        family_member = db.get(db_models.FamilyMember, family_member_id)
        if not family_member or family_member.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Член семьи не найден")

    step = 1 if appointment_data.period_type == "daily" else 2
    current = appointment_data.start_date
    last_created = None
    while current <= appointment_data.end_date:
        for tm in appointment_data.times:
            try:
                parsed_time = datetime.strptime(tm, "%H:%M").time()
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный формат времени HH:MM")
            appointment = db_models.Appointment(
                user_id=current_user.id,
                medication_id=medication.id,
                family_member_id=family_member_id,
                date=current,
                time=parsed_time,
                status="pending",
            )
            db.add(appointment)
            last_created = appointment
        current = current + timedelta(days=step)
    db.commit()
    if last_created:
        db.refresh(last_created)
        return AppointmentResponse(
            id=last_created.id,
            medication_id=last_created.medication_id,
            medication_name=medication.name,
            date=last_created.date,
            time=last_created.time.strftime("%H:%M"),
            status=last_created.status,
            family_member_id=last_created.family_member_id,
        )
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Приемы не были созданы")


@router.put("/status", response_model=AppointmentResponse)
async def update_appointment_status(
    status_data: UpdateAppointmentStatusRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Обновить статус приема
    Статусы: pending (предстоит), taken (принял), skipped (не принял)
    """
    if status_data.status not in {"pending", "taken", "skipped"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status должен быть одним из ['pending', 'taken', 'skipped']",
        )
    appointment = db.get(db_models.Appointment, status_data.appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Прием не найден")
    if appointment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя изменять чужой прием")
    appointment.status = status_data.status
    db.commit()
    db.refresh(appointment)
    return AppointmentResponse(
        id=appointment.id,
        medication_id=appointment.medication_id,
        medication_name=appointment.medication.name if appointment.medication else "",
        date=appointment.date,
        time=appointment.time.strftime("%H:%M"),
        status=appointment.status,
        family_member_id=appointment.family_member_id,
    )


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Удалить прием
    """
    appointment = db.get(db_models.Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Прием не найден")
    if appointment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя удалять чужой прием")
    db.delete(appointment)
    db.commit()
    return {"status": "deleted", "appointment_id": appointment_id}


@router.get("/pdf")
async def print_appointments_pdf(
    user_id: int,
    start_date: date,
    end_date: date,
    family_member_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Печать списка приемов в PDF формате
    """
    target_user_id = user_id or current_user.id
    query = db.query(db_models.Appointment).filter(db_models.Appointment.user_id == target_user_id)
    if family_member_id:
        query = query.filter(db_models.Appointment.family_member_id == family_member_id)
    appointments = query.filter(db_models.Appointment.date.between(start_date, end_date)).all()
    return {
        "message": "PDF генерация упрощена для лабораторной работы",
        "count": len(appointments),
        "appointments": [
            {
                "id": a.id,
                "medication_id": a.medication_id,
                "medication_name": a.medication.name if a.medication else "",
                "family_member_id": a.family_member_id,
                "date": a.date.isoformat(),
                "time": a.time.strftime("%H:%M"),
                "status": a.status,
            }
            for a in appointments
        ],
    }
