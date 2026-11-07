"""Pendis BAZNAS API (FastAPI). Deployed as a Vercel Python Function, see api/index.py."""

from __future__ import annotations

import base64
import os
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal, Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field, field_validator

from . import constants as C
from .auth import issue_token, read_token, verify_password
from .db import DatabaseError, get_db

WIB = timezone(timedelta(hours=7))
PER_PAGE_MAX = 100

app = FastAPI(title="Pendis BAZNAS API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "https://baznas.situs.id,http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=86400,
)


@app.middleware("http")
async def strip_api_prefix(request: Request, call_next):
    # Vercel routes everything to api/index; accept both /permohonan and /api/permohonan.
    path = request.scope["path"]
    if path == "/api" or path.startswith("/api/"):
        request.scope["path"] = path[4:] or "/"
    return await call_next(request)


@app.exception_handler(DatabaseError)
async def database_error(_: Request, exc: DatabaseError):
    if "UNIQUE" in str(exc) and "nik" in str(exc):
        return JSONResponse({"detail": "NIK sudah terdaftar."}, status_code=409)
    return JSONResponse({"detail": "Terjadi kesalahan pada database. Coba lagi."}, status_code=500)


# ---------- auth ----------


def current_user(authorization: Annotated[Optional[str], Header()] = None) -> dict:
    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    payload = read_token(token) if token else None
    if not payload:
        raise HTTPException(401, "Sesi berakhir. Silakan masuk kembali.")
    return {"id": payload["uid"], "role": payload["role"], "name": payload["name"]}


User = Annotated[dict, Depends(current_user)]


def require(user: dict, *roles: str) -> None:
    if user["role"] not in roles:
        raise HTTPException(403, "Anda tidak memiliki akses untuk tindakan ini.")


class LoginIn(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
def login(body: LoginIn):
    rows = get_db().query("SELECT * FROM users WHERE username = ?", [body.username.strip().lower()])
    if not rows or not verify_password(body.password, rows[0]["password_hash"]):
        raise HTTPException(401, "Username atau kata sandi salah.")
    user = {k: rows[0][k] for k in ("id", "username", "name", "role")}
    return {"token": issue_token(user), "user": user}


@app.get("/auth/me")
def me(user: User):
    return user


# ---------- helpers ----------


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def today_wib() -> str:
    return datetime.now(WIB).strftime("%Y-%m-%d")


def like(q: str) -> str:
    return "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def page_args(page: int, per_page: int) -> tuple[int, int]:
    per_page = max(1, min(per_page, PER_PAGE_MAX))
    return per_page, (max(page, 1) - 1) * per_page


# Status, nominal rekomendasi and nominal ACC are always derived from the data, never set directly.
REFRESH_SQL = """
UPDATE permohonan SET
  nominal_rekomendasi = (SELECT CASE WHEN decision = 'rekomendasi' THEN nominal END FROM moderasi
                         WHERE permohonan_id = ?1 AND role = 'waka2' ORDER BY id DESC LIMIT 1),
  nominal_acc = (SELECT CASE WHEN decision = 'acc' THEN nominal END FROM moderasi
                 WHERE permohonan_id = ?1 AND role = 'ketua' ORDER BY id DESC LIMIT 1),
  status = CASE (SELECT decision FROM moderasi WHERE permohonan_id = ?1 AND role = 'ketua' ORDER BY id DESC LIMIT 1)
    WHEN 'acc' THEN CASE
      WHEN COALESCE(jenis_dana, '') <> '' AND tanggal_penyaluran IS NOT NULL
           AND EXISTS (SELECT 1 FROM attachments WHERE permohonan_id = ?1 AND category = 'penyaluran')
      THEN 'selesai' ELSE 'acc' END
    WHEN 'tolak' THEN 'ditolak'
    ELSE CASE (SELECT decision FROM moderasi WHERE permohonan_id = ?1 AND role = 'waka2' ORDER BY id DESC LIMIT 1)
      WHEN 'rekomendasi' THEN 'rekomendasi'
      WHEN 'tolak' THEN 'ditolak_waka'
      ELSE CASE
        WHEN COALESCE(catatan_assessment, '') <> ''
             OR EXISTS (SELECT 1 FROM attachments WHERE permohonan_id = ?1 AND category = 'assessment')
        THEN 'assessment' ELSE 'diajukan' END
    END
  END,
  updated_at = ?2
WHERE id = ?1
"""


def refresh(permohonan_id: int) -> tuple[str, list]:
    return REFRESH_SQL, [permohonan_id, now_iso()]


def can(user: dict, p: dict) -> dict:
    role, status = user["role"], p["status"]
    return {
        "edit": role == "amil" and status in C.EDITABLE,
        "assess": role == "amil" and status in C.ASSESSABLE,
        "moderate": (role == "waka2" and status in C.WAKA_MODERATABLE) or (role == "ketua" and status in C.KETUA_MODERATABLE),
        "distribute": role == "amil" and status in C.DISTRIBUTABLE,
    }


def get_permohonan(permohonan_id: int) -> dict:
    rows = get_db().query("SELECT * FROM permohonan WHERE id = ?", [permohonan_id])
    if not rows:
        raise HTTPException(404, "Permohonan tidak ditemukan.")
    return rows[0]


# ---------- validation models ----------

NIK = Annotated[str, Field(pattern=r"^\d{16}$")]
Text = Annotated[str, Field(min_length=1, max_length=500)]


class Pemohon(BaseModel):
    nama: Text
    nik: NIK
    jenis_kelamin: Literal["Laki-laki", "Perempuan"]
    alamat: Text
    kelurahan: Text
    kecamatan: Text
    pekerjaan: Text
    penghasilan: Annotated[int, Field(ge=0)]
    kontak: Annotated[str, Field(min_length=6, max_length=30)]
    asnaf: str

    @field_validator("asnaf")
    @classmethod
    def valid_asnaf(cls, v: str) -> str:
        if v not in C.ASNAF:
            raise ValueError("Jenis asnaf tidak dikenal")
        return v

    @field_validator("nama", "alamat", "kelurahan", "kecamatan", "pekerjaan", "kontak")
    @classmethod
    def strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Wajib diisi")
        return v


class PermohonanIn(Pemohon):
    lembaga_referrer: Optional[str] = None
    jumlah_pm: Annotated[int, Field(ge=1, le=100_000)]
    perihal: Text
    program: str

    @field_validator("program")
    @classmethod
    def valid_program(cls, v: str) -> str:
        if v not in C.PROGRAM:
            raise ValueError("Program tidak dikenal")
        return v


APPLICANT_FIELDS = list(PermohonanIn.model_fields)


class PermohonanPatch(BaseModel):
    nama: Optional[Text] = None
    nik: Optional[NIK] = None
    jenis_kelamin: Optional[Literal["Laki-laki", "Perempuan"]] = None
    alamat: Optional[Text] = None
    kelurahan: Optional[Text] = None
    kecamatan: Optional[Text] = None
    lembaga_referrer: Optional[str] = None
    pekerjaan: Optional[Text] = None
    penghasilan: Optional[Annotated[int, Field(ge=0)]] = None
    kontak: Optional[Annotated[str, Field(min_length=6, max_length=30)]] = None
    asnaf: Optional[str] = None
    jumlah_pm: Optional[Annotated[int, Field(ge=1, le=100_000)]] = None
    perihal: Optional[Text] = None
    program: Optional[str] = None
    jenis_dana: Optional[str] = None
    tanggal_penyaluran: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator("asnaf")
    @classmethod
    def valid_asnaf(cls, v):
        if v is not None and v not in C.ASNAF:
            raise ValueError("Jenis asnaf tidak dikenal")
        return v

    @field_validator("program")
    @classmethod
    def valid_program(cls, v):
        if v is not None and v not in C.PROGRAM:
            raise ValueError("Program tidak dikenal")
        return v

    @field_validator("jenis_dana")
    @classmethod
    def valid_dana(cls, v):
        if v is not None and v not in C.JENIS_DANA:
            raise ValueError("Jenis dana tidak dikenal")
        return v


class MustahikIn(Pemohon):
    tempat_lahir: Optional[Annotated[str, Field(max_length=100)]] = None
    tanggal_lahir: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class MustahikPatch(BaseModel):
    nama: Optional[Text] = None
    nik: Optional[NIK] = None
    jenis_kelamin: Optional[Literal["Laki-laki", "Perempuan"]] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    alamat: Optional[Text] = None
    kelurahan: Optional[Text] = None
    kecamatan: Optional[Text] = None
    pekerjaan: Optional[Text] = None
    penghasilan: Optional[Annotated[int, Field(ge=0)]] = None
    kontak: Optional[Annotated[str, Field(min_length=6, max_length=30)]] = None
    asnaf: Optional[str] = None

    @field_validator("asnaf")
    @classmethod
    def valid_asnaf(cls, v):
        if v is not None and v not in C.ASNAF:
            raise ValueError("Jenis asnaf tidak dikenal")
        return v


class AssessmentIn(BaseModel):
    catatan: Annotated[str, Field(max_length=10_000)]


class ModerasiIn(BaseModel):
    decision: Literal["rekomendasi", "acc", "tolak"]
    nominal: Optional[Annotated[int, Field(gt=0, le=100_000_000_000)]] = None
    catatan: Optional[Annotated[str, Field(max_length=5_000)]] = None


# ---------- meta and dashboard ----------


@app.get("/")
def health():
    return {"ok": True, "service": "pendis-baznas"}


@app.get("/meta")
def meta(_: User):
    db = get_db()
    kec, kel, lembaga, kerja = db.batch(
        [
            ("SELECT DISTINCT kecamatan v FROM mustahik ORDER BY 1 LIMIT 200", []),
            ("SELECT DISTINCT kelurahan v FROM mustahik ORDER BY 1 LIMIT 300", []),
            ("SELECT DISTINCT lembaga_referrer v FROM permohonan WHERE COALESCE(lembaga_referrer, '') <> '' ORDER BY 1 LIMIT 200", []),
            ("SELECT DISTINCT pekerjaan v FROM mustahik ORDER BY 1 LIMIT 200", []),
        ]
    )
    values = lambda rows: [r["v"] for r in rows]  # noqa: E731
    return {
        "roles": C.ROLES,
        "status": C.STATUS,
        "asnaf": C.ASNAF,
        "program": C.PROGRAM,
        "jenis_dana": C.JENIS_DANA,
        "jenis_kelamin": C.JENIS_KELAMIN,
        "suggestions": {"kecamatan": values(kec), "kelurahan": values(kel), "lembaga_referrer": values(lembaga), "pekerjaan": values(kerja)},
    }


INBOX = {"amil": ["diajukan", "acc"], "waka2": ["assessment"], "ketua": ["rekomendasi", "ditolak_waka"]}


@app.get("/dashboard")
def dashboard(user: User):
    inbox = INBOX[user["role"]]
    marks = ",".join("?" * len(inbox))
    by_status, totals, by_program, recent, waiting, mustahik = get_db().batch(
        [
            ("SELECT status, COUNT(*) n FROM permohonan GROUP BY status", []),
            (
                "SELECT COUNT(*) n,"
                " COALESCE(SUM(CASE WHEN status IN ('acc','selesai') THEN nominal_acc END), 0) disetujui,"
                " COALESCE(SUM(CASE WHEN status = 'selesai' THEN nominal_acc END), 0) disalurkan,"
                " COALESCE(SUM(CASE WHEN status IN ('acc','selesai') THEN jumlah_pm END), 0) penerima"
                " FROM permohonan",
                [],
            ),
            (
                "SELECT program, COUNT(*) n, COALESCE(SUM(CASE WHEN status IN ('acc','selesai') THEN nominal_acc END), 0) nominal"
                " FROM permohonan GROUP BY program ORDER BY nominal DESC, n DESC",
                [],
            ),
            ("SELECT id, no_register, tanggal, nama, program, perihal, status, nominal_acc, nominal_rekomendasi, updated_at FROM permohonan ORDER BY updated_at DESC LIMIT 6", []),
            (
                f"SELECT id, no_register, tanggal, nama, program, perihal, status, nominal_acc, nominal_rekomendasi FROM permohonan"
                f" WHERE status IN ({marks}) ORDER BY tanggal, id LIMIT 6",
                inbox,
            ),
            ("SELECT COUNT(*) n FROM mustahik", []),
        ]
    )
    waiting_count = sum(r["n"] for r in by_status if r["status"] in inbox)
    return {
        "by_status": {r["status"]: r["n"] for r in by_status},
        "totals": {**totals[0], "mustahik": mustahik[0]["n"]},
        "by_program": by_program,
        "recent": recent,
        "inbox": {"statuses": inbox, "count": waiting_count, "items": waiting},
    }


# ---------- permohonan ----------

LIST_COLUMNS = "id, no_register, tanggal, nama, nik, program, perihal, status, nominal_rekomendasi, nominal_acc, jumlah_pm, created_at, updated_at"
SORTS = {"tanggal": "tanggal DESC, id DESC", "-tanggal": "tanggal ASC, id ASC", "nominal": "COALESCE(nominal_acc, nominal_rekomendasi, 0) DESC, id DESC"}


@app.get("/permohonan")
def list_permohonan(
    _: User,
    q: str = "",
    status: str = "",
    program: str = "",
    sort: str = "tanggal",
    page: int = 1,
    per_page: Annotated[int, Query(alias="per_page")] = 20,
):
    where, params = ["1 = 1"], []
    if q.strip():
        where.append("(no_register LIKE ?1 ESCAPE '\\' OR nama LIKE ?1 ESCAPE '\\' OR nik LIKE ?1 ESCAPE '\\' OR program LIKE ?1 ESCAPE '\\' OR perihal LIKE ?1 ESCAPE '\\')")
        params.append(like(q.strip()))
    statuses = [s for s in status.split(",") if s in C.STATUS]
    if statuses:
        start = len(params) + 1
        where.append(f"status IN ({','.join(f'?{start + i}' for i in range(len(statuses)))})")
        params += statuses
    if program in C.PROGRAM:
        params.append(program)
        where.append(f"program = ?{len(params)}")
    per_page, offset = page_args(page, per_page)
    clause = " AND ".join(where)
    count, items = get_db().batch(
        [
            (f"SELECT COUNT(*) n FROM permohonan WHERE {clause}", params),
            (f"SELECT {LIST_COLUMNS} FROM permohonan WHERE {clause} ORDER BY {SORTS.get(sort, SORTS['tanggal'])} LIMIT {per_page} OFFSET {offset}", params),
        ]
    )
    return {"items": items, "total": count[0]["n"], "page": page, "per_page": per_page}


MUSTAHIK_FROM_PERMOHONAN = """
INSERT INTO mustahik (nik, nama, jenis_kelamin, alamat, kelurahan, kecamatan, pekerjaan, penghasilan, kontak, asnaf, source, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'permohonan', ?)
ON CONFLICT (nik) DO NOTHING
"""


def mustahik_insert(d: dict, user_id: int) -> tuple[str, list]:
    keys = ("nik", "nama", "jenis_kelamin", "alamat", "kelurahan", "kecamatan", "pekerjaan", "penghasilan", "kontak", "asnaf")
    return MUSTAHIK_FROM_PERMOHONAN, [d[k] for k in keys] + [user_id]


@app.post("/permohonan", status_code=201)
def create_permohonan(body: PermohonanIn, user: User):
    require(user, "amil")
    d = body.model_dump()
    d["lembaga_referrer"] = (d["lembaga_referrer"] or "").strip() or None
    year = today_wib()[:4]
    columns = ", ".join(APPLICANT_FIELDS)
    placeholders = ", ".join("?" for _ in APPLICANT_FIELDS)
    _, created = get_db().batch(
        [
            mustahik_insert(d, user["id"]),
            (
                f"INSERT INTO permohonan (no_register, tanggal, mustahik_id, created_by, {columns})"
                " VALUES (printf('%s-%05d', ?, COALESCE((SELECT MAX(CAST(substr(no_register, 6) AS INTEGER)) FROM permohonan"
                "   WHERE no_register LIKE ? || '-%'), 0) + 1), ?, (SELECT id FROM mustahik WHERE nik = ?), ?,"
                f" {placeholders}) RETURNING id, no_register",
                [year, year, today_wib(), d["nik"], user["id"]] + [d[k] for k in APPLICANT_FIELDS],
            ),
        ]
    )
    return created[0]


@app.get("/permohonan/{permohonan_id}")
def detail_permohonan(permohonan_id: int, user: User):
    rows, moderasi, files = get_db().batch(
        [
            ("SELECT * FROM permohonan WHERE id = ?", [permohonan_id]),
            ("SELECT id, role, decision, nominal, catatan, user_name, created_at FROM moderasi WHERE permohonan_id = ? ORDER BY id", [permohonan_id]),
            ("SELECT id, category, kind, filename, mime, size, uploader_name, created_at FROM attachments WHERE permohonan_id = ? ORDER BY id", [permohonan_id]),
        ]
    )
    if not rows:
        raise HTTPException(404, "Permohonan tidak ditemukan.")
    p = rows[0]
    return {**p, "moderasi": moderasi, "attachments": files, "can": can(user, p)}


@app.patch("/permohonan/{permohonan_id}")
def update_permohonan(permohonan_id: int, body: PermohonanPatch, user: User):
    require(user, "amil")
    p = get_permohonan(permohonan_id)
    allowed = can(user, p)
    changes = body.model_dump(exclude_unset=True)
    applicant = {k: v for k, v in changes.items() if k in APPLICANT_FIELDS}
    distribution = {k: v for k, v in changes.items() if k in ("jenis_dana", "tanggal_penyaluran")}
    if applicant and not allowed["edit"]:
        raise HTTPException(409, "Data pemohon tidak dapat diubah setelah moderasi dimulai.")
    if distribution and not allowed["distribute"]:
        raise HTTPException(409, "Data penyaluran hanya dapat diisi setelah ACC Ketua.")
    if not changes:
        return detail_permohonan(permohonan_id, user)
    if "lembaga_referrer" in applicant:
        applicant["lembaga_referrer"] = (applicant["lembaga_referrer"] or "").strip() or None
    updates = {**applicant, **distribution}
    statements = []
    if "nik" in applicant and applicant["nik"] != p["nik"]:
        statements.append(mustahik_insert({**p, **applicant}, user["id"]))
        sets = ", ".join(f"{k} = ?" for k in updates)
        statements.append((f"UPDATE permohonan SET {sets}, mustahik_id = (SELECT id FROM mustahik WHERE nik = ?) WHERE id = ?", [*updates.values(), applicant["nik"], permohonan_id]))
    else:
        sets = ", ".join(f"{k} = ?" for k in updates)
        statements.append((f"UPDATE permohonan SET {sets} WHERE id = ?", [*updates.values(), permohonan_id]))
    get_db().batch([*statements, refresh(permohonan_id)])
    return detail_permohonan(permohonan_id, user)


@app.put("/permohonan/{permohonan_id}/assessment")
def save_assessment(permohonan_id: int, body: AssessmentIn, user: User):
    require(user, "amil")
    if not can(user, get_permohonan(permohonan_id))["assess"]:
        raise HTTPException(409, "Assessment tidak dapat diubah setelah keputusan Ketua.")
    get_db().batch([("UPDATE permohonan SET catatan_assessment = ? WHERE id = ?", [body.catatan.strip() or None, permohonan_id]), refresh(permohonan_id)])
    return detail_permohonan(permohonan_id, user)


@app.post("/permohonan/{permohonan_id}/moderasi")
def moderate(permohonan_id: int, body: ModerasiIn, user: User):
    require(user, "waka2", "ketua")
    p = get_permohonan(permohonan_id)
    if not can(user, p)["moderate"]:
        raise HTTPException(409, "Permohonan ini belum atau tidak lagi dapat dimoderasi oleh Anda.")
    allowed = {"waka2": {"rekomendasi", "tolak"}, "ketua": {"acc", "tolak"}}[user["role"]]
    if body.decision not in allowed:
        raise HTTPException(422, "Keputusan tidak sesuai dengan peran Anda.")
    catatan = (body.catatan or "").strip() or None
    if body.decision == "tolak":
        if not catatan:
            raise HTTPException(422, "Alasan penolakan wajib diisi.")
        nominal = None
    else:
        if not body.nominal:
            raise HTTPException(422, "Nominal wajib diisi.")
        nominal = body.nominal
    get_db().batch(
        [
            (
                "INSERT INTO moderasi (permohonan_id, role, decision, nominal, catatan, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [permohonan_id, user["role"], body.decision, nominal, catatan, user["id"], user["name"], now_iso()],
            ),
            refresh(permohonan_id),
        ]
    )
    return detail_permohonan(permohonan_id, user)


# ---------- attachments ----------


@app.post("/permohonan/{permohonan_id}/attachments", status_code=201)
async def upload(permohonan_id: int, user: User, category: Annotated[Literal["assessment", "penyaluran"], Form()], file: Annotated[UploadFile, File()]):
    require(user, "amil")
    allowed = can(user, get_permohonan(permohonan_id))
    if not allowed["assess" if category == "assessment" else "distribute"]:
        raise HTTPException(409, "Berkas tidak dapat ditambahkan pada tahap ini.")
    mime = file.content_type or ""
    if mime in C.MEDIA_TYPES:
        kind = "media"
    elif mime in C.DOCUMENT_TYPES:
        kind = "dokumen"
    else:
        raise HTTPException(415, "Format berkas tidak didukung. Gunakan JPG, PNG, WEBP, PDF, DOC(X) atau XLS(X).")
    data = await file.read()
    if len(data) > C.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Ukuran berkas maksimal 4 MB.")
    if not data:
        raise HTTPException(422, "Berkas kosong.")
    encoded = base64.b64encode(data).decode()
    db = get_db()
    created = db.query(
        "INSERT INTO attachments (permohonan_id, category, kind, filename, mime, size, uploaded_by, uploader_name, created_at)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, category, kind, filename, mime, size, uploader_name, created_at",
        [permohonan_id, category, kind, (file.filename or "berkas")[:200], mime, len(data), user["id"], user["name"], now_iso()],
    )[0]
    chunks = [encoded[i : i + C.CHUNK_CHARS] for i in range(0, len(encoded), C.CHUNK_CHARS)]
    try:
        db.batch([*(("INSERT INTO attachment_chunks (attachment_id, idx, data) VALUES (?, ?, ?)", [created["id"], i, c]) for i, c in enumerate(chunks)), refresh(permohonan_id)])
    except DatabaseError:
        db.batch([("DELETE FROM attachment_chunks WHERE attachment_id = ?", [created["id"]]), ("DELETE FROM attachments WHERE id = ?", [created["id"]])])
        raise
    return created


@app.get("/attachments/{attachment_id}")
def download(attachment_id: int, _: User):
    meta_rows, chunks = get_db().batch(
        [
            ("SELECT filename, mime FROM attachments WHERE id = ?", [attachment_id]),
            ("SELECT data FROM attachment_chunks WHERE attachment_id = ? ORDER BY idx", [attachment_id]),
        ]
    )
    if not meta_rows:
        raise HTTPException(404, "Berkas tidak ditemukan.")
    filename = meta_rows[0]["filename"].replace('"', "")
    return Response(
        base64.b64decode("".join(c["data"] for c in chunks)),
        media_type=meta_rows[0]["mime"],
        headers={"Content-Disposition": f'inline; filename="{filename}"', "Cache-Control": "private, max-age=86400, immutable"},
    )


@app.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(attachment_id: int, user: User):
    require(user, "amil")
    rows = get_db().query("SELECT permohonan_id, category FROM attachments WHERE id = ?", [attachment_id])
    if not rows:
        raise HTTPException(404, "Berkas tidak ditemukan.")
    permohonan_id, category = rows[0]["permohonan_id"], rows[0]["category"]
    if not can(user, get_permohonan(permohonan_id))["assess" if category == "assessment" else "distribute"]:
        raise HTTPException(409, "Berkas tidak dapat dihapus pada tahap ini.")
    get_db().batch(
        [
            ("DELETE FROM attachment_chunks WHERE attachment_id = ?", [attachment_id]),
            ("DELETE FROM attachments WHERE id = ?", [attachment_id]),
            refresh(permohonan_id),
        ]
    )
    return Response(status_code=204)


# ---------- mustahik ----------

MUSTAHIK_COLUMNS = "id, nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, kelurahan, kecamatan, pekerjaan, penghasilan, kontak, asnaf, source, created_at"


@app.get("/mustahik")
def list_mustahik(_: User, q: str = "", asnaf: str = "", page: int = 1, per_page: int = 20):
    where, params = ["1 = 1"], []
    if q.strip():
        params.append(like(q.strip()))
        where.append(
            "(nama LIKE ?1 ESCAPE '\\' OR nik LIKE ?1 ESCAPE '\\' OR alamat LIKE ?1 ESCAPE '\\' OR kelurahan LIKE ?1 ESCAPE '\\'"
            " OR kecamatan LIKE ?1 ESCAPE '\\' OR pekerjaan LIKE ?1 ESCAPE '\\')"
        )
    if asnaf in C.ASNAF:
        params.append(asnaf)
        where.append(f"asnaf = ?{len(params)}")
    per_page, offset = page_args(page, per_page)
    clause = " AND ".join(where)
    count, items = get_db().batch(
        [
            (f"SELECT COUNT(*) n FROM mustahik WHERE {clause}", params),
            (
                f"SELECT {MUSTAHIK_COLUMNS}, (SELECT COUNT(*) FROM permohonan p WHERE p.mustahik_id = mustahik.id) permohonan_count"
                f" FROM mustahik WHERE {clause} ORDER BY nama COLLATE NOCASE LIMIT {per_page} OFFSET {offset}",
                params,
            ),
        ]
    )
    return {"items": items, "total": count[0]["n"], "page": page, "per_page": per_page}


@app.get("/mustahik/nik/{nik}")
def mustahik_by_nik(nik: str, _: User):
    rows = get_db().query(f"SELECT {MUSTAHIK_COLUMNS} FROM mustahik WHERE nik = ?", [nik])
    if not rows:
        raise HTTPException(404, "Mustahik tidak ditemukan.")
    return rows[0]


@app.post("/mustahik", status_code=201)
def create_mustahik(body: MustahikIn, user: User):
    require(user, "amil")
    d = body.model_dump()
    d["tempat_lahir"] = (d["tempat_lahir"] or "").strip() or None
    keys = list(d)
    return get_db().query(
        f"INSERT INTO mustahik ({', '.join(keys)}, source, created_by) VALUES ({', '.join('?' for _ in keys)}, 'manual', ?) RETURNING id",
        [d[k] for k in keys] + [user["id"]],
    )[0]


@app.get("/mustahik/{mustahik_id}")
def detail_mustahik(mustahik_id: int, _: User):
    rows, permohonan = get_db().batch(
        [
            (f"SELECT {MUSTAHIK_COLUMNS} FROM mustahik WHERE id = ?", [mustahik_id]),
            (f"SELECT {LIST_COLUMNS} FROM permohonan WHERE mustahik_id = ? ORDER BY tanggal DESC, id DESC", [mustahik_id]),
        ]
    )
    if not rows:
        raise HTTPException(404, "Mustahik tidak ditemukan.")
    return {**rows[0], "permohonan": permohonan}


@app.patch("/mustahik/{mustahik_id}")
def update_mustahik(mustahik_id: int, body: MustahikPatch, user: User):
    require(user, "amil")
    changes = body.model_dump(exclude_unset=True)
    if changes:
        sets = ", ".join(f"{k} = ?" for k in changes)
        get_db().query(f"UPDATE mustahik SET {sets}, updated_at = ? WHERE id = ?", [*changes.values(), now_iso(), mustahik_id])
    return detail_mustahik(mustahik_id, user)
