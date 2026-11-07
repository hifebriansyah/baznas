import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Upload,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import type { AttachmentItem } from "~/lib/types";
import { formatBytes, formatDateTimeWib } from "~/lib/format";
import { apiFetch, fetchAttachmentBlobUrl } from "~/lib/api";

interface AttachmentGalleryProps {
  permohonanId: number;
  category: "assessment" | "penyaluran";
  attachments: AttachmentItem[];
  canEdit: boolean;
  onChanged: () => void;
}

export function AttachmentGallery({
  permohonanId,
  category,
  attachments,
  canEdit,
  onChanged,
}: AttachmentGalleryProps) {
  const [viewMode, setViewMode] = useState<"tiles" | "list">("tiles");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const items = attachments.filter((a) => a.category === category);
  const dokumen = items.filter((a) => a.kind === "dokumen");
  const media = items.filter((a) => a.kind === "media");

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("category", category);
        form.append("file", file);
        await apiFetch(`/permohonan/${permohonanId}/attachments`, {
          method: "POST",
          body: form,
        });
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah berkas");
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (att: AttachmentItem, download = false) => {
    setBusyId(att.id);
    setError(null);
    try {
      const url = await fetchAttachmentBlobUrl(att.id);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = att.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuka berkas");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (att: AttachmentItem) => {
    setBusyId(att.id);
    setError(null);
    try {
      await apiFetch(`/attachments/${att.id}`, { method: "DELETE" });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus berkas");
    } finally {
      setBusyId(null);
    }
  };

  const renderGroup = (title: string, list: AttachmentItem[], kind: "dokumen" | "media") => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">
          {title}{" "}
          <span className="ml-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {list.length}
          </span>
        </h3>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center text-xs text-slate-500">
          Belum ada {title.toLowerCase()} yang diunggah.
        </div>
      ) : viewMode === "tiles" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {list.map((att) => {
            const ext = att.filename.split(".").pop()?.toUpperCase() || (kind === "media" ? "JPG" : "PDF");
            return (
              <div
                key={att.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-emerald-400 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                        kind === "media"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      .{ext}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatBytes(att.size)}</span>
                  </div>
                  <div className="my-4 flex justify-center">
                    {kind === "media" ? (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/60">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
                        <FileText className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <p
                    className="truncate text-center text-xs font-semibold text-slate-800"
                    title={att.filename}
                  >
                    {att.filename}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-2.5">
                  <button
                    type="button"
                    disabled={busyId === att.id}
                    onClick={() => handleOpen(att, false)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-emerald-600 hover:text-white"
                    title="Lihat berkas"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Buka
                  </button>
                  <button
                    type="button"
                    disabled={busyId === att.id}
                    onClick={() => handleOpen(att, true)}
                    className="rounded-lg bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"
                    title="Unduh berkas"
                    aria-label={`Unduh ${att.filename}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      disabled={busyId === att.id}
                      onClick={() => handleDelete(att)}
                      className="rounded-lg bg-rose-50 p-1 text-rose-600 hover:bg-rose-600 hover:text-white"
                      title="Hapus berkas"
                      aria-label={`Hapus ${att.filename}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {list.map((att) => (
            <div
              key={att.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                {kind === "media" ? (
                  <ImageIcon className="h-5 w-5 shrink-0 text-sky-600" />
                ) : (
                  <FileText className="h-5 w-5 shrink-0 text-emerald-700" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{att.filename}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(att.size)} • Diunggah {formatDateTimeWib(att.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busyId === att.id}
                  onClick={() => handleOpen(att, false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Lihat
                </button>
                <button
                  type="button"
                  disabled={busyId === att.id}
                  onClick={() => handleOpen(att, true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh
                </button>
                {canEdit && (
                  <button
                    type="button"
                    disabled={busyId === att.id}
                    onClick={() => handleDelete(att)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-600 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toolbar: Upload + Tiles/List Toggle matching Wireframe */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {canEdit && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800">
              <Upload className="h-4 w-4" />
              <span>{uploading ? "Mengunggah..." : "Unggah Dokumen / Media"}</span>
              <input
                type="file"
                multiple
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Tiles / List Toggle from Wireframe */}
        <div
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs"
          role="group"
          aria-label="Mode tampilan berkas"
        >
          <button
            type="button"
            onClick={() => setViewMode("tiles")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "tiles"
                ? "bg-emerald-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Tiles
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "list"
                ? "bg-emerald-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      {renderGroup("Dokumen", dokumen, "dokumen")}
      {renderGroup("Media", media, "media")}
    </div>
  );
}
