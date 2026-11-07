"""Database access: Cloudflare D1 over its REST API, or a local SQLite file for development and tests.

Both backends expose the same two calls:
- ``query(sql, params)`` returns the rows of one statement as dicts.
- ``batch([(sql, params), ...])`` runs statements in one transaction and returns the rows of each.
"""

from __future__ import annotations

import os
import sqlite3
import threading
from pathlib import Path
from typing import Any, Sequence

import httpx

Params = Sequence[Any]
Statement = tuple[str, Params]

SCHEMA = (Path(__file__).parent / "schema.sql").read_text()


class DatabaseError(RuntimeError):
    pass


class D1:
    def __init__(self, account_id: str, database_id: str, token: str):
        self.url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query"
        self.client = httpx.Client(headers={"Authorization": f"Bearer {token}"}, timeout=30)

    def _post(self, body: dict) -> list[dict]:
        response = self.client.post(self.url, json=body)
        data = response.json()
        if not data.get("success"):
            messages = "; ".join(e.get("message", "") for e in data.get("errors", []))
            raise DatabaseError(messages or f"D1 HTTP {response.status_code}")
        return data["result"]

    def query(self, sql: str, params: Params = ()) -> list[dict]:
        return self._post({"sql": sql, "params": list(params)})[0]["results"]

    def batch(self, statements: list[Statement]) -> list[list[dict]]:
        result = self._post({"batch": [{"sql": sql, "params": list(params)} for sql, params in statements]})
        return [r["results"] for r in result]


class LocalSQLite:
    def __init__(self, path: str):
        self.lock = threading.Lock()
        self.conn = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)

    def _run(self, cur: sqlite3.Cursor, sql: str, params: Params) -> list[dict]:
        cur.execute(sql, list(params))
        return [dict(r) for r in cur.fetchall()] if cur.description else []

    def query(self, sql: str, params: Params = ()) -> list[dict]:
        return self.batch([(sql, params)])[0]

    def batch(self, statements: list[Statement]) -> list[list[dict]]:
        with self.lock:
            cur = self.conn.cursor()
            cur.execute("BEGIN")
            try:
                results = [self._run(cur, sql, params) for sql, params in statements]
            except sqlite3.Error as e:
                cur.execute("ROLLBACK")
                raise DatabaseError(str(e)) from e
            cur.execute("COMMIT")
            return results


_db: D1 | LocalSQLite | None = None


def get_db() -> D1 | LocalSQLite:
    global _db
    if _db is None:
        database_id = os.environ.get("D1_DATABASE_ID")
        if database_id:
            _db = D1(os.environ["CLOUDFLARE_ACCOUNT_ID"], database_id, os.environ["CLOUDFLARE_API_TOKEN"])
        else:
            _db = LocalSQLite(os.environ.get("SQLITE_PATH", "pendis.db"))
    return _db


def set_db(db: D1 | LocalSQLite | None) -> None:
    global _db
    _db = db
