"""Password hashing and signed bearer tokens, using only the standard library."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time

PBKDF2_ITERATIONS = 120_000
TOKEN_LIFETIME_SECONDS = 12 * 60 * 60  # one working day


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2${PBKDF2_ITERATIONS}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, digest = stored.split("$")
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), _unb64(salt), int(iterations))
    return hmac.compare_digest(candidate, _unb64(digest))


def _secret() -> bytes:
    secret = os.environ.get("AUTH_SECRET")
    if not secret:
        raise RuntimeError("AUTH_SECRET is not set")
    return secret.encode()


def issue_token(user: dict) -> str:
    payload = {"uid": user["id"], "role": user["role"], "name": user["name"], "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS}
    body = _b64(json.dumps(payload, separators=(",", ":")).encode())
    signature = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{signature}"


def read_token(token: str) -> dict | None:
    try:
        body, signature = token.split(".")
    except ValueError:
        return None
    expected = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(signature, expected):
        return None
    payload = json.loads(_unb64(body))
    return payload if payload.get("exp", 0) > time.time() else None
