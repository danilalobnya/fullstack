import pytest
from fastapi.testclient import TestClient


def _create_med(client: TestClient, headers: dict[str, str], name: str, food: str = "with") -> int:
    res = client.post(
        "/api/v1/medications/",
        headers=headers,
        json={
            "name": name,
            "quantity": "10 tabs",
            "dosage": "2x day",
            "description": f"desc {name}",
            "take_with_food": food,
        },
    )
    assert res.status_code == 200, res.text
    return res.json()["id"]


@pytest.mark.integration
def test_medications_pagination_filter_and_sort(client: TestClient, auth_headers: dict[str, str]):
    _create_med(client, auth_headers, "Ibuprofen", "with")
    _create_med(client, auth_headers, "Aspirin", "before")
    _create_med(client, auth_headers, "Paracetamol", "after")

    res = client.get(
        "/api/v1/medications/",
        headers=auth_headers,
        params={"q": "spir", "sort_by": "name", "sort_order": "asc", "page": 1, "page_size": 2},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["name"] == "Aspirin"


@pytest.mark.integration
def test_medications_page_size_validation_422(client: TestClient, auth_headers: dict[str, str]):
    res = client.get("/api/v1/medications/", headers=auth_headers, params={"page": 1, "page_size": 500})
    assert res.status_code == 422


@pytest.mark.integration
def test_import_external_drug_and_duplicate_conflict(client: TestClient, auth_headers: dict[str, str]):
    payload = {"title": "ibuprofen 400 MG Oral Tablet", "indication": None, "warnings": None}

    first = client.post("/api/v1/external/drug-info/import", headers=auth_headers, json=payload)
    assert first.status_code == 200
    assert first.json()["description"] == "Импортировано из внешнего API"

    second = client.post("/api/v1/external/drug-info/import", headers=auth_headers, json=payload)
    assert second.status_code == 409
