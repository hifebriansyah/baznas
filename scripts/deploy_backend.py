#!/usr/bin/env python3
"""Deploy backend/ to Vercel as project `baznas-api` and configure D1 environment variables."""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
from pathlib import Path
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
ENV_FILE = ROOT.parent / ".env"

PROJECT_NAME = "baznas-api"
D1_DATABASE_ID = "17ac6602-09bf-43f7-ab31-38f072914b6a"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def api_req(method: str, url: str, token: str, body: dict | bytes | None = None, headers: dict | None = None) -> dict:
    hdrs = {"Authorization": f"Bearer {token}"}
    if headers:
        hdrs.update(headers)
    data: bytes | None = None
    if isinstance(body, dict):
        data = json.dumps(body).encode()
        hdrs.setdefault("Content-Type", "application/json")
    elif isinstance(body, bytes):
        data = body

    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err_text = e.read().decode()
        raise RuntimeError(f"HTTP {e.code} on {method} {url}: {err_text}") from e


def collect_files(base: Path) -> list[Path]:
    files: list[Path] = []
    for p in sorted(base.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(base).parts
        if any(part.startswith(".") or part == "__pycache__" for part in rel):
            continue
        if p.suffix in {".db", ".pyc"}:
            continue
        files.append(p)
    return files


def main() -> None:
    env = {**load_env(ENV_FILE), **os.environ}
    vercel_token = env["VERCEL_TOKEN"]
    cf_token = env["CLOUDFLARE_API_TOKEN"]
    cf_account = env["CLOUDFLARE_ACCOUNT_ID"]
    auth_secret = env.get("INTERNAL_TOKEN") or hashlib.sha256(cf_token.encode()).hexdigest()

    # 1. Ensure project exists
    try:
        proj = api_req("GET", f"https://api.vercel.com/v9/projects/{PROJECT_NAME}", vercel_token)
        print("Found existing Vercel project:", proj["name"])
    except RuntimeError:
        proj = api_req(
            "POST",
            "https://api.vercel.com/v10/projects",
            vercel_token,
            {"name": PROJECT_NAME, "framework": None},
        )
        print("Created Vercel project:", proj["name"])

    # Disable Vercel Authentication / SSO protection on production & preview so browser SPA can call it
    try:
        api_req(
            "PATCH",
            f"https://api.vercel.com/v9/projects/{PROJECT_NAME}",
            vercel_token,
            {"ssoProtection": None},
        )
    except RuntimeError as e:
        print("Note updating ssoProtection:", e)

    # 2. Upsert environment variables
    desired_envs = {
        "CLOUDFLARE_ACCOUNT_ID": cf_account,
        "CLOUDFLARE_API_TOKEN": cf_token,
        "D1_DATABASE_ID": D1_DATABASE_ID,
        "AUTH_SECRET": auth_secret,
        "ALLOWED_ORIGINS": "https://baznas.situs.id,http://localhost,http://127.0.0.1,http://localhost:5173,http://127.0.0.1:5173",  # http://localhost and http://127.0.0.1: the local Apache copy (.htaccess)
    }
    existing_envs = api_req("GET", f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/env", vercel_token).get("envs", [])
    by_key = {e["key"]: e["id"] for e in existing_envs}

    for k, v in desired_envs.items():
        if k in by_key:
            api_req(
                "PATCH",
                f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/env/{by_key[k]}",
                vercel_token,
                {"value": v, "type": "encrypted", "target": ["production", "preview", "development"]},
            )
        else:
            api_req(
                "POST",
                f"https://api.vercel.com/v10/projects/{PROJECT_NAME}/env",
                vercel_token,
                {"key": k, "value": v, "type": "encrypted", "target": ["production", "preview", "development"]},
            )
    print("Configured environment variables on Vercel project.")

    # 3. Upload files & create production deployment
    files = collect_files(BACKEND)
    file_entries = []
    for f in files:
        raw = f.read_bytes()
        sha = hashlib.sha1(raw).hexdigest()
        size = len(raw)
        rel_path = f.relative_to(BACKEND).as_posix()
        api_req(
            "POST",
            "https://api.vercel.com/v2/files",
            vercel_token,
            raw,
            {"Content-Type": "application/octet-stream", "x-vercel-digest": sha},
        )
        file_entries.append({"file": rel_path, "sha": sha, "size": size})
        print(f"Uploaded {rel_path} ({size} B)")

    dep = api_req(
        "POST",
        "https://api.vercel.com/v13/deployments?skipAutoDetectionConfirmation=1",
        vercel_token,
        {
            "name": PROJECT_NAME,
            "project": PROJECT_NAME,
            "target": "production",
            "files": file_entries,
            "projectSettings": {"framework": None},
        },
    )
    dep_id = dep["id"]
    print(f"Created deployment {dep_id} -> https://{dep['url']}")

    # Poll until READY or ERROR
    for _ in range(45):
        status = api_req("GET", f"https://api.vercel.com/v13/deployments/{dep_id}", vercel_token)
        state = status.get("readyState")
        print("State:", state)
        if state == "READY":
            aliases = status.get("alias", [])
            print("Deployment READY! Aliases:", aliases)
            return
        if state in {"ERROR", "CANCELED"}:
            print("Deployment failed:", json.dumps(status, indent=2))
            sys.exit(1)
        time.sleep(3)


if __name__ == "__main__":
    main()
