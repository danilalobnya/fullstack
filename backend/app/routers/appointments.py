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
    family_member_id: Optional[int] = Query(None, description="ID члена семьи"),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Получить приемы на конкретный день
    """
    target_user_id = user_id or current_user.id
    
    # КРИТИЧЕСКОЕ ЛОГИРОВАНИЕ - должно появиться при каждом запросе
    print("=" * 80)
    print(f"[CRITICAL] get_day_appointments CALLED")
    print(f"[CRITICAL] date={date}, user_id={target_user_id}")
    print(f"[CRITICAL] family_member_id={family_member_id}, type={type(family_member_id)}")
    print(f"[CRITICAL] family_member_id is None: {family_member_id is None}")
    print(f"[CRITICAL] family_member_id == None: {family_member_id == None}")
    print("=" * 80)
    
    # СНАЧАЛА получаем ВСЕ назначения для пользователя и даты
    # Затем фильтруем на уровне Python для гарантии правильной работы
    all_appointments = db.query(db_models.Appointment).filter(
        db_models.Appointment.user_id == target_user_id
    ).filter(
        db_models.Appointment.date == date
    ).all()
    
    print(f"[DEBUG] SQL query returned {len(all_appointments)} appointments (before family_member_id filter)")
    
    # ФИЛЬТРАЦИЯ НА УРОВНЕ PYTHON - это гарантирует правильную работу
    appointments = []
    if family_member_id is not None:
        # Если передан family_member_id, фильтруем по нему
        print(f"[DEBUG] Filtering by family_member_id={family_member_id}")
        for apt in all_appointments:
            if apt.family_member_id == family_member_id:
                appointments.append(apt)
            else:
                print(f"[DEBUG] Skipping appointment {apt.id} (family_member_id={apt.family_member_id} != {family_member_id})")
    else:
        # Если family_member_id не передан, показываем только приемы без привязки к члену семьи (для главного пользователя)
        print(f"[DEBUG] Filtering by family_member_id IS NULL (family_member_id was not provided)")
        for apt in all_appointments:
            if apt.family_member_id is None:
                appointments.append(apt)
            else:
                print(f"[DEBUG] Skipping appointment {apt.id} (family_member_id={apt.family_member_id} is not None)")
    
    print(f"[DEBUG] After Python filter: {len(appointments)} appointments")
    for apt in appointments:
        print(f"[DEBUG] Appointment {apt.id}: family_member_id={apt.family_member_id}, medication={apt.medication.name if apt.medication else 'None'}")
    
    # ФИНАЛЬНАЯ ПРОВЕРКА - убеждаемся, что фильтрация работает правильно
    if family_member_id is None:
        # Для главного пользователя - проверяем, что все назначения имеют family_member_id = None
        invalid_appointments = [apt for apt in appointments if apt.family_member_id is not None]
        if invalid_appointments:
            print(f"[ERROR] CRITICAL: Found {len(invalid_appointments)} appointments with non-null family_member_id for main user!")
            for apt in invalid_appointments:
                print(f"[ERROR] Appointment {apt.id} has family_member_id={apt.family_member_id}")
            # Удаляем невалидные назначения
            appointments = [apt for apt in appointments if apt.family_member_id is None]
            print(f"[ERROR] Fixed: Now returning {len(appointments)} appointments")
    
    # Создаем stats из отфильтрованных appointments
    final_stats = {"pending": 0, "taken": 0, "skipped": 0}
    for a in appointments:
        if a.status in final_stats:
            final_stats[a.status] += 1
    final_stats["total"] = len(appointments)
    
    print(f"[DEBUG] ========== RETURNING {len(appointments)} appointments (family_member_id={family_member_id}) ==========")
    
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
        stats=final_stats,
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
    family_member_id: Optional[int] = Query(None, description="ID члена семьи для проверки"),
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
    
    # КРИТИЧЕСКАЯ ПРОВЕРКА: убеждаемся, что назначение принадлежит правильному пользователю/члену семьи
    # Если family_member_id не передан (главный пользователь), назначение должно иметь family_member_id = None
    # Если family_member_id передан (член семьи), назначение должно иметь family_member_id = family_member_id
    print(f"[CRITICAL] update_appointment_status: appointment_id={status_data.appointment_id}, family_member_id param={family_member_id}, appointment.family_member_id={appointment.family_member_id}")
    
    if family_member_id is None:
        # Главный пользователь - назначение должно иметь family_member_id = None
        if appointment.family_member_id is not None:
            print(f"[ERROR] Главный пользователь пытается изменить назначение для члена семьи (family_member_id={appointment.family_member_id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нельзя изменять статус приема, назначенного для члена семьи"
            )
    else:
        # Член семьи - назначение должно иметь family_member_id = family_member_id
        if appointment.family_member_id != family_member_id:
            print(f"[ERROR] Член семьи {family_member_id} пытается изменить назначение для другого пользователя (family_member_id={appointment.family_member_id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нельзя изменять статус приема другого члена семьи"
            )
    
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
    family_member_id: Optional[int] = Query(None, description="ID члена семьи для проверки"),
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
    
    # КРИТИЧЕСКАЯ ПРОВЕРКА: убеждаемся, что назначение принадлежит правильному пользователю/члену семьи
    print(f"[CRITICAL] delete_appointment: appointment_id={appointment_id}, family_member_id param={family_member_id}, appointment.family_member_id={appointment.family_member_id}")
    
    if family_member_id is None:
        # Главный пользователь - назначение должно иметь family_member_id = None
        if appointment.family_member_id is not None:
            print(f"[ERROR] Главный пользователь пытается удалить назначение для члена семьи (family_member_id={appointment.family_member_id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нельзя удалять прием, назначенный для члена семьи"
            )
    else:
        # Член семьи - назначение должно иметь family_member_id = family_member_id
        if appointment.family_member_id != family_member_id:
            print(f"[ERROR] Член семьи {family_member_id} пытается удалить назначение для другого пользователя (family_member_id={appointment.family_member_id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нельзя удалять прием другого члена семьи"
            )
    
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
