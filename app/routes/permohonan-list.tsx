import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search, Plus, Filter } from "lucide-react";
import { AppShell } from "~/components/AppShell";
import { StatusBadge } from "~/components/StatusBadge";
import { CreatePermohonanModal } from "~/components/CreatePermohonanModal";
import { apiFetch, useAuthStore } from "~/lib/api";
import { formatDateShort, formatRupiah } from "~/lib/format";
import { PROGRAM_OPTIONS, STATUS_LABELS } from "~/lib/constants";
import type { PermohonanListItem } from "~/lib/types";

interface ListResponse {
  items: PermohonanListItem[];
  total: number;
  page: number;
  per_page: number;
}

export default function PermohonanListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [programFilter, setProgramFilter] = useState(searchParams.get("program") || "");
  const [items, setItems] = useState<PermohonanListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (programFilter) params.set("program", programFilter);
    params.set("per_page", "100");

    apiFetch<ListResponse>(`/permohonan?${params.toString()}`)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat daftar permohonan");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(loadList, 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter, programFilter]);

  return (
    <AppShell
      title="Daftar Permohonan Bantuan"
      subtitle={`Menampilkan ${items.length} dari ${total} permohonan bantuan mustahik`}
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Top Filter & Search Bar matching Wireframe */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>Filter:</span>
            </div>
            <select
              aria-label="Filter Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                if (e.target.value) {
                  searchParams.set("status", e.target.value);
                } else {
                  searchParams.delete("status");
                }
                setSearchParams(searchParams, { replace: true });
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Program"
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Semua Program</option>
              {PROGRAM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Pencarian..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-4 pl-10 text-xs font-medium text-slate-900 shadow-2xs transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
            {error}
          </div>
        )}

        {/* Table matching `list permohonan.png` */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-700">
                <th className="py-3.5 pr-3">No.</th>
                <th className="px-3 py-3.5">Tanggal</th>
                <th className="px-3 py-3.5">No. Register</th>
                <th className="px-3 py-3.5">Nama Pemohon</th>
                <th className="px-3 py-3.5">Program</th>
                <th className="px-3 py-3.5">Perihal</th>
                <th className="px-3 py-3.5">Nominal ACC</th>
                <th className="py-3.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    Memuat data permohonan...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    Tidak ada data permohonan yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const displayedNominal = item.nominal_acc ?? item.nominal_rekomendasi;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/permohonan/${item.id}`)}
                      className="cursor-pointer transition hover:bg-emerald-50/60"
                    >
                      <td className="py-3.5 pr-3 text-xs font-medium text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-xs text-slate-700">
                        {formatDateShort(item.tanggal)}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-slate-900">
                        {item.no_register}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-slate-900">{item.nama}</td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-xs font-medium text-slate-700">
                        {item.program}
                      </td>
                      <td
                        className="max-w-xs truncate px-3 py-3.5 text-xs text-slate-600"
                        title={item.perihal}
                      >
                        {item.perihal}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-slate-900">
                        {formatRupiah(displayedNominal)}
                      </td>
                      <td className="py-3.5 pl-3 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom-right BARU Button matching `list permohonan.png` */}
      {user?.role === "amil" && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-7 py-3 text-xs font-extrabold tracking-wider text-white uppercase shadow-lg transition hover:bg-emerald-800 hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            <span>BARU</span>
          </button>
        </div>
      )}

      <CreatePermohonanModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setCreateOpen(false);
          navigate(`/permohonan/${created.id}`);
        }}
      />
    </AppShell>
  );
}
