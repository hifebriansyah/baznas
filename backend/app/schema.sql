-- Pendis BAZNAS schema (Cloudflare D1 / SQLite). Applied by scripts/migrate.py; every statement is idempotent.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('amil', 'waka2', 'ketua')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS mustahik (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nik TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL,
  tempat_lahir TEXT,
  tanggal_lahir TEXT,
  alamat TEXT NOT NULL,
  kelurahan TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  pekerjaan TEXT NOT NULL,
  penghasilan INTEGER NOT NULL DEFAULT 0,
  kontak TEXT NOT NULL,
  asnaf TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'permohonan')),
  created_by INTEGER REFERENCES users (id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS permohonan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  no_register TEXT NOT NULL UNIQUE,
  tanggal TEXT NOT NULL,
  mustahik_id INTEGER NOT NULL REFERENCES mustahik (id),
  nama TEXT NOT NULL,
  nik TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL,
  alamat TEXT NOT NULL,
  kelurahan TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  lembaga_referrer TEXT,
  pekerjaan TEXT NOT NULL,
  penghasilan INTEGER NOT NULL DEFAULT 0,
  kontak TEXT NOT NULL,
  asnaf TEXT NOT NULL,
  jumlah_pm INTEGER NOT NULL DEFAULT 1,
  perihal TEXT NOT NULL,
  program TEXT NOT NULL,
  catatan_assessment TEXT,
  jenis_dana TEXT,
  tanggal_penyaluran TEXT,
  status TEXT NOT NULL DEFAULT 'diajukan',
  nominal_rekomendasi INTEGER,
  nominal_acc INTEGER,
  created_by INTEGER REFERENCES users (id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS permohonan_status ON permohonan (status);
CREATE INDEX IF NOT EXISTS permohonan_mustahik ON permohonan (mustahik_id);

-- Append-only: an update is a new row; the latest row per role is the effective decision.
CREATE TABLE IF NOT EXISTS moderasi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permohonan_id INTEGER NOT NULL REFERENCES permohonan (id),
  role TEXT NOT NULL CHECK (role IN ('waka2', 'ketua')),
  decision TEXT NOT NULL CHECK (decision IN ('rekomendasi', 'acc', 'tolak')),
  nominal INTEGER,
  catatan TEXT,
  user_id INTEGER NOT NULL REFERENCES users (id),
  user_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS moderasi_permohonan ON moderasi (permohonan_id, role);

-- File bytes live in attachment_chunks as base64 text (D1 rows are limited to 2 MB).
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permohonan_id INTEGER NOT NULL REFERENCES permohonan (id),
  category TEXT NOT NULL CHECK (category IN ('assessment', 'penyaluran')),
  kind TEXT NOT NULL CHECK (kind IN ('dokumen', 'media')),
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by INTEGER REFERENCES users (id),
  uploader_name TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS attachments_permohonan ON attachments (permohonan_id, category);

CREATE TABLE IF NOT EXISTS attachment_chunks (
  attachment_id INTEGER NOT NULL REFERENCES attachments (id),
  idx INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (attachment_id, idx)
);
