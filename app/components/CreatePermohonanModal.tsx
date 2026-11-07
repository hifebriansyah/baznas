import { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";
import { RupiahInput } from "./RupiahInput";
import { ASNAF_OPTIONS, JENIS_KELAMIN_OPTIONS, PROGRAM_OPTIONS } from "~/lib/constants";
import { apiFetch } from "~/lib/api";
import type { MustahikItem } from "~/lib/types";

interface CreatePermohonanModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (created: { id: number; no_register: string }) => void;
}

export function CreatePermohonanModal({
  open,
  onClose,
  onCreated,
}: CreatePermohonanModalProps) {
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [alamat, setAlamat] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [lembagaReferrer, setLembagaReferrer] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [penghasilan, setPenghasilan] = useState<number>(500000);
  const [kontak, setKontak] = useState("");
  const [asnaf, setAsnaf] = useState<string>("Miskin");
  const [jumlahPm, setJumlahPm] = useState<number>(1);
  const [perihal, setPerihal] = useState("");
  const [program, setProgram] = useState<string>("Cianjur Makmur");

  const [matchedMustahik, setMatchedMustahik] = useState<MustahikItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNama("");
    setNik("");
    setJenisKelamin("Laki-laki");
    setAlamat("");
    setKelurahan("");
    setKecamatan("");
    setLembagaReferrer("");
    setPekerjaan("");
    setPenghasilan(500000);
    setKontak("");
    setAsnaf("Miskin");
    setJumlahPm(1);
    setPerihal("");
    setProgram("Cianjur Makmur");
    setMatchedMustahik(null);
    setError(null);
  };

  const handleNikChange = async (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    setNik(digits);
    setMatchedMustahik(null);
    if (digits.length === 16) {
      try {
        const found = await apiFetch<MustahikItem>(`/mustahik/nik/${digits}`);
        setMatchedMustahik(found);
      } catch {
        setMatchedMustahik(null);
      }
    }
  };

  const applyMustahikData = (m: MustahikItem) => {
    setNama(m.nama);
    setJenisKelamin(m.jenis_kelamin);
    setAlamat(m.alamat);
    setKelurahan(m.kelurahan);
    setKecamatan(m.kecamatan);
    setPekerjaan(m.pekerjaan);
    setPenghasilan(m.penghasilan);
    setKontak(m.kontak);
    setAsnaf(m.asnaf);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nik.length !== 16) {
      setError("NIK Pemohon wajib 16 digit angka.");
      return;
    }
    setBusy(true);
    try {
      const created = await apiFetch<{ id: number; no_register: string }>("/permohonan", {
        method: "POST",
        body: JSON.stringify({
          nama,
          nik,
          jenis_kelamin: jenisKelamin,
          alamat,
          kelurahan,
          kecamatan,
          lembaga_referrer: lembagaReferrer || null,
          pekerjaan,
          penghasilan,
          kontak,
          asnaf,
          jumlah_pm: jumlahPm,
          perihal,
          program,
        }),
      });
      resetForm();
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan permohonan");
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
      title="REGISTRASI PERMOHONAN BANTUAN"
      subtitle="Data mustahik akan otomatis dibuat atau ditautkan berdasarkan NIK Pemohon"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12 sm:items-center">
          <label className="text-xs font-semibold text-slate-700 sm:col-span-4">No. Register</label>
          <div className="sm:col-span-8">
            <input
              type="text"
              disabled
              value="Otomatis (Format: 2026-XXXXX)"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 font-mono text-xs font-semibold text-slate-500"
            />
          </div>

          <label
            htmlFor="cp-nik"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            NIK Pemohon (16 Digit)
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-nik"
              type="text"
              inputMode="numeric"
              required
              placeholder="Contoh: 3203011504880001"
              value={nik}
              onChange={(e) => handleNikChange(e.target.value)}
              className={`${inputClass} font-mono`}
            />
            {matchedMustahik && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    Mustahik ditemukan: <strong>{matchedMustahik.nama}</strong> ({matchedMustahik.asnaf})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => applyMustahikData(matchedMustahik)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800"
                >
                  <Sparkles className="h-3 w-3" />
                  Isi Otomatis
                </button>
              </div>
            )}
          </div>

          <label
            htmlFor="cp-nama"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Nama Pemohon
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-nama"
              type="text"
              required
              placeholder="Nama lengkap pemohon / lembaga"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-jk"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Jenis Kelamin
          </label>
          <div className="sm:col-span-8">
            <select
              id="cp-jk"
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
            htmlFor="cp-alamat"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Nama Jalan/Kampung/Gang
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-alamat"
              type="text"
              required
              placeholder="Kp. Babakan RT. 01 RW. 02"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-kelurahan"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Kelurahan / Desa
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-kelurahan"
              type="text"
              required
              placeholder="Contoh: Panunggangan Utara"
              value={kelurahan}
              onChange={(e) => setKelurahan(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-kecamatan"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Kecamatan
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-kecamatan"
              type="text"
              required
              placeholder="Contoh: Pinang"
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-referrer"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Lembaga Referrer
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-referrer"
              type="text"
              placeholder="Contoh: UPZ Pinang (Opsional)"
              value={lembagaReferrer}
              onChange={(e) => setLembagaReferrer(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-pekerjaan"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Status Pekerjaan/Usaha/Sekolah PM
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-pekerjaan"
              type="text"
              required
              placeholder="Contoh: Pedagang Bakso"
              value={pekerjaan}
              onChange={(e) => setPekerjaan(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-penghasilan"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Penghasilan PM per Bulan
          </label>
          <div className="sm:col-span-8">
            <RupiahInput
              id="cp-penghasilan"
              value={penghasilan}
              onChange={setPenghasilan}
            />
          </div>

          <label
            htmlFor="cp-kontak"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Kontak
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-kontak"
              type="tel"
              required
              placeholder="08123456789"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-asnaf"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Jenis Asnaf
          </label>
          <div className="sm:col-span-8">
            <select
              id="cp-asnaf"
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

          <label
            htmlFor="cp-jumlah-pm"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Jumlah Penerima Manfaat
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-jumlah-pm"
              type="number"
              min={1}
              required
              value={jumlahPm}
              onChange={(e) => setJumlahPm(Math.max(1, Number(e.target.value) || 1))}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-perihal"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Perihal
          </label>
          <div className="sm:col-span-8">
            <input
              id="cp-perihal"
              type="text"
              required
              placeholder="Contoh: Bantuan modal usaha awal"
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              className={inputClass}
            />
          </div>

          <label
            htmlFor="cp-program"
            className="text-xs font-semibold text-slate-700 sm:col-span-4"
          >
            Program
          </label>
          <div className="sm:col-span-8">
            <select
              id="cp-program"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className={inputClass}
            >
              {PROGRAM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
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
