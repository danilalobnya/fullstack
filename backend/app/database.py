from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# TODO: Настроить подключение к БД
# engine = create_engine(settings.database_url)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

engine = None
SessionLocal = None
Base = None


def get_db():
    # TODO: Реализовать после настройки БД
    pass
