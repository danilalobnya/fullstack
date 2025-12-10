from fastapi import Depends, Header, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import db_models
from app.utils.security import decode_token


def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> db_models.User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется заголовок Authorization: Bearer <token>",
        )

    token = authorization.split(" ", 1)[1]
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

