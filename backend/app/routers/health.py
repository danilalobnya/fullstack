from fastapi import APIRouter, status
from pydantic import BaseModel
from datetime import datetime

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
    # TODO: Добавить проверку подключения к БД
    # TODO: Добавить проверку других зависимостей
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "fullstack-api",
        "components": {
            "database": "connected",
            "api": "running"
        }
    }
