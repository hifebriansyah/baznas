import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { AppShell } from "~/components/AppShell";
import { StatusBadge } from "~/components/StatusBadge";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { apiFetch, useAuthStore } from "~/lib/api";
import { formatDateId } from "~/lib/format";
import type { PermohonanDetail } from "~/lib/types";

export default function PermohonanPenyaluranPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<PermohonanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = () => {
    if (!id) return;
    setLoading(true);
    apiFetch<PermohonanDetail>(`/permohonan/${id}`)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat dokumentasi penyaluran");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role]);

  if (loading || !data) {
    return (
      <AppShell title="Dokumentasi Penyaluran">
        <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white p-8" />
      </AppShell>
    );
  }

  const canDistribute = user?.role === "amil" && data.can.distribute;

  return (
    <AppShell
      title="Detail Dokumentasi Penyaluran"
      subtitle={`Bukti serah terima bantuan mustahik #${data.no_register}`}
      actions={
        <div className="flex items-center gap-3">
          <StatusBadge status={data.status} />
          <Link
            to={`/permohonan/${data.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Detail</span>
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      {!canDistribute && user?.role === "amil" && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Unggah dokumentasi penyaluran hanya dapat dilakukan setelah permohonan disetujui (
            <strong>ACC Ketua</strong>).
          </span>
        </div>
      )}

      {/* Main Card matching `detail dokumentasi penyaluran.png` */}
      <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="grid max-w-lg grid-cols-3 gap-y-2 border-b border-slate-100 pb-5 text-sm">
          <span className="font-bold text-slate-900">No. Register</span>
          <span className="col-span-2 font-mono font-bold text-slate-900">{data.no_register}</span>
          <span className="font-bold text-slate-900">Nama</span>
          <span className="col-span-2 font-semibold text-slate-900">{data.nama}</span>
          <span className="text-xs font-semibold text-slate-500">Jenis Dana</span>
          <span className="col-span-2 text-xs font-semibold text-slate-800">
            {data.jenis_dana || "(belum dipilih)"}
          </span>
          <span className="text-xs font-semibold text-slate-500">Tanggal Penyaluran</span>
          <span className="col-span-2 text-xs font-semibold text-slate-800">
            {formatDateId(data.tanggal_penyaluran)}
          </span>
        </div>

        <AttachmentGallery
          permohonanId={data.id}
          category="penyaluran"
          attachments={data.attachments}
          canEdit={canDistribute}
          onChanged={loadDetail}
        />
      </div>
    </AppShell>
  );
}
