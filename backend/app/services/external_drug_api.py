from __future__ import annotations

import asyncio
import re
import time
from collections import deque
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import settings
from app.schemas.external_api import DrugInfoItem


class ExternalApiRateLimitError(RuntimeError):
    pass


@dataclass
class ExternalApiResult:
    items: list[DrugInfoItem]
    source_available: bool


class _RateLimiter:
    def __init__(self, max_per_minute: int) -> None:
        self.max_per_minute = max(1, max_per_minute)
        self.hits: deque[float] = deque()

    def check(self) -> None:
        now = time.time()
        window = now - 60
        while self.hits and self.hits[0] < window:
            self.hits.popleft()
        if len(self.hits) >= self.max_per_minute:
            raise ExternalApiRateLimitError("Rate limit exceeded for external API")
        self.hits.append(now)


_limiter = _RateLimiter(settings.external_api_rate_limit_per_minute)

_DEFAULT_HEADERS = {
    "User-Agent": "MedicationTracker/1.0 (+https://example.local; contact=dev@example.local)",
    "Accept": "application/json",
}


def _extract_items(payload: dict[str, Any]) -> list[DrugInfoItem]:
    rows = payload.get("results") or []
    normalized: list[DrugInfoItem] = []
    for row in rows[:5]:
        openfda = row.get("openfda") or {}
        brand = (openfda.get("brand_name") or [None])[0]
        generic = (openfda.get("generic_name") or [None])[0]
        title = brand or generic or "Unknown drug"
        indication = (row.get("indications_and_usage") or [None])[0]
        warnings = (row.get("warnings") or [None])[0]
        normalized.append(
            DrugInfoItem(
                title=title,
                indication=indication,
                warnings=warnings,
                source="openfda",
            )
        )
    return normalized


# Чем меньше — тем предпочтительнее для показа пользователю (короткие клинические/брендовые строки).
_RXNAV_TTY_RANK: dict[str, int] = {
    "SCD": 0,
    "SBD": 1,
    "SY": 3,
    "BN": 2,
    "IN": 5,
    "PIN": 6,
    "MIN": 7,
    "GPCK": 40,
    "BPCK": 50,
}


def _rxnav_tty_rank(tty: str | None) -> int:
    if not tty:
        return 35
    return _RXNAV_TTY_RANK.get(tty, 30)


def _rxnav_display_line(prop: dict[str, Any]) -> str:
    name = (prop.get("name") or "").strip()
    syn_raw = prop.get("synonym")
    syn = syn_raw.strip() if isinstance(syn_raw, str) else ""
    if syn and len(syn) + 12 < len(name):
        return syn
    return name


def _extract_rxnav_items(payload: dict[str, Any], query: str) -> list[DrugInfoItem]:
    group = payload.get("drugGroup") or {}
    concept_groups = group.get("conceptGroup") or []
    q = query.strip().lower()

    rows: list[tuple[int, int, int, str, str | None]] = []
    for cg in concept_groups:
        tty = cg.get("tty")
        rank = _rxnav_tty_rank(tty if isinstance(tty, str) else None)
        for prop in cg.get("conceptProperties") or []:
            display = _rxnav_display_line(prop)
            if not display:
                continue
            rxcui = prop.get("rxcui")
            rxcui_s = str(rxcui) if rxcui is not None else None
            pos = display.lower().find(q) if q else 0
            if pos < 0:
                pos = 9999
            rows.append((rank, len(display), pos, display, rxcui_s))

    rows.sort(key=lambda t: (t[0], t[1], t[2]))

    out: list[DrugInfoItem] = []
    seen_rxcui: set[str] = set()
    seen_title: set[str] = set()
    for _rank, _ln, _pos, display, rxcui_s in rows:
        tkey = display.lower()
        if tkey in seen_title:
            continue
        if rxcui_s:
            if rxcui_s in seen_rxcui:
                continue
            seen_rxcui.add(rxcui_s)
        seen_title.add(tkey)
        out.append(
            DrugInfoItem(
                title=display,
                indication=None,
                warnings=None,
                source="rxnav",
            )
        )
        if len(out) >= 5:
            break
    return out


async def _fetch_openfda(client: httpx.AsyncClient, search: str) -> httpx.Response:
    params: dict[str, str] = {"search": search, "limit": "5"}
    if settings.external_drug_api_key:
        params["api_key"] = settings.external_drug_api_key
    return await client.get(settings.external_drug_api_url, params=params, headers=_DEFAULT_HEADERS)


async def _fetch_rxnav(client: httpx.AsyncClient, name: str) -> httpx.Response:
    return await client.get(
        settings.external_rxnav_drugs_url,
        params={"name": name},
        headers=_DEFAULT_HEADERS,
    )


def _strip_rxnav_dose_tail(name: str) -> str:
    """«ibuprofen 400 MG Oral Tablet» → «ibuprofen» — полная SCD-строка в RxNav drugs.json часто не ищется."""
    t = name.strip()
    m = re.match(r"^(.+?)\s+\d+(?:\.\d+)?\s*(MG|MCG|ML)\b", t, re.IGNORECASE)
    if m:
        base = m.group(1).strip()
        if len(base) >= 2:
            return base
    return t


def _rxnav_query_variants(query: str) -> list[str]:
    raw = query.strip()
    if not raw:
        return []
    stripped = _strip_rxnav_dose_tail(raw)
    out: list[str] = []
    for cand in (raw, stripped):
        if cand and cand not in out:
            out.append(cand)
    return out


async def search_drug_info(query: str) -> ExternalApiResult:
    q = query.strip()
    if not q:
        return ExternalApiResult(items=[], source_available=True)

    _limiter.check()

    escaped = q.replace('"', '\\"')
    searches = [
        f'openfda.brand_name:"{escaped}"',
        f'openfda.generic_name:"{escaped}"',
        f'openfda.substance_name:"{escaped}"',
    ]

    last_error: Exception | None = None
    for attempt in range(settings.external_api_retry_count + 1):
        try:
            async with httpx.AsyncClient(timeout=settings.external_api_timeout_seconds) as client:
                openfda_ok = False
                for search in searches:
                    resp = await _fetch_openfda(client, search)
                    if resp.status_code == 404:
                        openfda_ok = True
                        continue
                    if resp.status_code == 403:
                        # FDA/WAF может резать некоторые сети — переходим на RxNav
                        break
                    resp.raise_for_status()
                    openfda_ok = True
                    data = resp.json()
                    items = _extract_items(data)
                    if items:
                        return ExternalApiResult(items=items, source_available=True)

                # OpenFDA вернулся, но без подходящих записей (или был 403) — пробуем RxNav
                for rx_q in _rxnav_query_variants(q):
                    rx = await _fetch_rxnav(client, rx_q)
                    if rx.status_code == 404:
                        continue
                    rx.raise_for_status()
                    payload = rx.json()
                    groups = (payload.get("drugGroup") or {}).get("conceptGroup") or []
                    if not groups:
                        continue
                    rx_items = _extract_rxnav_items(payload, rx_q.strip().lower())
                    if rx_items:
                        return ExternalApiResult(items=rx_items, source_available=True)
                return ExternalApiResult(items=[], source_available=openfda_ok or True)
        except (httpx.TimeoutException, httpx.NetworkError, httpx.HTTPStatusError) as exc:
            last_error = exc
            if attempt < settings.external_api_retry_count:
                await asyncio.sleep(0.3 * (attempt + 1))
                continue
            return ExternalApiResult(items=[], source_available=False)

    _ = last_error
    return ExternalApiResult(items=[], source_available=False)
