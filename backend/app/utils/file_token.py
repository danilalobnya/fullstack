"""Краткоживущие токены для скачивания файлов без заголовка Authorization (аналог pre-signed URL)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Optional, Tuple


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64decode(data: str) -> bytes:
    pad = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode(data + pad)


def create_file_download_token(
    secret: str,
    *,
    file_id: int,
    medication_id: int,
    max_age_seconds: int = 900,
) -> str:
    payload = {
        "fid": file_id,
        "mid": medication_id,
        "exp": int(time.time()) + max_age_seconds,
    }
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    sig = hmac.new(secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
    envelope = json.dumps({"b": body, "s": sig}, separators=(",", ":"))
    return _b64encode(envelope.encode("utf-8"))


def parse_file_download_token(secret: str, token: str) -> Optional[Tuple[int, int]]:
    try:
        envelope = json.loads(_b64decode(token).decode("utf-8"))
        body = envelope["b"]
        sig = envelope["s"]
        expect = hmac.new(secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expect, sig):
            return None
        payload = json.loads(body)
        if int(payload["exp"]) < time.time():
            return None
        return int(payload["fid"]), int(payload["mid"])
    except (KeyError, ValueError, TypeError, json.JSONDecodeError):
        return None
