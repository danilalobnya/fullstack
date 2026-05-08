import pytest
from fastapi.testclient import TestClient


@pytest.mark.e2e
def test_e2e_user_crud_flow_for_medications(client: TestClient, auth_headers: dict[str, str]):
    create = client.post(
        "/api/v1/medications/",
        headers=auth_headers,
        json={
            "name": "Metformin",
            "quantity": "30 tablets",
            "dosage": "500mg",
            "description": "for sugar",
            "take_with_food": "with",
        },
    )
    assert create.status_code == 200
    med_id = create.json()["id"]

    read = client.get(f"/api/v1/medications/{med_id}", headers=auth_headers)
    assert read.status_code == 200
    assert read.json()["name"] == "Metformin"

    update = client.put(
        f"/api/v1/medications/{med_id}",
        headers=auth_headers,
        json={"dosage": "850mg"},
    )
    assert update.status_code == 200
    assert update.json()["dosage"] == "850mg"

    delete = client.delete(f"/api/v1/medications/{med_id}", headers=auth_headers)
    assert delete.status_code == 200

    missing = client.get(f"/api/v1/medications/{med_id}", headers=auth_headers)
    assert missing.status_code == 404


@pytest.mark.e2e
def test_e2e_seo_files_available(client: TestClient):
    robots = client.get("/robots.txt")
    sitemap = client.get("/sitemap.xml")

    assert robots.status_code == 200
    assert "Sitemap:" in robots.text
    assert sitemap.status_code == 200
    assert "<urlset" in sitemap.text
