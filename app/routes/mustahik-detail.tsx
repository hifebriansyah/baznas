import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { AppShell } from "~/components/AppShell";
import { AsnafBadge } from "~/components/AsnafBadge";
import { StatusBadge } from "~/components/StatusBadge";
import { RupiahInput } from "~/components/RupiahInput";
import { apiFetch, useAuthStore } from "~/lib/api";
import { calculateAge, formatDateId, formatDateShort, formatRupiah } from "~/lib/format";
import { ASNAF_OPTIONS, JENIS_KELAMIN_OPTIONS } from "~/lib/constants";
import type { MustahikDetail } from "~/lib/types";

export default function MustahikDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<MustahikDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [penghasilan, setPenghasilan] = useState(0);
  const [kontak, setKontak] = useState("");
  const [asnaf, setAsnaf] = useState("Miskin");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<MustahikDetail>(`/mustahik/${id}`)
      .then((res) => {
        setData(res);
        setNama(res.nama);
        setNik(res.nik);
        setJenisKelamin(res.jenis_kelamin);
        setTanggalLahir(res.tanggal_lahir || "");
        setAlamat(res.alamat);
        setKelurahan(res.kelurahan);
        setKecamatan(res.kecamatan);
        setPekerjaan(res.pekerjaan);
        setPenghasilan(res.penghasilan);
        setKontak(res.kontak);
        setAsnaf(res.asnaf);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat detail mustahik");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const updated = await apiFetch<MustahikDetail>(`/mustahik/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nama,
          nik,
          jenis_kelamin: jenisKelamin,
          tanggal_lahir: tanggalLahir || null,
          alamat,
          kelurahan,
          kecamatan,
          pekerjaan,
          penghasilan,
          kontak,
          asnaf,
        }),
      });
      setData(updated);
      setSavedMsg("Profil mustahik berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui mustahik");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <AppShell title="Profil Mustahik">
        <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white p-8" />
      </AppShell>
    );
  }

  const isAmil = user?.role === "amil";
  const age = calculateAge(tanggalLahir || data.tanggal_lahir);
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none disabled:bg-slate-50";

  return (
    <AppShell
      title={data.nama}
      subtitle={`NIK ${data.nik} • Sumber data: ${data.source === "manual" ? "Input Manual" : "Otomatis dari Permohonan"}`}
      actions={
        <div className="flex items-center gap-3">
          <AsnafBadge asnaf={data.asnaf} />
          <Link
            to="/mustahik"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali</span>
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
          {savedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile Form */}
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-6"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase">Biodata Mustahik</h2>
            <p className="text-xs text-slate-500">
              Umur saat ini: {age !== null ? `${age} Tahun` : "Tanggal lahir belum diisi"}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Nama Mustahik
              </label>
              <input
                type="text"
                disabled={!isAmil}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">NIK</label>
                <input
                  type="text"
                  disabled={!isAmil}
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Jenis Kelamin
                </label>
                <select
                  disabled={!isAmil}
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Tanggal Lahir (TTL)
                </label>
                <input
                  type="date"
                  disabled={!isAmil}
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Jenis Asnaf
                </label>
                <select
                  disabled={!isAmil}
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

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Nama Jalan/Kampung/Gang
              </label>
              <input
                type="text"
                disabled={!isAmil}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Kelurahan</label>
                <input
                  type="text"
                  disabled={!isAmil}
                  value={kelurahan}
                  onChange={(e) => setKelurahan(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Kecamatan</label>
                <input
                  type="text"
                  disabled={!isAmil}
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Pekerjaan</label>
                <input
                  type="text"
                  disabled={!isAmil}
                  value={pekerjaan}
                  onChange={(e) => setPekerjaan(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Kontak</label>
                <input
                  type="text"
                  disabled={!isAmil}
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Penghasilan per Bulan
              </label>
              <RupiahInput
                value={penghasilan}
                onChange={setPenghasilan}
                disabled={!isAmil}
              />
            </div>
          </div>

          {isAmil && (
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          )}
        </form>

        {/* Linked Permohonan History */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase">
              Riwayat Permohonan Bantuan ({data.permohonan.length})
            </h2>
            <p className="text-xs text-slate-500">
              Daftar permohonan yang tertaut dengan NIK {data.nik}
            </p>
          </div>

          {data.permohonan.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Belum ada permohonan bantuan untuk mustahik ini.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {data.permohonan.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/permohonan/${p.id}`)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-emerald-400 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800">
                      #{p.no_register} • {formatDateShort(p.tanggal)}
                    </span>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-slate-900">{p.perihal}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>Program: {p.program}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatRupiah(p.nominal_acc ?? p.nominal_rekomendasi)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-[11px] text-slate-400">
            Terdaftar sejak {formatDateId(data.created_at.slice(0, 10))}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
