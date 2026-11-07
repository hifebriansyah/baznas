import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Save, Pencil } from "lucide-react";
import { AppShell } from "~/components/AppShell";
import { StatusBadge } from "~/components/StatusBadge";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { apiFetch, useAuthStore } from "~/lib/api";
import type { PermohonanDetail } from "~/lib/types";

export default function PermohonanAssessmentPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<PermohonanDetail | null>(null);
  const [catatan, setCatatan] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  const loadDetail = () => {
    if (!id) return;
    setLoading(true);
    apiFetch<PermohonanDetail>(`/permohonan/${id}`)
      .then((res) => {
        setData(res);
        setCatatan(res.catatan_assessment || "");
        setIsEditingNote(!res.catatan_assessment);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat assessment");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role]);

  const handleSaveNote = async () => {
    if (!data) return;
    setSavingNote(true);
    setError(null);
    setSavedBanner(false);
    try {
      const updated = await apiFetch<PermohonanDetail>(`/permohonan/${data.id}/assessment`, {
        method: "PUT",
        body: JSON.stringify({ catatan }),
      });
      setData(updated);
      setIsEditingNote(false);
      setSavedBanner(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan catatan assessment");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading || !data) {
    return (
      <AppShell title="Detail Assessment">
        <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white p-8" />
      </AppShell>
    );
  }

  const canAssess = user?.role === "amil" && data.can.assess;

  return (
    <AppShell
      title="Detail Assessment Lapangan"
      subtitle={`Verifikasi kelayakan permohonan bantuan #${data.no_register}`}
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
      {savedBanner && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
          Catatan assessment berhasil disimpan.
        </div>
      )}

      {/* Main Card matching `detail assessment.png` */}
      <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        {/* Header Info: No. Register & Nama */}
        <div className="grid max-w-md grid-cols-3 gap-y-2 border-b border-slate-100 pb-5 text-sm">
          <span className="font-bold text-slate-900">No. Register</span>
          <span className="col-span-2 font-mono font-bold text-slate-900">{data.no_register}</span>
          <span className="font-bold text-slate-900">Nama</span>
          <span className="col-span-2 font-semibold text-slate-900">{data.nama}</span>
        </div>

        {/* Catatan Section with Simpan and Ubah buttons matching Wireframe */}
        <div className="space-y-2.5">
          <label
            htmlFor="catatan-assessment"
            className="block text-sm font-bold text-slate-900"
          >
            Catatan
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <textarea
              id="catatan-assessment"
              rows={5}
              disabled={!canAssess || !isEditingNote}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan Assessment.."
              className="flex-1 rounded-2xl border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-900 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-700"
            />
            {canAssess && (
              <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                <button
                  type="button"
                  disabled={savingNote || !isEditingNote}
                  onClick={handleSaveNote}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingNote ? "..." : "Simpan"}</span>
                </button>
                <button
                  type="button"
                  disabled={isEditingNote}
                  onClick={() => setIsEditingNote(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Ubah</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dokumen & Media Section with Tiles / List toggle */}
        <AttachmentGallery
          permohonanId={data.id}
          category="assessment"
          attachments={data.attachments}
          canEdit={canAssess}
          onChanged={loadDetail}
        />
      </div>
    </AppShell>
  );
}
