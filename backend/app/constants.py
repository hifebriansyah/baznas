"""Reference data shared by validation and the /meta endpoint."""

ROLES = {"amil": "Amil", "waka2": "Wakil Ketua II", "ketua": "Ketua"}

JENIS_KELAMIN = ["Laki-laki", "Perempuan"]

ASNAF = ["Fakir", "Miskin", "Amil", "Mualaf", "Riqab", "Gharim", "Fisabilillah", "Ibnu Sabil"]

PROGRAM = ["Cianjur Makmur", "Cianjur Takwa", "Cianjur Cerdas", "Cianjur Sehat", "Cianjur Peduli"]

JENIS_DANA = ["Zakat", "Infak Terikat", "Infak Tidak Terikat", "Dana Sosial Keagamaan Lainnya", "CSR"]

STATUS = {
    "diajukan": "Diajukan",
    "assessment": "Assessment",
    "rekomendasi": "ACC Wakil Ketua",
    "ditolak_waka": "Ditolak Wakil Ketua",
    "acc": "ACC Ketua",
    "ditolak": "Ditolak",
    "selesai": "Selesai",
}

# Which statuses allow which action (enforced in main.can and mirrored by the `can` flags sent to the web app).
EDITABLE = {"diajukan", "assessment"}
ASSESSABLE = {"diajukan", "assessment", "rekomendasi", "ditolak_waka"}
WAKA_MODERATABLE = {"assessment", "rekomendasi", "ditolak_waka"}
KETUA_MODERATABLE = {"rekomendasi", "ditolak_waka", "acc", "ditolak"}
DISTRIBUTABLE = {"acc", "selesai"}

MEDIA_TYPES = {"image/jpeg", "image/png", "image/webp"}
DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
MAX_UPLOAD_BYTES = 4 * 1024 * 1024  # Vercel Functions accept request bodies up to 4.5 MB
CHUNK_CHARS = 900_000  # base64 characters per row, well under D1's 2 MB row limit
