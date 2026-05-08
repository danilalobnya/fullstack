import httpx
r = httpx.get(
    "https://api.fda.gov/drug/label.json",
    params={"search": "openfda.generic_name:aspirin", "limit": 1},
    timeout=10,
)
print(r.status_code)
