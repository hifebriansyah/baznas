const ASNAF_STYLES: Record<string, string> = {
  Fakir: "bg-rose-50 text-rose-800 ring-rose-200",
  Miskin: "bg-amber-50 text-amber-800 ring-amber-200",
  Amil: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Mualaf: "bg-teal-50 text-teal-800 ring-teal-200",
  Riqab: "bg-purple-50 text-purple-800 ring-purple-200",
  Gharim: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  Fisabilillah: "bg-sky-50 text-sky-800 ring-sky-200",
  "Ibnu Sabil": "bg-cyan-50 text-cyan-800 ring-cyan-200",
};

export function AsnafBadge({ asnaf }: { asnaf: string }) {
  const style = ASNAF_STYLES[asnaf] || "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {asnaf}
    </span>
  );
}
