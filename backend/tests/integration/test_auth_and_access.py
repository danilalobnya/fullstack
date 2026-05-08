import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
def test_register_login_and_refresh_rotation(client: TestClient):
    reg = client.post(
        "/api/v1/auth/register",
        json={"phone": "+7 911 111 11 11", "password": "password123", "name": "Alice"},
    )
    assert reg.status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={"phone": "+79111111111", "password": "password123"},
    )
    assert login.status_code == 200
    body = login.json()
    assert "access_token" in body and "refresh_token" in body

    refresh = client.post("/api/v1/auth/refresh", json={"refresh_token": body["refresh_token"]})
    assert refresh.status_code == 200
    refreshed = refresh.json()
    assert refreshed["refresh_token"] != body["refresh_token"]


@pytest.mark.integration
def test_login_wrong_password_returns_401(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={"phone": "+7 922 222 22 22", "password": "password123", "name": "Bob"},
    )

    res = client.post(
        "/api/v1/auth/login",
        json={"phone": "+79222222222", "password": "wrong"},
    )
    assert res.status_code == 401


@pytest.mark.integration
def test_medications_requires_auth(client: TestClient):
    res = client.get("/api/v1/medications/")
    assert res.status_code == 403
