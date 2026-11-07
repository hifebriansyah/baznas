import { useState } from "react";
import { Modal } from "./Modal";
import { RupiahInput } from "./RupiahInput";
import { ASNAF_OPTIONS, JENIS_KELAMIN_OPTIONS } from "~/lib/constants";
import { apiFetch } from "~/lib/api";

interface CreateMustahikModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (created: { id: number }) => void;
}

export function CreateMustahikModal({
  open,
  onClose,
  onCreated,
}: CreateMustahikModalProps) {
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [tanggalLahir, setTanggalLahir] = useState("1988-01-01");
  const [alamat, setAlamat] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [penghasilan, setPenghasilan] = useState<number>(600000);
  const [kontak, setKontak] = useState("");
  const [asnaf, setAsnaf] = useState<string>("Miskin");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setNama("");
    setNik("");
    setJenisKelamin("Laki-laki");
    setTanggalLahir("1988-01-01");
    setAlamat("");
    setKelurahan("");
    setKecamatan("");
    setPekerjaan("");
    setPenghasilan(600000);
    setKontak("");
    setAsnaf("Miskin");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nik.length !== 16) {
      setError("NIK wajib terdiri dari 16 digit angka.");
      return;
    }
    setBusy(true);
    try {
      const created = await apiFetch<{ id: number }>("/mustahik", {
        method: "POST",
        body: JSON.stringify({
          nama,
          nik,
          jenis_kelamin: jenisKelamin,
          tanggal_lahir: tanggalLahir,
          alamat,
          kelurahan,
          kecamatan,
          pekerjaan,
          penghasilan,
          kontak,
          asnaf,
        }),
      });
      reset();
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data mustahik");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="MEMBUAT DATA MUSTAHIK BARU"
      subtitle="Tambahkan data penerima manfaat ke basis data BAZNAS"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12 sm:items-center">
          <label
            htmlFor="cm-nama"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Nama Mustahik
          </label>
          <div className="sm:col-span-8">
            <input
              id="cm-nama"
              type="text"
              required
              placeholder="Nama lengkap mustahik"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cm-nik"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            NIK
          </label>
          <div className="sm:col-span-8">
            <input
              id="cm-nik"
              type="text"
              inputMode="numeric"
              required
              placeholder="16 digit NIK KTP"
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
              className={`${inputClass} font-mono`}
            />
          </div>

          <label
            htmlFor="cm-jk"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Jenis Kelamin
          </label>
          <div className="sm:col-span-8">
            <select
              id="cm-jk"
              value={jenisKelamin}
              onChange={(e) => setJenisKelamin(e.target.value as "Laki-laki" | "Perempuan")}
              className={inputClass}
            >
              {JENIS_KELAMIN_OPTIONS.map((jk) => (
                <option key={jk} value={jk}>
                  {jk}
                </option>
              ))}
            </select>
          </div>

          <label
            htmlFor="cm-ttl"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            TTL (Tanggal Lahir)
          </label>
          <div className="sm:col-span-8">
            <input
              id="cm-ttl"
              type="date"
              required
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cm-alamat"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Nama Jalan/Kampung/Gang
          </label>
          <div className="sm:col-span-8">
            <input
              id="cm-alamat"
              type="text"
              required
              placeholder="Kampung Halaman RT. 01 RW. 02"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cm-kelurahan"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Kelurahan
          </label>
          <div className="sm:col-span-8">
            <input
              id="cm-kelurahan"
              type="text"
              required
              placeholder="Kelurahan / Desa"
              value={kelurahan}
              onChange={(e) => setKelurahan(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cm-kecamatan"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Kecamatan
          </label>
          <div className="sm:col-span-8">
            <input
              id="cm-kecamatan"
              type="text"
              required
              placeholder="Kecamatan"
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cm-pekerjaan"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Status Pekerjaan/Usaha/Sekolah
          </label>
          <div className="sm:col-span-8">
            <input
              id="cm-pekerjaan"
              type="text"
              required
              placeholder="Contoh: Pedagang Bakso / Siswa SMP"
              value={pekerjaan}
              onChange={(e) => setPekerjaan(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cm-penghasilan"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Penghasilan per Bulan
          </label>
          <div className="sm:col-span-8">
            <RupiahInput
              id="cm-penghasilan"
              value={penghasilan}
              onChange={setPenghasilan}
            />
          </div>

          <label
            htmlFor="cm-kontak"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Kontak
          </label>
          <div className="sm:col-span-8">
            <input
              id="cm-kontak"
              type="tel"
              required
              placeholder="08123456789"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cm-asnaf"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Jenis Asnaf
          </label>
          <div className="sm:col-span-8">
            <select
              id="cm-asnaf"
              value={asnaf}
              onChange={(e) => setAsnaf(e.target.value)}
              className={inputClass}
            >
              {ASNAF_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-full border border-slate-300 bg-white px-6 py-2 text-xs font-bold tracking-wider text-slate-700 uppercase transition hover:bg-slate-100"
          >
            BATAL
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-emerald-700 px-6 py-2 text-xs font-bold tracking-wider text-white uppercase shadow-xs transition hover:bg-emerald-800"
          >
            {busy ? "MENYIMPAN..." : "SIMPAN"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
