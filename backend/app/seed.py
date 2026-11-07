"""Seed and migration helpers for the Pendis BAZNAS database."""

from __future__ import annotations

import base64
from pathlib import Path

from .auth import hash_password
from .db import SCHEMA, get_db
from .main import refresh

# Minimal valid 1x1 emerald PNG and minimal valid PDF for sample attachments
SAMPLE_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)
SAMPLE_PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n164\n%%EOF"
)


def apply_schema() -> None:
    db = get_db()
    cleaned = "\n".join(line for line in SCHEMA.splitlines() if not line.strip().startswith("--"))
    statements = [s.strip() for s in cleaned.split(";") if s.strip()]
    db.batch([(s, []) for s in statements])
    db.query("DROP TABLE IF EXISTS t")


def seed_data() -> None:
    db = get_db()
    apply_schema()

    existing = db.query("SELECT COUNT(*) as c FROM users")[0]["c"]
    if existing > 0:
        return

    pwd = hash_password("baznas123")
    users = [
        ("amil", "Ahmad Fauzi (Amil Pelaksana)", "amil", pwd),
        ("waka2", "H. Ridwan Kamil, M.Ag (Wakil Ketua II)", "waka2", pwd),
        ("ketua", "KH. Abdullah Gymnastiar (Ketua BAZNAS)", "ketua", pwd),
    ]
    for u in users:
        db.query(
            "INSERT INTO users (username, name, role, password_hash) VALUES (?, ?, ?, ?)",
            list(u),
        )

    user_rows = {r["role"]: r for r in db.query("SELECT id, name, role FROM users")}
    amil_id = user_rows["amil"]["id"]
    amil_name = user_rows["amil"]["name"]
    waka_id = user_rows["waka2"]["id"]
    waka_name = user_rows["waka2"]["name"]
    ketua_id = user_rows["ketua"]["id"]
    ketua_name = user_rows["ketua"]["name"]

    mustahik_rows = [
        (
            "3203011504880001",
            "Asep Sunandar",
            "Laki-laki",
            "Cianjur",
            "1988-04-15",
            "Kp. Babakan Karet RT 01 RW 02",
            "Panunggangan Utara",
            "Pinang",
            "Pedagang Bakso",
            1200000,
            "081234567801",
            "Miskin",
            "permohonan",
        ),
        (
            "3203022108910002",
            "DKM Masjid Al-Ikhlas (Ust. Mahmud)",
            "Laki-laki",
            "Cianjur",
            "1991-08-21",
            "Jl. KH. Abdullah Bin Nuh RT 04 RW 01",
            "Sawah Gede",
            "Cianjur",
            "Guru Ngaji / Marbot",
            950000,
            "081234567802",
            "Fisabilillah",
            "permohonan",
        ),
        (
            "3203031002860003",
            "Siti Aminah",
            "Perempuan",
            "Cianjur",
            "1986-02-10",
            "Kp. Pasir Hayam RT 02 RW 05",
            "Sirnagalih",
            "Cilaku",
            "Buruh Cuci Harian",
            650000,
            "081234567803",
            "Gharim",
            "permohonan",
        ),
        (
            "3203040511810004",
            "Maman Abdurrahman",
            "Laki-laki",
            "Cianjur",
            "1981-11-05",
            "Kp. Rawa Bango RT 03 RW 04",
            "Bojong",
            "Karangtengah",
            "Pedagang Cilok Keliling",
            800000,
            "081234567804",
            "Fakir",
            "permohonan",
        ),
        (
            "3203051907000005",
            "Rina Kartika",
            "Perempuan",
            "Cianjur",
            "2000-07-19",
            "Kp. Warungkondang RT 01 RW 03",
            "Jambudipa",
            "Warungkondang",
            "Penjahit Rumahan",
            1100000,
            "081234567805",
            "Miskin",
            "permohonan",
        ),
        (
            "3203061203110006",
            "Dedi Kusnandar",
            "Laki-laki",
            "Cianjur",
            "1979-03-12",
            "Kp. Cipanas Girang RT 05 RW 02",
            "Cipanas",
            "Cipanas",
            "Montir Bengkel Kecil",
            1000000,
            "081234567806",
            "Miskin",
            "permohonan",
        ),
        (
            "3203072509830007",
            "Yusuf Mansur",
            "Laki-laki",
            "Sukabumi",
            "1983-09-25",
            "Kp. Cugenang Tengah RT 02 RW 01",
            "Cibeureum",
            "Cugenang",
            "Petani Sayur",
            750000,
            "081234567807",
            "Gharim",
            "permohonan",
        ),
        (
            "3203081406950008",
            "Neng Hasanah",
            "Perempuan",
            "Cianjur",
            "1995-06-14",
            "Kp. Maleber RT 01 RW 06",
            "Maleber",
            "Karangtengah",
            "Guru Honorer Madrasah",
            850000,
            "081234567808",
            "Fisabilillah",
            "manual",
        ),
    ]

    for m in mustahik_rows:
        db.query(
            """INSERT INTO mustahik
               (nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, kelurahan, kecamatan,
                pekerjaan, penghasilan, kontak, asnaf, source, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [*m, amil_id],
        )

    mustahik_by_nik = {r["nik"]: r for r in db.query("SELECT * FROM mustahik")}

    permohonan_specs = [
        {
            "no_register": "2026-00001",
            "tanggal": "2026-09-14",
            "nik": "3203011504880001",
            "lembaga": "UPZ Kecamatan Pinang",
            "jumlah_pm": 4,
            "perihal": "Bantuan modal usaha awal gerobak bakso keliling",
            "program": "Cianjur Makmur",
            "catatan": "Hasil survei lapangan menunjukkan pemohon memiliki keahlian membuat bakso namun gerobak sebelumnya rusak berat. Keluarga terdiri dari istri dan 3 anak usia sekolah.",
            "att_assessment": [("Surat_Keterangan_Tidak_Mampu.pdf", "dokumen", "application/pdf", SAMPLE_PDF), ("Foto_Survei_Rumah_Pemohon.png", "media", "image/png", SAMPLE_PNG)],
            "moderasi": [],
            "jenis_dana": None,
            "tanggal_penyaluran": None,
            "att_penyaluran": [],
        },
        {
            "no_register": "2026-00002",
            "tanggal": "2026-09-13",
            "nik": "3203022108910002",
            "lembaga": "UPZ Kemenag Cianjur",
            "jumlah_pm": 120,
            "perihal": "Bantuan renovasi atap dan tempat wudhu Masjid Al-Ikhlas",
            "program": "Cianjur Takwa",
            "catatan": "Atap masjid mengalami kebocoran di 4 titik utama dan instalasi air tempat wudhu rusak pasca gempa ringan. Jamaah aktif sekitar 120 warga.",
            "att_assessment": [("RAB_Renovasi_Masjid.pdf", "dokumen", "application/pdf", SAMPLE_PDF), ("Dokumentasi_Kondisi_Atap.png", "media", "image/png", SAMPLE_PNG)],
            "moderasi": [
                ("waka2", "rekomendasi", 60000000, "RAB rasional dan manfaat langsung bagi jamaah luas. Direkomendasikan dibantu Rp 60.000.000.", "2026-09-14T03:12:54Z"),
                ("ketua", "acc", 60000000, "Disetujui sesuai rekomendasi Wakil Ketua II. Segera jadwalkan penyaluran bertahap.", "2026-09-15T02:00:12Z"),
            ],
            "jenis_dana": None,
            "tanggal_penyaluran": None,
            "att_penyaluran": [],
        },
        {
            "no_register": "2026-00003",
            "tanggal": "2026-09-13",
            "nik": "3203031002860003",
            "lembaga": "UPZ Desa Sirnagalih",
            "jumlah_pm": 2,
            "perihal": "Bantuan pelunasan tunggakan biaya pendidikan SMK anak",
            "program": "Cianjur Cerdas",
            "catatan": "Anak pemohon kelas XII SMK terancam tidak dapat mengikuti ujian akhir karena tunggakan SPP 10 bulan. Pemohon adalah orang tua tunggal.",
            "att_assessment": [("Surat_Tagihan_Sekolah.pdf", "dokumen", "application/pdf", SAMPLE_PDF)],
            "moderasi": [
                ("waka2", "rekomendasi", 7000000, "Prioritas pendidikan keluarga dhuafa. Direkomendasikan penuh sesuai tagihan sekolah.", "2026-09-14T04:30:00Z"),
            ],
            "jenis_dana": None,
            "tanggal_penyaluran": None,
            "att_penyaluran": [],
        },
        {
            "no_register": "2026-00004",
            "tanggal": "2026-09-12",
            "nik": "3203040511810004",
            "lembaga": "RSUD Sayang Cianjur",
            "jumlah_pm": 1,
            "perihal": "Bantuan pengadaan kursi roda medis untuk pemulihan pasca stroke",
            "program": "Cianjur Sehat",
            "catatan": "Pemohon mengalami stroke ringan dan membutuhkan kursi roda untuk mobilitas harian serta kontrol rutin ke puskesmas.",
            "att_assessment": [("Resume_Medis_RSUD.pdf", "dokumen", "application/pdf", SAMPLE_PDF), ("Foto_Kondisi_Mustahik.png", "media", "image/png", SAMPLE_PNG)],
            "moderasi": [
                ("waka2", "rekomendasi", 2500000, "Kebutuhan mendesak alat bantu kesehatan.", "2026-09-12T08:15:00Z"),
                ("ketua", "acc", 2500000, "ACC pengadaan kursi roda.", "2026-09-13T01:40:00Z"),
            ],
            "jenis_dana": "Zakat",
            "tanggal_penyaluran": "2026-09-14",
            "att_penyaluran": [("BAST_Kursi_Roda.pdf", "dokumen", "application/pdf", SAMPLE_PDF), ("Foto_Serah_Terima_Bantuan.png", "media", "image/png", SAMPLE_PNG)],
        },
        {
            "no_register": "2026-00005",
            "tanggal": "2026-09-12",
            "nik": "3203051907000005",
            "lembaga": "UPZ Kecamatan Warungkondang",
            "jumlah_pm": 3,
            "perihal": "Bantuan modal usaha lanjutan mesin obras konveksi rumahan",
            "program": "Cianjur Makmur",
            "catatan": None,
            "att_assessment": [],
            "moderasi": [],
            "jenis_dana": None,
            "tanggal_penyaluran": None,
            "att_penyaluran": [],
        },
        {
            "no_register": "2026-00006",
            "tanggal": "2026-09-10",
            "nik": "3203061203110006",
            "lembaga": "UPZ Kecamatan Cipanas",
            "jumlah_pm": 5,
            "perihal": "Bantuan peralatan kompresor dan kunci bengkel motor",
            "program": "Cianjur Peduli",
            "catatan": "Bengkel darurat di pinggir jalan raya memiliki pelanggan tetap namun peralatan banyak yang meminjam.",
            "att_assessment": [("Daftar_Alat_Bengkel.pdf", "dokumen", "application/pdf", SAMPLE_PDF), ("Foto_Lokasi_Usaha.png", "media", "image/png", SAMPLE_PNG)],
            "moderasi": [
                ("waka2", "rekomendasi", 18000000, "Usaha prospektif untuk kemandirian keluarga.", "2026-09-10T09:00:00Z"),
                ("ketua", "acc", 20000000, "Disetujui Rp 20.000.000 agar mencakup kompresor standar industri.", "2026-09-11T03:20:00Z"),
            ],
            "jenis_dana": "Infak Tidak Terikat",
            "tanggal_penyaluran": "2026-09-13",
            "att_penyaluran": [("Bukti_Transfer_dan_BAST.pdf", "dokumen", "application/pdf", SAMPLE_PDF), ("Dokumentasi_Penyerahan_Alat.png", "media", "image/png", SAMPLE_PNG)],
        },
        {
            "no_register": "2026-00007",
            "tanggal": "2026-09-09",
            "nik": "3203072509830007",
            "lembaga": "UPZ Desa Cibeureum",
            "jumlah_pm": 4,
            "perihal": "Bantuan pelunasan pinjaman modal pupuk pertanian",
            "program": "Cianjur Peduli",
            "catatan": "Setelah diverifikasi, pinjaman berasal dari lembaga komersial untuk keperluan non-produktif yang tidak masuk kriteria gharim syar'i.",
            "att_assessment": [("Hasil_Verifikasi_Lapangan.pdf", "dokumen", "application/pdf", SAMPLE_PDF)],
            "moderasi": [
                ("waka2", "tolak", None, "Pinjaman bersifat konsumtif dan tidak memenuhi syarat asnaf gharim.", "2026-09-09T10:15:00Z"),
                ("ketua", "tolak", None, "Ditolak sesuai hasil verifikasi lapangan dan pertimbangan Wakil Ketua II.", "2026-09-10T02:10:00Z"),
            ],
            "jenis_dana": None,
            "tanggal_penyaluran": None,
            "att_penyaluran": [],
        },
    ]

    for spec in permohonan_specs:
        m = mustahik_by_nik[spec["nik"]]
        p_row = db.query(
            """INSERT INTO permohonan
               (no_register, tanggal, mustahik_id, nama, nik, jenis_kelamin, alamat, kelurahan, kecamatan,
                lembaga_referrer, pekerjaan, penghasilan, kontak, asnaf, jumlah_pm, perihal, program,
                catatan_assessment, jenis_dana, tanggal_penyaluran, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               RETURNING id""",
            [
                spec["no_register"],
                spec["tanggal"],
                m["id"],
                m["nama"],
                m["nik"],
                m["jenis_kelamin"],
                m["alamat"],
                m["kelurahan"],
                m["kecamatan"],
                spec["lembaga"],
                m["pekerjaan"],
                m["penghasilan"],
                m["kontak"],
                m["asnaf"],
                spec["jumlah_pm"],
                spec["perihal"],
                spec["program"],
                spec["catatan"],
                spec["jenis_dana"],
                spec["tanggal_penyaluran"],
                amil_id,
            ],
        )[0]
        pid = p_row["id"]

        for fname, kind, mime, raw in spec["att_assessment"]:
            att = db.query(
                """INSERT INTO attachments (permohonan_id, category, kind, filename, mime, size, uploaded_by, uploader_name)
                   VALUES (?, 'assessment', ?, ?, ?, ?, ?, ?) RETURNING id""",
                [pid, kind, fname, mime, len(raw), amil_id, amil_name],
            )[0]
            db.query(
                "INSERT INTO attachment_chunks (attachment_id, idx, data) VALUES (?, 0, ?)",
                [att["id"], base64.b64encode(raw).decode()],
            )

        for fname, kind, mime, raw in spec["att_penyaluran"]:
            att = db.query(
                """INSERT INTO attachments (permohonan_id, category, kind, filename, mime, size, uploaded_by, uploader_name)
                   VALUES (?, 'penyaluran', ?, ?, ?, ?, ?, ?) RETURNING id""",
                [pid, kind, fname, mime, len(raw), amil_id, amil_name],
            )[0]
            db.query(
                "INSERT INTO attachment_chunks (attachment_id, idx, data) VALUES (?, 0, ?)",
                [att["id"], base64.b64encode(raw).decode()],
            )

        for role, decision, nominal, catatan, created_at in spec["moderasi"]:
            uid = waka_id if role == "waka2" else ketua_id
            uname = waka_name if role == "waka2" else ketua_name
            db.query(
                """INSERT INTO moderasi (permohonan_id, role, decision, nominal, catatan, user_id, user_name, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                [pid, role, decision, nominal, catatan, uid, uname, created_at],
            )

        sql, params = refresh(pid)
        db.query(sql, params)
