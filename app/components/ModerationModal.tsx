import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { RupiahInput } from "./RupiahInput";

interface ModerationModalProps {
  open: boolean;
  onClose: () => void;
  role: "waka2" | "ketua";
  decision: "rekomendasi" | "acc" | "tolak";
  defaultNominal?: number | null;
  onSubmit: (payload: {
    decision: "rekomendasi" | "acc" | "tolak";
    nominal?: number;
    catatan?: string;
  }) => Promise<void>;
}

export function ModerationModal({
  open,
  onClose,
  role,
  decision,
  defaultNominal,
  onSubmit,
}: ModerationModalProps) {
  const [nominal, setNominal] = useState<number>(defaultNominal ?? 60000000);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNominal(defaultNominal && defaultNominal > 0 ? defaultNominal : 60000000);
      setCatatan("");
      setError(null);
    }
  }, [open, defaultNominal, decision]);

  const isReject = decision === "tolak";
  const title = isReject
    ? `Penolakan ${role === "waka2" ? "Wakil Ketua II" : "Ketua"}`
    : decision === "rekomendasi"
      ? "Rekomendasi Wakil Ketua II"
      : "Persetujuan (ACC) Ketua";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isReject && !catatan.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    if (!isReject && (!nominal || nominal <= 0)) {
      setError("Nominal wajib lebih besar dari Rp 0.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        decision,
        nominal: isReject ? undefined : nominal,
        catatan: catatan.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan moderasi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
            {error}
          </div>
        )}

        {!isReject && (
          <div>
            <label
              htmlFor="nominal-input"
              className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              {decision === "rekomendasi" ? "NOMINAL REKOMENDASI" : "NOMINAL ACC"}
            </label>
            <RupiahInput
              id="nominal-input"
              value={nominal}
              onChange={setNominal}
              required
              autoFocus
            />
          </div>
        )}

        <div>
          <label
            htmlFor="catatan-input"
            className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase"
          >
            {isReject ? "ALASAN PENOLAKAN" : "CATATAN"}
          </label>
          <textarea
            id="catatan-input"
            rows={4}
            required={isReject}
            autoFocus={isReject}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder={
              isReject
                ? "Alasan Penolakan..."
                : decision === "rekomendasi"
                  ? "Catatan Rekomendasi..."
                  : "Catatan ACC..."
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-slate-300 bg-white px-6 py-2 text-xs font-bold tracking-wider text-slate-700 uppercase transition hover:bg-slate-100"
          >
            BATAL
          </button>
          <button
            type="submit"
            disabled={busy}
            className={`rounded-full px-6 py-2 text-xs font-bold tracking-wider text-white uppercase shadow-xs transition ${
              isReject
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {busy ? "MENYIMPAN..." : "SIMPAN"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
