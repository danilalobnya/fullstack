from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def api_info():
    return {
        "message": "API Version 1.0",
        "endpoints": {
            "health": "/api/v1/health"
        }
    }
