from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models import db_models
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPairResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenPairResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Вход в систему
    Проверка номера телефона и пароля
    Возвращает JWT токен
    """
    user = db.query(db_models.User).filter(db_models.User.phone == credentials.phone).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный телефон или пароль",
        )
    access = create_access_token({"sub": str(user.id)})
    refresh = create_refresh_token({"sub": str(user.id)})

    db_refresh = db_models.RefreshToken(
        user_id=user.id,
        token=refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        revoked=False,
    )
    db.add(db_refresh)
    db.commit()
    return TokenPairResponse(access_token=access, refresh_token=refresh, user_id=user.id)


@router.post("/register", response_model=UserResponse)
async def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Регистрация нового пользователя
    Создает аккаунт с номером телефона, паролем и именем
    """
    existing = db.query(db_models.User).filter(db_models.User.phone == user_data.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким телефоном уже существует",
        )

    user = db_models.User(
        phone=user_data.phone,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
        sms_notifications=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, phone=user.phone, name=user.name)


@router.post("/refresh", response_model=TokenPairResponse)
async def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    """
    Обновление токена
    """
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh" or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный refresh-токен")

    token_row = (
        db.query(db_models.RefreshToken)
        .filter(db_models.RefreshToken.token == data.refresh_token, db_models.RefreshToken.revoked.is_(False))
        .first()
    )
    if not token_row or token_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh-токен истек или отозван")

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError, JWTError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")

    user = db.get(db_models.User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    # rotate refresh
    token_row.revoked = True
    new_refresh = create_refresh_token({"sub": str(user.id)})
    new_access = create_access_token({"sub": str(user.id)})
    db.add(
        db_models.RefreshToken(
            user_id=user.id,
            token=new_refresh,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            revoked=False,
        )
    )
    db.commit()

    return TokenPairResponse(access_token=new_access, refresh_token=new_refresh, user_id=user.id)
