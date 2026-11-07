# Pendis BAZNAS — Aplikasi Pendistribusian ZIS

Aplikasi web pendistribusian zakat, infak, dan sedekah (ZIS) untuk mendukung operasional Amil, Wakil Ketua II, dan Ketua BAZNAS.

- **Web App (GitHub Pages + Cloudflare):** [https://baznas.situs.id](https://baznas.situs.id)
- **UI Component Library (Storybook):** [https://baznas.situs.id/storybook/](https://baznas.situs.id/storybook/)
- **Backend API (Vercel Python FastAPI):** [https://baznas-api.vercel.app](https://baznas-api.vercel.app)
- **Database:** Cloudflare D1 (`baznas`, ID `17ac6602-09bf-43f7-ab31-38f072914b6a`)

## Fitur Utama (Sesuai PRD & Wireframe)

1. **Dashboard Eksekutif & Antrean Tugas Peran:** Ringkasan KPI permohonan, total dana ACC Ketua, dana tersalurkan, jumlah penerima manfaat, dan antrean tugas sesuai peran aktif.
2. **Registrasi & Daftar Permohonan Bantuan:** Pencarian cepat, filter status & program, serta pencatatan permohonan baru yang secara otomatis membuat atau menautkan data Mustahik berdasarkan 16 digit NIK.
3. **Assessment Lapangan:** Penyimpanan catatan survei (`Simpan` / `Ubah`) serta unggah, pratinjau, unduh, dan hapus berkas **Dokumen** & **Media** dengan mode tampilan **Tiles / List**.
4. **Moderasi Berjenjang 2 Tingkat:**
   - **Wakil Ketua II:** Memberikan **Rekomendasi** (beserta nominal & catatan) atau **Tolak** (beserta alasan).
   - **Ketua:** Memberikan keputusan akhir **ACC** (beserta nominal & catatan) atau **Tolak** (beserta alasan), termasuk kemampuan menganulir penolakan tingkat pertama.
5. **Riwayat Moderasi (Append-Only Audit Log):** Mencatat seluruh riwayat keputusan beserta stempel waktu WIB dan mendukung pembaruan keputusan (*Update Rekomendasi*, *Update ACC*, *Update Tolak*) tanpa menghapus jejak sebelumnya.
6. **Penyaluran & Dokumentasi:** Pemilihan Jenis Dana, Tanggal Penyaluran, dan unggah bukti serah terima penyaluran yang otomatis menandai permohonan menjadi **Selesai**.
7. **Basis Data Mustahik:** Daftar dan profil lengkap mustahik (baik dari input manual maupun otomatis dari permohonan) beserta perhitungan umur otomatis dan riwayat permohonan.
8. **Simulasi Peran (POV Switcher):** Pengalih peran satu klik di sidebar (**Amil Pelaksana**, **Wakil Ketua II**, **Ketua BAZNAS**) untuk menguji seluruh alur.

## Akun Peran

| Peran | Username | Kata Sandi |
|---|---|---|
| Amil Pelaksana | `amil` | `baznas123` |
| Wakil Ketua II | `waka2` | `baznas123` |
| Ketua BAZNAS | `ketua` | `baznas123` |

## Pengembangan Lokal

```bash
npm install
npm run dev          # Menjalankan frontend di http://localhost:5173
npm run storybook    # Menjalankan Storybook di http://localhost:6006
npm run typecheck    # Pemeriksaan tipe React Router + TypeScript
npm run lint         # Pemeriksaan ESLint
npm run build        # Build produksi ke build/client
```
