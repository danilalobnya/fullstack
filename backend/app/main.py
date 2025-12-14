from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.routers import appointments, auth, health, medications, schedules, users
from app.database import Base, engine

app = FastAPI(
    title="Fullstack API - Medication Tracker",
    description="API для трекера приема лекарств",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

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
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(appointments.router, prefix="/api/v1")
app.include_router(medications.router, prefix="/api/v1")
app.include_router(schedules.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to Fullstack API", "version": "1.0.0"}
