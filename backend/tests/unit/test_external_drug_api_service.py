import pytest

from app.services import external_drug_api as svc


@pytest.mark.unit
def test_strip_rxnav_dose_tail():
    assert svc._strip_rxnav_dose_tail("ibuprofen 400 MG Oral Tablet") == "ibuprofen"
    assert svc._strip_rxnav_dose_tail("aspirin") == "aspirin"


@pytest.mark.unit
def test_rxnav_query_variants_deduplicate():
    assert svc._rxnav_query_variants("aspirin") == ["aspirin"]
    assert svc._rxnav_query_variants("ibuprofen 400 MG Oral Tablet") == [
        "ibuprofen 400 MG Oral Tablet",
        "ibuprofen",
    ]


@pytest.mark.unit
def test_extract_rxnav_items_prefers_shorter_and_deduplicates():
    payload = {
        "drugGroup": {
            "conceptGroup": [
                {
                    "tty": "BPCK",
                    "conceptProperties": [
                        {
                            "rxcui": "1",
                            "name": "{very long package name with details}",
                            "synonym": "Short Brand",
                        }
                    ],
                },
                {
                    "tty": "SCD",
                    "conceptProperties": [
                        {
                            "rxcui": "2",
                            "name": "ibuprofen 400 MG Oral Tablet",
                            "synonym": "ibuprofen 400 MG Oral Tablet",
                        }
                    ],
                },
            ]
        }
    }
    items = svc._extract_rxnav_items(payload, "ibuprofen")

    assert len(items) == 2
    assert items[0].title == "ibuprofen 400 MG Oral Tablet"
    assert items[0].source == "rxnav"
    assert items[1].title == "Short Brand"


@pytest.mark.unit
def test_rate_limiter_raises_when_limit_exceeded():
    limiter = svc._RateLimiter(max_per_minute=1)
    limiter.check()
    with pytest.raises(svc.ExternalApiRateLimitError):
        limiter.check()
