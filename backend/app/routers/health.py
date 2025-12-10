from fastapi import APIRouter, status
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check эндпоинт для проверки работоспособности сервера
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        service="fullstack-api"
    )


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Подробный health check с информацией о системе
    """
    db_status = "unknown"
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
            db_status = "connected"
    except SQLAlchemyError:
        db_status = "error"

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "fullstack-api",
        "components": {
            "database": db_status,
            "api": "running"
        }
    }
