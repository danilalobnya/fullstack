from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import db_models
from app.dependencies.auth import get_current_user
from app.schemas.users import (
    AddFamilyMemberRequest,
    FamilyMemberResponse,
    UpdateUserRequest,
    UserFullProfileResponse,
    UserProfileResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserFullProfileResponse)
async def get_profile(
    current_user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Получить свой профиль
    Возвращает информацию о пользователе и всех членах семьи
    """
    user = current_user
    family_members = db.query(db_models.FamilyMember).filter_by(user_id=user.id).all()
    return UserFullProfileResponse(
        user=UserProfileResponse(
            id=user.id, phone=user.phone, name=user.name, sms_notifications=user.sms_notifications
        ),
        family_members=[
            FamilyMemberResponse(
                id=member.id, name=member.name, phone=member.phone, relation=member.relation
            )
            for member in family_members
        ],
    )


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    data: UpdateUserRequest,
    current_user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Обновить свой профиль
    Изменить имя и/или настройку SMS уведомлений
    """
    user = current_user
    if data.name is not None:
        user.name = data.name
    if data.sms_notifications is not None:
        user.sms_notifications = data.sms_notifications
    db.commit()
    db.refresh(user)
    return UserProfileResponse(
        id=user.id,
        phone=user.phone,
        name=user.name,
        sms_notifications=user.sms_notifications,
    )


@router.post("/me/family", response_model=FamilyMemberResponse)
async def add_family_member(
    member_data: AddFamilyMemberRequest,
    current_user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Добавить члена семьи
    """
    user = current_user
    member = db_models.FamilyMember(
        user_id=user.id, name=member_data.name, phone=member_data.phone, relation=member_data.relation or "relative"
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return FamilyMemberResponse(
        id=member.id,
        name=member.name,
        phone=member.phone,
        relation=member.relation,
    )


@router.delete("/me/family/{member_id}")
async def remove_family_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Удалить члена семьи
    """
    deleted = db.get(db_models.FamilyMember, member_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Член семьи не найден")
    if deleted.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя удалить чужого члена семьи")
    db.delete(deleted)
    db.commit()
    return {"status": "deleted", "member_id": member_id}


@router.get("/me/family", response_model=List[FamilyMemberResponse])
async def get_family_members(
    current_user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Получить список членов семьи
    """
    user = current_user
    members = db.query(db_models.FamilyMember).filter_by(user_id=user.id).all()
    return [
        FamilyMemberResponse(
            id=member.id,
            name=member.name,
            phone=member.phone,
            relation=member.relation,
        )
        for member in members
    ]
