from datetime import time as dt_time
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import db_models
from app.schemas.schedules import CreateScheduleRequest, MedicationScheduleResponse, TimeSlotResponse

router = APIRouter(prefix="/schedules", tags=["Schedules"])


@router.post("/", response_model=MedicationScheduleResponse)
async def create_schedule(
    schedule_data: CreateScheduleRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Создать расписание приема лекарства
    
    period_type:
    - daily: каждый день
    - every_other_day: через день
    """
    if schedule_data.period_type not in {"daily", "every_other_day"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="period_type должен быть одним из ['daily', 'every_other_day']",
        )
    medication = db.get(db_models.Medication, schedule_data.medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекарство не найдено")
    if medication.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя создавать расписание для чужого лекарства")
    family_member = db.get(db_models.FamilyMember, schedule_data.family_member_id)
    if not family_member or family_member.user_id != current_user.id:
        # prefer clear message without leaking internals
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Член семьи не найден",
        )

    schedule = db_models.Schedule(
        medication_id=medication.id,
        family_member_id=family_member.id,
        start_date=schedule_data.start_date,
        end_date=schedule_data.end_date,
        period_type=schedule_data.period_type,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    slots = []
    for slot in schedule_data.time_slots:
        slot_time = dt_time(hour=slot.hour, minute=slot.minute)
        time_slot = db_models.TimeSlot(schedule_id=schedule.id, time=slot_time)
        db.add(time_slot)
        slots.append(time_slot)
    db.commit()
    for slot in slots:
        db.refresh(slot)

    return MedicationScheduleResponse(
        id=schedule.id,
        medication_id=schedule.medication_id,
        medication_name=medication.name,
        family_member_id=schedule.family_member_id,
        family_member_name=family_member.name,
        start_date=schedule.start_date,
        end_date=schedule.end_date,
        time_slots=[TimeSlotResponse(id=slot.id, time=slot.time.strftime("%H:%M")) for slot in slots],
        period_type=schedule.period_type,
    )


@router.get("/", response_model=List[MedicationScheduleResponse])
async def get_schedules(
    family_member_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Получить список расписаний для члена семьи
    """
    schedules = (
        db.query(db_models.Schedule)
        .join(db_models.FamilyMember, db_models.FamilyMember.id == db_models.Schedule.family_member_id)
        .filter(db_models.FamilyMember.user_id == current_user.id)
        .filter(db_models.Schedule.family_member_id == family_member_id)
        .all()
    )
    response = []
    for schedule in schedules:
        medication = db.get(db_models.Medication, schedule.medication_id)
        member = db.get(db_models.FamilyMember, schedule.family_member_id)
        time_slots = db.query(db_models.TimeSlot).filter_by(schedule_id=schedule.id).all()
        response.append(
            MedicationScheduleResponse(
                id=schedule.id,
                medication_id=schedule.medication_id,
                medication_name=medication.name if medication else "Unknown",
                family_member_id=schedule.family_member_id,
                family_member_name=member.name if member else "Unknown",
                start_date=schedule.start_date,
                end_date=schedule.end_date,
                time_slots=[TimeSlotResponse(id=slot.id, time=slot.time.strftime("%H:%M")) for slot in time_slots],
                period_type=schedule.period_type,
            )
        )
    return response


@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int, db: Session = Depends(get_db), current_user: db_models.User = Depends(get_current_user)
):
    """
    Удалить расписание
    """
    schedule = db.get(db_models.Schedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Расписание не найдено")
    owner = db.get(db_models.FamilyMember, schedule.family_member_id)
    if not owner or owner.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя удалять чужое расписание")
    db.delete(schedule)
    db.commit()
    return {"status": "deleted", "schedule_id": schedule_id}
