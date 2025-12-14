from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    app_name: str = "Fullstack API"
    debug: bool = Field(default=False, env="DEBUG")

    database_url: str = Field(
        default="postgresql://user:password@localhost:5432/fullstack_db",
        env="DATABASE_URL"
    )

    api_v1_prefix: str = "/api/v1"

    # Для фронтенда: безопасно читаем VITE_API_URL, чтобы не падать на лишнем поле
    vite_api_url: str | None = Field(default=None, env="VITE_API_URL")

    secret_key: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
