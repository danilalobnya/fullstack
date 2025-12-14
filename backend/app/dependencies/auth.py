import logging
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

