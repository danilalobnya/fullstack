import logging
from typing import Iterable, List

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import db_models
from app.utils.security import decode_token

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> db_models.User:
    """
    Получить текущего пользователя по токену из заголовка authorization
    Токен передается напрямую без префикса "Bearer" - HTTPBearer автоматически его обработает
    """
    token: str | None = None
    
    # HTTPBearer автоматически извлекает токен из заголовка Authorization
    if credentials and credentials.credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated")

    try:
        payload = decode_token(token)
    except JWTError:
        payload = None

    if not payload or payload.get("type") != "access" or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный или истекший токен")

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")

    user = db.get(db_models.User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
    return user


def require_roles(allowed_roles: Iterable[str]):
    """
    Dependency-фабрика для проверки роли пользователя (RBAC).
    Пример использования:

    @router.get("/admin-only", dependencies=[Depends(require_roles(["admin"]))])
    """

    allowed = set(allowed_roles)

    def _checker(current_user: db_models.User = Depends(get_current_user)) -> db_models.User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для выполнения этого действия",
            )
        return current_user

    return _checker


def require_admin(current_user: db_models.User = Depends(get_current_user)) -> db_models.User:
    """
    Упрощенный dependency для проверки роли администратора.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ разрешен только администраторам",
        )
    return current_user

