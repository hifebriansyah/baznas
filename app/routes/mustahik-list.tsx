import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, Filter } from "lucide-react";
import { AppShell } from "~/components/AppShell";
import { AsnafBadge } from "~/components/AsnafBadge";
import { CreateMustahikModal } from "~/components/CreateMustahikModal";
import { apiFetch, useAuthStore } from "~/lib/api";
import { calculateAge } from "~/lib/format";
import { ASNAF_OPTIONS } from "~/lib/constants";
import type { MustahikItem } from "~/lib/types";

interface MustahikListResponse {
  items: MustahikItem[];
  total: number;
  page: number;
  per_page: number;
}

export default function MustahikListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [q, setQ] = useState("");
  const [asnafFilter, setAsnafFilter] = useState("");
  const [items, setItems] = useState<MustahikItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (asnafFilter) params.set("asnaf", asnafFilter);
    params.set("per_page", "100");

    apiFetch<MustahikListResponse>(`/mustahik?${params.toString()}`)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat daftar mustahik");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(loadList, 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, asnafFilter]);

  return (
    <AppShell
      title="Basis Data Mustahik"
      subtitle={`Menampilkan ${items.length} dari ${total} penerima manfaat terdaftar`}
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>Filter Asnaf:</span>
            </div>
            <select
              aria-label="Filter Asnaf"
              value={asnafFilter}
              onChange={(e) => setAsnafFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Semua Asnaf</option>
              {ASNAF_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
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

        {/* Table matching `list mustahik.png` */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-700">
                <th className="py-3.5 pr-3">No.</th>
                <th className="px-3 py-3.5">Nama Mustahik</th>
                <th className="px-3 py-3.5">Nama Jalan/Kampung/Gang</th>
                <th className="px-3 py-3.5">Kelurahan</th>
                <th className="px-3 py-3.5">Kecamatan</th>
                <th className="px-3 py-3.5">Pekerjaan</th>
                <th className="px-3 py-3.5">Umur</th>
                <th className="py-3.5 pl-3">Asnaf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    Memuat data mustahik...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    Tidak ada data mustahik yang sesuai.
                  </td>
                </tr>
              ) : (
                items.map((m, idx) => {
                  const age = calculateAge(m.tanggal_lahir);
                  return (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/mustahik/${m.id}`)}
                      className="cursor-pointer transition hover:bg-emerald-50/60"
                    >
                      <td className="py-3.5 pr-3 text-xs font-medium text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-3.5">
                        <p className="font-semibold text-slate-900">{m.nama}</p>
                        <p className="font-mono text-[11px] text-slate-400">NIK: {m.nik}</p>
                      </td>
                      <td className="px-3 py-3.5 text-xs text-slate-700">{m.alamat}</td>
                      <td className="px-3 py-3.5 text-xs text-slate-700">{m.kelurahan}</td>
                      <td className="px-3 py-3.5 text-xs text-slate-700">{m.kecamatan}</td>
                      <td className="px-3 py-3.5 text-xs text-slate-700">{m.pekerjaan}</td>
                      <td className="px-3 py-3.5 font-mono text-xs font-semibold text-slate-800">
                        {age !== null ? age : "—"}
                      </td>
                      <td className="py-3.5 pl-3 whitespace-nowrap">
                        <AsnafBadge asnaf={m.asnaf} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      <CreateMustahikModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setCreateOpen(false);
          navigate(`/mustahik/${created.id}`);
        }}
      />
    </AppShell>
  );
}
