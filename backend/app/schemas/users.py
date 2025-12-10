from typing import List

from pydantic import BaseModel, Field


class UpdateUserRequest(BaseModel):
    name: str | None = Field(None, description="Имя пользователя")
    sms_notifications: bool | None = Field(None, description="SMS уведомления (да/нет)")


class AddFamilyMemberRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона члена семьи")
    name: str = Field(..., description="Имя члена семьи")
    relation: str | None = Field("relative", description="Отношение")


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

