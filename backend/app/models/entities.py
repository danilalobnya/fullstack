from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class BaseEntity(BaseModel):
    """Base model config shared by all entities."""

    model_config = ConfigDict(from_attributes=True)


class User(BaseEntity):
    id: int
    phone: str
    name: str
    password_hash: str
    sms_notifications: bool = True


class FamilyMember(BaseEntity):
    id: int
    user_id: int
    name: str
    phone: str
    relation: str = "relative"


class Medication(BaseEntity):
    id: int
    user_id: int
    name: str
    quantity: str
    dosage: str
    description: Optional[str] = None
    take_with_food: Optional[str] = None


class Appointment(BaseEntity):
    id: int
    user_id: int
    medication_id: int
    medication_name: str
    family_member_id: Optional[int] = None
    date: date
    time: str  # HH:MM
    status: str


class TimeSlot(BaseEntity):
    id: int
    schedule_id: int
    time: str


class Schedule(BaseEntity):
    id: int
    medication_id: int
    family_member_id: int
    start_date: date
    end_date: date
    period_type: str
    time_slots: List[TimeSlot] = []

