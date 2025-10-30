from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона")
    password: str = Field(..., description="Пароль")


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона")
    password: str = Field(..., description="Пароль")
    name: str = Field(..., description="Имя пользователя")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int


class UserResponse(BaseModel):
    id: int
    phone: str
    name: str


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Вход в систему
    Проверка номера телефона и пароля
    Возвращает JWT токен
    """
    pass


@router.post("/register", response_model=UserResponse)
async def register(user_data: RegisterRequest):
    """
    Регистрация нового пользователя
    Создает аккаунт с номером телефона, паролем и именем
    """
    pass


@router.post("/refresh")
async def refresh_token():
    """
    Обновление токена
    """
    pass
