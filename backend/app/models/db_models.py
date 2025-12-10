from datetime import date

from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    sms_notifications = Column(Boolean, default=True)

    family_members = relationship("FamilyMember", back_populates="user", cascade="all, delete")
    medications = relationship("Medication", back_populates="user", cascade="all, delete")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relation = Column(String, default="relative")

    user = relationship("User", back_populates="family_members")
    schedules = relationship("Schedule", back_populates="family_member", cascade="all, delete")
    appointments = relationship("Appointment", back_populates="family_member", cascade="all, delete")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    description = Column(String, nullable=True)
    take_with_food = Column(String, nullable=True)

    user = relationship("User", back_populates="medications")
    appointments = relationship("Appointment", back_populates="medication", cascade="all, delete")
    schedules = relationship("Schedule", back_populates="medication", cascade="all, delete")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    status = Column(String, default="pending")

    medication = relationship("Medication", back_populates="appointments")
    family_member = relationship("FamilyMember", back_populates="appointments")
    user = relationship("User")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    period_type = Column(String, nullable=False)

    medication = relationship("Medication", back_populates="schedules")
    family_member = relationship("FamilyMember", back_populates="schedules")
    time_slots = relationship("TimeSlot", back_populates="schedule", cascade="all, delete")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    time = Column(Time, nullable=False)

    schedule = relationship("Schedule", back_populates="time_slots")

