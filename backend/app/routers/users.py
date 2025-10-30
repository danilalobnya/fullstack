from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])


class UpdateUserRequest(BaseModel):
    name: str = Field(None, description="Имя пользователя")
    sms_notifications: bool = Field(None, description="SMS уведомления (да/нет)")


class AddFamilyMemberRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона члена семьи")
    name: str = Field(..., description="Имя члена семьи")


class UserProfileResponse(BaseModel):
    id: int
    phone: str
    name: str
    sms_notifications: bool


class FamilyMemberResponse(BaseModel):
    id: int
    name: str
    phone: str
    relation: str


class UserFullProfileResponse(BaseModel):
    user: UserProfileResponse
    family_members: List[FamilyMemberResponse]


# Endpoints
@router.get("/me", response_model=UserFullProfileResponse)
async def get_profile():
    """
    Получить свой профиль
    Возвращает информацию о пользователе и всех членах семьи
    """
    pass


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(data: UpdateUserRequest):
    """
    Обновить свой профиль
    Изменить имя и/или настройку SMS уведомлений
    """
    pass


@router.post("/me/family", response_model=FamilyMemberResponse)
async def add_family_member(member_data: AddFamilyMemberRequest):
    """
    Добавить члена семьи
    """
    pass


@router.delete("/me/family/{member_id}")
async def remove_family_member(member_id: int):
    """
    Удалить члена семьи
    """
    pass


@router.get("/me/family", response_model=List[FamilyMemberResponse])
async def get_family_members():
    """
    Получить список членов семьи
    """
    pass
