from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона")
    password: str = Field(..., description="Пароль")


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона")
    password: str = Field(..., description="Пароль")
    name: str = Field(..., description="Имя пользователя")


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int


class UserResponse(BaseModel):
    id: int
    phone: str
    name: str


class RefreshRequest(BaseModel):
    refresh_token: str

