from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, auth, users, appointments, medications, schedules

app = FastAPI(
    title="Fullstack API - Medication Tracker",
    description="API для трекера приема лекарств",
    version="1.0.0"
)

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
