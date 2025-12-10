from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings


def _ensure_database_exists(url: str) -> None:
    """
    Создает БД, если ее нет (подключаясь к postgres/default DB).
    Работает только когда указана СУБД postgres.
    """
    db_url = make_url(url)
    if db_url.drivername not in ("postgresql", "postgresql+psycopg2"):
        return

    # Отделяем имя БД и подключаемся к системной базе
    database_name = db_url.database
    admin_url = db_url.set(database="postgres")
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT", future=True)
    with admin_engine.connect() as conn:
        conn.execute(
            text(
                f"CREATE DATABASE \"{database_name}\" "
                "WITH OWNER = %(owner)s ENCODING = 'UTF8'"
            ),
            {"owner": db_url.username},
        )


# Пытаемся создать БД, если её нет
try:
    _ensure_database_exists(settings.database_url)
except Exception:
    # Если не удалось (нет прав) — просто идем дальше, чтобы увидеть понятную ошибку подключения
    pass

engine = create_engine(settings.database_url, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
