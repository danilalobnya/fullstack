import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Test DB isolated from local dev DB
TEST_DB_URL = "sqlite:///./tests_lab5.db"
os.environ["DATABASE_URL"] = TEST_DB_URL

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, future=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def user_tokens(client: TestClient) -> dict[str, str]:
    phone = "+7 999 123 45 67"
    password = "password123"
    register = client.post(
        "/api/v1/auth/register",
        json={"phone": phone, "password": password, "name": "User"},
    )
    assert register.status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={"phone": "+79991234567", "password": password},
    )
    assert login.status_code == 200
    tokens = login.json()
    return {
        "access": tokens["access_token"],
        "refresh": tokens["refresh_token"],
    }


@pytest.fixture()
def auth_headers(user_tokens: dict[str, str]) -> dict[str, str]:
    return {"Authorization": f"Bearer {user_tokens['access']}"}
