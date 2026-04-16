from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.routers import appointments, auth, health, medication_files, medications, schedules, users
from app.database import Base, engine

_SWAGGER_STATIC_DIR = Path(__file__).resolve().parent / "static" / "swagger-ui"

app = FastAPI(
    title="Fullstack API - Medication Tracker",
    description="API для трекера приема лекарств",
    version="1.0.0",
    docs_url=None,
)

Base.metadata.create_all(bind=engine)

if _SWAGGER_STATIC_DIR.is_dir():
    app.mount(
        "/static/swagger-ui",
        StaticFiles(directory=str(_SWAGGER_STATIC_DIR)),
        name="swagger-ui-static",
    )

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print(f"[REQUEST] {request.method} {request.url.path}")
        print(f"[REQUEST] Headers: {dict(request.headers)}")
        response = await call_next(request)
        print(f"[REQUEST] Response status: {response.status_code}")
        return response

app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(appointments.router, prefix="/api/v1")
app.include_router(medication_files.router, prefix="/api/v1")
app.include_router(medications.router, prefix="/api/v1")
app.include_router(schedules.router, prefix="/api/v1")


@app.get("/docs", include_in_schema=False)
async def swagger_ui_html(request: Request):
    """Swagger UI со статикой с сервера (без CDN), чтобы Try it out работал офлайн."""
    root_path = request.scope.get("root_path", "").rstrip("/")
    if _SWAGGER_STATIC_DIR.is_dir():
        return get_swagger_ui_html(
            openapi_url=f"{root_path}/openapi.json",
            title=f"{app.title} - Swagger UI",
            swagger_js_url=f"{root_path}/static/swagger-ui/swagger-ui-bundle.js",
            swagger_css_url=f"{root_path}/static/swagger-ui/swagger-ui.css",
            swagger_ui_parameters={"tryItOutEnabled": True},
        )
    return get_swagger_ui_html(
        openapi_url=f"{root_path}/openapi.json",
        title=f"{app.title} - Swagger UI",
        swagger_ui_parameters={"tryItOutEnabled": True},
    )


@app.get("/")
async def root():
    return {
        "message": "Welcome to Fullstack API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }
