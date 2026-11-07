import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Pencil,
  Printer,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "~/components/AppShell";
import { StatusBadge } from "~/components/StatusBadge";
import { AsnafBadge } from "~/components/AsnafBadge";
import { RupiahInput } from "~/components/RupiahInput";
import { ModerationModal } from "~/components/ModerationModal";
import { apiFetch, useAuthStore } from "~/lib/api";
import { formatDateId, formatRupiah } from "~/lib/format";
import {
  ASNAF_OPTIONS,
  JENIS_DANA_OPTIONS,
  JENIS_KELAMIN_OPTIONS,
  PROGRAM_OPTIONS,
} from "~/lib/constants";
import type { PermohonanDetail } from "~/lib/types";

export default function PermohonanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<PermohonanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inline edit state for Amil
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  // Moderation modal state
  const [modModal, setModModal] = useState<{
    open: boolean;
    decision: "rekomendasi" | "acc" | "tolak";
  }>({ open: false, decision: "rekomendasi" });

  const loadDetail = () => {
    if (!id) return;
    setLoading(true);
    apiFetch<PermohonanDetail>(`/permohonan/${id}`)
      .then((res) => {
        setData(res);
        setDraft({
          nama: res.nama,
          nik: res.nik,
          jenis_kelamin: res.jenis_kelamin,
          alamat: res.alamat,
          kelurahan: res.kelurahan,
          kecamatan: res.kecamatan,
          lembaga_referrer: res.lembaga_referrer || "",
          pekerjaan: res.pekerjaan,
          penghasilan: res.penghasilan,
          kontak: res.kontak,
          asnaf: res.asnaf,
          jumlah_pm: res.jumlah_pm,
          perihal: res.perihal,
          program: res.program,
          jenis_dana: res.jenis_dana || "",
          tanggal_penyaluran: res.tanggal_penyaluran || "",
        });
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat detail permohonan");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role]);

  const handleSaveChanges = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload: Record<string, unknown> = {};
      if (data.can.edit) {
        Object.assign(payload, {
          nama: draft.nama,
          nik: draft.nik,
          jenis_kelamin: draft.jenis_kelamin,
          alamat: draft.alamat,
          kelurahan: draft.kelurahan,
          kecamatan: draft.kecamatan,
          lembaga_referrer: draft.lembaga_referrer || null,
          pekerjaan: draft.pekerjaan,
          penghasilan: Number(draft.penghasilan) || 0,
          kontak: draft.kontak,
          asnaf: draft.asnaf,
          jumlah_pm: Number(draft.jumlah_pm) || 1,
          perihal: draft.perihal,
          program: draft.program,
        });
      }
      if (data.can.distribute) {
        if (draft.jenis_dana) payload.jenis_dana = draft.jenis_dana;
        if (draft.tanggal_penyaluran) payload.tanggal_penyaluran = draft.tanggal_penyaluran;
      }

      const updated = await apiFetch<PermohonanDetail>(`/permohonan/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setData(updated);
      setEditingField(null);
      setSuccessMsg("Data permohonan berhasil disimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const handleModerationSubmit = async (payload: {
    decision: "rekomendasi" | "acc" | "tolak";
    nominal?: number;
    catatan?: string;
  }) => {
    if (!data) return;
    const updated = await apiFetch<PermohonanDetail>(`/permohonan/${data.id}/moderasi`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setData(updated);
    setSuccessMsg("Keputusan moderasi berhasil disimpan.");
  };

  if (loading || !data) {
    return (
      <AppShell title="Detail Permohonan">
        <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white p-8" />
      </AppShell>
    );
  }

  const assessmentFiles = data.attachments.filter((a) => a.category === "assessment");
  const assessmentDocs = assessmentFiles.filter((a) => a.kind === "dokumen").length;
  const assessmentMedia = assessmentFiles.filter((a) => a.kind === "media").length;

  const penyaluranFiles = data.attachments.filter((a) => a.category === "penyaluran");
  const penyaluranDocs = penyaluranFiles.filter((a) => a.kind === "dokumen").length;
  const penyaluranMedia = penyaluranFiles.filter((a) => a.kind === "media").length;

  const wakaHistory = data.moderasi.filter((m) => m.role === "waka2");
  const latestWaka = wakaHistory[wakaHistory.length - 1] || null;

  const ketuaHistory = data.moderasi.filter((m) => m.role === "ketua");
  const latestKetua = ketuaHistory[ketuaHistory.length - 1] || null;

  const isAmil = user?.role === "amil";
  const isWaka2 = user?.role === "waka2";
  const isKetua = user?.role === "ketua";

  const renderEditableRow = (
    key: string,
    label: string,
    displayValue: React.ReactNode,
    inputType: "text" | "number" | "rupiah" | "select" = "text",
    options?: readonly string[],
  ) => {
    const canEditField = isAmil && data.can.edit;
    const isEditing = editingField === key && canEditField;

    return (
      <div className="grid grid-cols-1 gap-1.5 border-b border-slate-100 py-3 sm:grid-cols-12 sm:items-center">
        <dt className="text-xs font-semibold text-slate-600 sm:col-span-4">{label}</dt>
        <dd className="flex items-center justify-between gap-3 sm:col-span-8">
          <div className="min-w-0 flex-1 text-sm font-medium text-slate-900">
            {isEditing ? (
              inputType === "rupiah" ? (
                <RupiahInput
                  value={Number(draft[key]) || 0}
                  onChange={(v) => setDraft({ ...draft, [key]: v })}
                  autoFocus
                />
              ) : inputType === "select" && options ? (
                <select
                  value={String(draft[key] ?? "")}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="w-full max-w-md rounded-xl border border-emerald-500 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none"
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={inputType}
                  value={String(draft[key] ?? "")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [key]: inputType === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                  autoFocus
                  className="w-full max-w-md rounded-xl border border-emerald-500 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none"
                />
              )
            ) : (
              displayValue
            )}
          </div>

          {canEditField && (
            <button
              type="button"
              onClick={() => setEditingField(isEditing ? null : key)}
              className="no-print rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700"
              title={`Ubah ${label}`}
              aria-label={`Ubah ${label}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </dd>
      </div>
    );
  };

  return (
    <AppShell
      title="Detail Permohonan"
      subtitle={`No. Register ${data.no_register} • ${data.nama}`}
      actions={<StatusBadge status={data.status} />}
    >
      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
          {successMsg}
        </div>
      )}

      {/* Main Card matching `detail permohonan.png` */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-extrabold tracking-wide text-slate-900 uppercase">
              DETAIL PERMOHONAN
            </h2>
            <p className="text-xs text-slate-500">
              Formulir informasi pemohon, hasil verifikasi assessment, moderasi pimpinan & penyaluran
            </p>
          </div>
          <Link
            to={`/mustahik/${data.mustahik_id}`}
            className="no-print inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"
          >
            <span>Lihat Profil Mustahik</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <dl className="divide-y divide-slate-100">
          {/* Read-only No. Register & Tanggal */}
          <div className="grid grid-cols-1 gap-1.5 py-3 sm:grid-cols-12 sm:items-center">
            <dt className="text-xs font-bold text-slate-900 sm:col-span-4">No. Register</dt>
            <dd className="font-mono text-sm font-extrabold text-slate-900 sm:col-span-8">
              {data.no_register}
            </dd>
          </div>

          <div className="grid grid-cols-1 gap-1.5 py-3 sm:grid-cols-12 sm:items-center">
            <dt className="text-xs font-semibold text-slate-600 sm:col-span-4">Tanggal</dt>
            <dd className="text-sm font-medium text-slate-900 sm:col-span-8">
              {formatDateId(data.tanggal)}
            </dd>
          </div>

          {renderEditableRow("nama", "Nama Pemohon", String(draft.nama ?? data.nama))}
          {renderEditableRow(
            "nik",
            "NIK Pemohon",
            <span className="font-mono">{String(draft.nik ?? data.nik)}</span>,
          )}
          {renderEditableRow(
            "jenis_kelamin",
            "Jenis Kelamin",
            String(draft.jenis_kelamin ?? data.jenis_kelamin),
            "select",
            JENIS_KELAMIN_OPTIONS,
          )}
          {renderEditableRow(
            "alamat",
            "Nama Jalan/Kampung/Gang",
            String(draft.alamat ?? data.alamat),
          )}
          {renderEditableRow("kelurahan", "Kelurahan", String(draft.kelurahan ?? data.kelurahan))}
          {renderEditableRow("kecamatan", "Kecamatan", String(draft.kecamatan ?? data.kecamatan))}
          {renderEditableRow(
            "lembaga_referrer",
            "Lembaga Referrer",
            String(draft.lembaga_referrer || "—"),
          )}
          {renderEditableRow(
            "pekerjaan",
            "Status Pekerjaan/Usaha/Sekolah PM",
            String(draft.pekerjaan ?? data.pekerjaan),
          )}
          {renderEditableRow(
            "penghasilan",
            "Penghasilan PM per Bulan",
            <span className="font-mono">{formatRupiah(Number(draft.penghasilan ?? data.penghasilan))}</span>,
            "rupiah",
          )}
          {renderEditableRow("kontak", "Kontak", String(draft.kontak ?? data.kontak))}
          {renderEditableRow(
            "asnaf",
            "Jenis Asnaf",
            <AsnafBadge asnaf={String(draft.asnaf ?? data.asnaf)} />,
            "select",
            ASNAF_OPTIONS,
          )}
          {renderEditableRow(
            "jumlah_pm",
            "Jumlah Penerima Manfaat",
            String(draft.jumlah_pm ?? data.jumlah_pm),
            "number",
          )}
          {renderEditableRow("perihal", "Perihal", String(draft.perihal ?? data.perihal))}
          {renderEditableRow(
            "program",
            "Program",
            String(draft.program ?? data.program),
            "select",
            PROGRAM_OPTIONS,
          )}

          {/* Assessment Row matching Wireframe */}
          <div className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-12 sm:items-center">
            <dt className="text-xs font-semibold text-slate-600 sm:col-span-4">Assessment</dt>
            <dd className="flex items-center justify-between gap-3 sm:col-span-8">
              <span className="text-xs italic text-slate-600">
                {assessmentDocs} Document(s), {assessmentMedia} Media(s)
                {data.catatan_assessment ? " • Catatan terisi" : ""}
              </span>
              <Link
                to={`/permohonan/${data.id}/assessment`}
                className="no-print text-xs font-bold text-blue-600 underline hover:text-blue-800"
              >
                Detail
              </Link>
            </dd>
          </div>

          {/* Moderasi Wakil Ketua II Row */}
          {(latestWaka || isAmil || isKetua) && (
            <div className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-12 sm:items-center">
              <dt className="text-xs font-semibold text-slate-600 sm:col-span-4">
                Moderasi Wakil Ketua II
              </dt>
              <dd className="flex items-center justify-between gap-3 sm:col-span-8">
                {latestWaka ? (
                  <div className="flex flex-wrap items-center gap-4">
                    {latestWaka.decision === "rekomendasi" ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Rekomendasi
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {formatRupiah(latestWaka.nominal)}
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                        <XCircle className="h-4 w-4" />
                        Ditolak
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">(belum ada keputusan)</span>
                )}
                <Link
                  to={`/permohonan/${data.id}/riwayat`}
                  className="no-print text-xs font-bold text-blue-600 underline hover:text-blue-800"
                >
                  Detail
                </Link>
              </dd>
            </div>
          )}

          {/* Moderasi Ketua Row */}
          {(latestKetua || isAmil) && (
            <div className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-12 sm:items-center">
              <dt className="text-xs font-semibold text-slate-600 sm:col-span-4">Moderasi Ketua</dt>
              <dd className="flex items-center justify-between gap-3 sm:col-span-8">
                {latestKetua ? (
                  <div className="flex flex-wrap items-center gap-4">
                    {latestKetua.decision === "acc" ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          ACC
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {formatRupiah(latestKetua.nominal)}
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                        <XCircle className="h-4 w-4" />
                        Ditolak
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">(belum ada keputusan)</span>
                )}
                <Link
                  to={`/permohonan/${data.id}/riwayat`}
                  className="no-print text-xs font-bold text-blue-600 underline hover:text-blue-800"
                >
                  Detail
                </Link>
              </dd>
            </div>
          )}

          {/* Penyaluran Section (Visible to Amil or when already distributed) */}
          {(isAmil || data.jenis_dana || data.tanggal_penyaluran || penyaluranFiles.length > 0) && (
            <>
              <div className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-12 sm:items-center">
                <dt className="text-xs font-semibold text-slate-600 sm:col-span-4">Jenis Dana</dt>
                <dd className="sm:col-span-8">
                  {isAmil && data.can.distribute ? (
                    <select
                      aria-label="Jenis Dana"
                      value={String(draft.jenis_dana ?? "")}
                      onChange={(e) => setDraft({ ...draft, jenis_dana: e.target.value })}
                      className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="">-- Pilih Jenis Dana --</option>
                      {JENIS_DANA_OPTIONS.map((jd) => (
                        <option key={jd} value={jd}>
                          {jd}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm font-medium text-slate-900">
                      {data.jenis_dana || "(belum ada)"}
                    </span>
                  )}
                </dd>
              </div>

              <div className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-12 sm:items-center">
                <dt className="text-xs font-semibold text-slate-600 sm:col-span-4">
                  Tanggal Penyaluran
                </dt>
                <dd className="flex items-center justify-between gap-3 sm:col-span-8">
                  {isAmil && data.can.distribute ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        aria-label="Tanggal Penyaluran"
                        value={String(draft.tanggal_penyaluran ?? "")}
                        onChange={(e) =>
                          setDraft({ ...draft, tanggal_penyaluran: e.target.value })
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-900">
                      {formatDateId(data.tanggal_penyaluran)}
                    </span>
                  )}
                </dd>
              </div>

              <div className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-12 sm:items-center">
                <dt className="text-xs font-semibold text-slate-600 sm:col-span-4">
                  Dokumentasi Penyaluran
                </dt>
                <dd className="flex items-center justify-between gap-3 sm:col-span-8">
                  <span className="text-xs italic text-slate-600">
                    {penyaluranDocs} Document(s), {penyaluranMedia} Media(s)
                  </span>
                  <Link
                    to={`/permohonan/${data.id}/penyaluran`}
                    className="no-print text-xs font-bold text-blue-600 underline hover:text-blue-800"
                  >
                    Detail
                  </Link>
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {/* Bottom Action Bar matching POV Wireframes */}
      <div className="no-print mt-6 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/permohonan")}
          className="rounded-full border border-slate-300 bg-white px-7 py-2.5 text-xs font-bold tracking-wider text-slate-700 uppercase shadow-2xs transition hover:bg-slate-100"
        >
          BATAL
        </button>

        {/* Print Button (Cetak) */}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-7 py-2.5 text-xs font-bold tracking-wider text-slate-800 uppercase shadow-2xs transition hover:bg-slate-100"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Cetak</span>
        </button>

        {/* Amil Save Button */}
        {isAmil && (data.can.edit || data.can.distribute) && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveChanges}
            className="rounded-full bg-emerald-700 px-8 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-md transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {saving ? "MENYIMPAN..." : "SIMPAN"}
          </button>
        )}

        {/* Waka II Moderation Actions */}
        {isWaka2 && data.can.moderate && (
          <>
            <button
              type="button"
              onClick={() => setModModal({ open: true, decision: "tolak" })}
              className="rounded-full border border-rose-300 bg-rose-50 px-7 py-2.5 text-xs font-bold tracking-wider text-rose-700 uppercase shadow-2xs transition hover:bg-rose-600 hover:text-white"
            >
              TOLAK
            </button>
            <button
              type="button"
              onClick={() => setModModal({ open: true, decision: "rekomendasi" })}
              className="rounded-full bg-emerald-700 px-7 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-md transition hover:bg-emerald-800"
            >
              REKOMENDASI
            </button>
          </>
        )}

        {/* Ketua Moderation Actions */}
        {isKetua && data.can.moderate && (
          <>
            <button
              type="button"
              onClick={() => setModModal({ open: true, decision: "tolak" })}
              className="rounded-full border border-rose-300 bg-rose-50 px-7 py-2.5 text-xs font-bold tracking-wider text-rose-700 uppercase shadow-2xs transition hover:bg-rose-600 hover:text-white"
            >
              TOLAK
            </button>
            <button
              type="button"
              onClick={() => setModModal({ open: true, decision: "acc" })}
              className="rounded-full bg-emerald-700 px-8 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-md transition hover:bg-emerald-800"
            >
              ACC
            </button>
          </>
        )}
      </div>

      {/* Moderation Modal */}
      {(isWaka2 || isKetua) && (
        <ModerationModal
          open={modModal.open}
          onClose={() => setModModal({ ...modModal, open: false })}
          role={isWaka2 ? "waka2" : "ketua"}
          decision={modModal.decision}
          defaultNominal={data.nominal_acc ?? data.nominal_rekomendasi}
          onSubmit={handleModerationSubmit}
        />
      )}
    </AppShell>
  );
}
