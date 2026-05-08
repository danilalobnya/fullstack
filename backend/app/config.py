from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    app_name: str = "Fullstack API"
    debug: bool = Field(default=False, env="DEBUG")

    database_url: str = Field(
        default="sqlite:///./fullstack.db",
        description="Локально по умолчанию SQLite. Для PostgreSQL задайте DATABASE_URL.",
        env="DATABASE_URL",
    )

    api_v1_prefix: str = "/api/v1"

    # Для фронтенда: безопасно читаем VITE_API_URL, чтобы не падать на лишнем поле
    vite_api_url: str | None = Field(default=None, env="VITE_API_URL")

    secret_key: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    access_token_expire_minutes: int = 30

    # Объектное хранилище (S3 / MinIO). Если не задано — локальная папка object_store.
    s3_endpoint_url: str | None = Field(default=None, env="S3_ENDPOINT_URL")
    s3_bucket: str | None = Field(default=None, env="S3_BUCKET")
    s3_access_key: str | None = Field(default=None, env="S3_ACCESS_KEY")
    s3_secret_key: str | None = Field(default=None, env="S3_SECRET_KEY")
    s3_region: str = Field(default="us-east-1", env="S3_REGION")
    object_storage_local_path: str = Field(default="./object_store", env="OBJECT_STORAGE_LOCAL_PATH")
    public_base_url: str = Field(default="http://127.0.0.1:8000", env="PUBLIC_BASE_URL")

    file_upload_max_bytes: int = Field(default=5 * 1024 * 1024, env="FILE_UPLOAD_MAX_BYTES")
    file_upload_allowed_mime: str = Field(
        default="image/jpeg,image/png,image/webp,application/pdf",
        env="FILE_UPLOAD_ALLOWED_MIME",
    )
    file_download_token_ttl_seconds: int = Field(default=900, env="FILE_DOWNLOAD_TOKEN_TTL_SECONDS")

    # External API integration (ЛР4)
    external_drug_api_url: str = Field(
        default="https://api.fda.gov/drug/label.json",
        env="EXTERNAL_DRUG_API_URL",
    )
    external_rxnav_drugs_url: str = Field(
        default="https://rxnav.nlm.nih.gov/REST/drugs.json",
        env="EXTERNAL_RXNAV_DRUGS_URL",
    )
    external_drug_api_key: str | None = Field(default=None, env="EXTERNAL_DRUG_API_KEY")
    external_api_timeout_seconds: float = Field(default=6.0, env="EXTERNAL_API_TIMEOUT_SECONDS")
    external_api_retry_count: int = Field(default=2, env="EXTERNAL_API_RETRY_COUNT")
    external_api_rate_limit_per_minute: int = Field(default=30, env="EXTERNAL_API_RATE_LIMIT_PER_MINUTE")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
