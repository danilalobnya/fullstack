from fastapi import APIRouter

# TODO: Импортировать роутеры для различных модулей
# from app.routers.v1 import users, items, orders

router = APIRouter()


@router.get("/")
async def api_info():
    """
    Информация об API
    """
    return {
        "message": "API Version 1.0",
        "endpoints": {
            # TODO: Добавить список доступных эндпоинтов
            "health": "/api/v1/health",
        }
    }


# TODO: Подключить роутеры после создания
# router.include_router(users.router, prefix="/users", tags=["Users"])
# router.include_router(items.router, prefix="/items", tags=["Items"])
# router.include_router(orders.router, prefix="/orders", tags=["Orders"])
