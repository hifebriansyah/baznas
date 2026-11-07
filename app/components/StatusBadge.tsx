import type { PermohonanStatus } from "~/lib/types";
import { STATUS_LABELS } from "~/lib/constants";

interface StatusBadgeProps {
  status: PermohonanStatus | string;
  size?: "sm" | "md";
}

const STYLES: Record<string, { badge: string; dot: string }> = {
  diajukan: {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-500",
  },
  assessment: {
    badge: "bg-sky-50 text-sky-800 ring-sky-200",
    dot: "bg-sky-500",
  },
  rekomendasi: {
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
  },
  ditolak_waka: {
    badge: "bg-rose-50 text-rose-800 ring-rose-200",
    dot: "bg-rose-500",
  },
  acc: {
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-600",
  },
  ditolak: {
    badge: "bg-rose-100 text-rose-800 ring-rose-300",
    dot: "bg-rose-600",
  },
  selesai: {
    badge: "bg-teal-50 text-teal-900 ring-teal-200",
    dot: "bg-teal-600",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const style = STYLES[status] || STYLES.diajukan;
  const label = STATUS_LABELS[status] || status;
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${pad} ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
