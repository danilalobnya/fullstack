from fastapi import APIRouter, Header, HTTPException, status, Depends
from jose import JWTError
from sqlalchemy.orm import Session

from app.utils.security import create_access_token, decode_token, get_password_hash, verify_password
from app.database import get_db
from app.models import db_models
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
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
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id)


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


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    authorization: str = Header(None, alias="Authorization"), db: Session = Depends(get_db)
):
    """
    Обновление токена
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен не найден",
        )
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный токен",
        )
    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError, JWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный токен",
        )
    user = db.get(db_models.User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )
    new_token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=new_token, user_id=user.id)
