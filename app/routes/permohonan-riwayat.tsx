import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CheckCircle2, XCircle, History } from "lucide-react";
import { AppShell } from "~/components/AppShell";
import { StatusBadge } from "~/components/StatusBadge";
import { ModerationModal } from "~/components/ModerationModal";
import { apiFetch, useAuthStore } from "~/lib/api";
import { formatDateId, formatDateTimeWib, formatRupiah } from "~/lib/format";
import type { PermohonanDetail } from "~/lib/types";

export default function PermohonanRiwayatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<PermohonanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat riwayat moderasi");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role]);

  const handleUpdateModeration = async (payload: {
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
  };

  if (loading || !data) {
    return (
      <AppShell title="Riwayat Moderasi">
        <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white p-8" />
      </AppShell>
    );
  }

  const isWaka2 = user?.role === "waka2";
  const isKetua = user?.role === "ketua";

  return (
    <AppShell
      title="Riwayat Moderasi Pimpinan"
      subtitle={`Jejak audit keputusan Wakil Ketua II dan Ketua BAZNAS • #${data.no_register}`}
      actions={<StatusBadge status={data.status} />}
    >
      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      {/* Main Card matching `riwayat moderasi pov waka 2.png` and `riwayat moderasi pov ketua.png` */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
          <History className="h-5 w-5 text-emerald-700" />
          <h2 className="text-base font-extrabold tracking-wide text-slate-900 uppercase">
            RIWAYAT MODERASI
          </h2>
        </div>

        {/* Header Fields: No. Register, Nama Pemohon, Tanggal */}
        <dl className="grid max-w-lg grid-cols-3 gap-y-2.5 border-b border-slate-100 pb-6 text-sm">
          <dt className="font-bold text-slate-900">No. Register</dt>
          <dd className="col-span-2 font-mono font-extrabold text-slate-900">{data.no_register}</dd>

          <dt className="font-medium text-slate-600">Nama Pemohon</dt>
          <dd className="col-span-2 font-semibold text-slate-900">{data.nama}</dd>

          <dt className="font-medium text-slate-600">Tanggal</dt>
          <dd className="col-span-2 font-medium text-slate-900">{formatDateId(data.tanggal)}</dd>
        </dl>

        {/* Append-only Timeline */}
        <div className="mt-6 space-y-4">
          {data.moderasi.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-xs text-slate-500">
              Belum ada riwayat keputusan moderasi untuk permohonan ini.
            </div>
          ) : (
            data.moderasi.map((entry) => {
              const roleTitle = entry.role === "waka2" ? "Waka II" : "Ketua";
              const actionTitle =
                entry.decision === "rekomendasi"
                  ? "Rekomendasi"
                  : entry.decision === "acc"
                    ? "ACC"
                    : "Tolak";
              const isReject = entry.decision === "tolak";

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-2xs"
                >
                  <p className="text-xs font-medium text-slate-500">
                    {formatDateTimeWib(entry.created_at)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {isReject ? (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      <span className="text-sm font-bold text-slate-900">
                        {roleTitle} {actionTitle}
                      </span>
                      <span className="text-xs text-slate-500">({entry.user_name})</span>
                    </div>

                    {entry.nominal ? (
                      <span className="font-mono text-sm font-extrabold text-slate-900">
                        {formatRupiah(entry.nominal)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                        Ditolak
                      </span>
                    )}
                  </div>
                  {entry.catatan && (
                    <p className="mt-2 rounded-xl bg-white px-3.5 py-2 text-xs leading-relaxed text-slate-700 ring-1 ring-slate-200/80">
                      {entry.catatan}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Action Bar matching `riwayat moderasi pov waka 2.png` and `riwayat moderasi pov ketua.png` */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(`/permohonan/${data.id}`)}
          className="rounded-full border border-slate-300 bg-white px-7 py-2.5 text-xs font-bold tracking-wider text-slate-700 uppercase shadow-2xs transition hover:bg-slate-100"
        >
          BATAL
        </button>

        {isWaka2 && data.can.moderate && (
          <>
            <button
              type="button"
              onClick={() => setModModal({ open: true, decision: "tolak" })}
              className="rounded-full border border-rose-300 bg-white px-6 py-2.5 text-xs font-bold text-rose-700 shadow-2xs transition hover:bg-rose-600 hover:text-white"
            >
              Update Tolak
            </button>
            <button
              type="button"
              onClick={() => setModModal({ open: true, decision: "rekomendasi" })}
              className="rounded-full bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800"
            >
              Update Rekomendasi
            </button>
          </>
        )}

        {isKetua && data.can.moderate && (
          <>
            <button
              type="button"
              onClick={() => setModModal({ open: true, decision: "tolak" })}
              className="rounded-full border border-rose-300 bg-white px-6 py-2.5 text-xs font-bold text-rose-700 shadow-2xs transition hover:bg-rose-600 hover:text-white"
            >
              Update Tolak
            </button>
            <button
              type="button"
              onClick={() => setModModal({ open: true, decision: "acc" })}
              className="rounded-full bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800"
            >
              Update ACC
            </button>
          </>
        )}
      </div>

      {(isWaka2 || isKetua) && (
        <ModerationModal
          open={modModal.open}
          onClose={() => setModModal({ ...modModal, open: false })}
          role={isWaka2 ? "waka2" : "ketua"}
          decision={modModal.decision}
          defaultNominal={data.nominal_acc ?? data.nominal_rekomendasi}
          onSubmit={handleUpdateModeration}
        />
      )}
    </AppShell>
  );
}
