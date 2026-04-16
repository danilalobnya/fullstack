from typing import Optional

from fastapi import Depends, Header, HTTPException, Query, status

from app.dependencies.auth import get_current_user
from app.models import db_models


def resolve_target_user_id(
    current_user: db_models.User = Depends(get_current_user),
    user_id: Optional[int] = Query(
        None,
        description="Только для роли admin: сузить выборку до лекарств указанного пользователя",
    ),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
) -> int:
    if current_user.role == "admin":
        if user_id is not None:
            return user_id
        if x_user_id is not None:
            return x_user_id
        return current_user.id
    if user_id is not None or x_user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Указывать user_id может только администратор",
        )
    return current_user.id


def assert_medication_readable(medication: db_models.Medication, user: db_models.User) -> None:
    if medication.user_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому лекарству",
        )


def assert_medication_writable(medication: db_models.Medication, user: db_models.User) -> None:
    """Изменять могут владелец; админ — по заданию согласован с RBAC (только просмотр чужих — без записи)."""
    if medication.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нельзя изменять чужое лекарство",
        )
