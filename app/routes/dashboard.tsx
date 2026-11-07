import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  FileText,
  Users,
  CheckCircle2,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { AppShell } from "~/components/AppShell";
import { StatusBadge } from "~/components/StatusBadge";
import { apiFetch, useAuthStore } from "~/lib/api";
import { formatDateShort, formatRupiah } from "~/lib/format";
import { ROLE_LABELS, STATUS_LABELS } from "~/lib/constants";
import type { DashboardResponse } from "~/lib/types";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch<DashboardResponse>("/dashboard")
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.role]);

  return (
    <AppShell
      title="Dashboard Pendistribusian"
      subtitle="Ringkasan eksekutif permohonan bantuan, moderasi pimpinan, dan penyaluran mustahik"
      actions={
        <Link
          to="/permohonan"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800"
        >
          <span>Kelola Permohonan</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      }
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Total Permohonan
                </span>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">{data.totals.n}</p>
              <p className="mt-1 text-xs text-slate-500">
                Mencakup {data.totals.penerima} Penerima Manfaat (PM)
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Nominal Disetujui (ACC)
                </span>
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 font-mono text-xl font-extrabold text-emerald-800">
                {formatRupiah(data.totals.disetujui)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Keputusan akhir Ketua BAZNAS
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Dana Tersalurkan
                </span>
                <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 font-mono text-xl font-extrabold text-teal-800">
                {formatRupiah(data.totals.disalurkan)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Telah dilengkapi dokumentasi penyaluran
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Basis Data Mustahik
                </span>
                <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">{data.totals.mustahik}</p>
              <p className="mt-1 text-xs text-slate-500">
                Terdaftar berdasarkan NIK unik
              </p>
            </div>
          </div>

          {/* Role Action Queue + Program Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Role Action Queue */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Antrean Tugas {user ? ROLE_LABELS[user.role] : ""}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {user?.role === "waka2"
                        ? "Permohonan berstatus Assessment yang menunggu Rekomendasi / Tolak Wakil Ketua II"
                        : user?.role === "ketua"
                          ? "Permohonan yang telah dimoderasi Waka II dan menunggu ACC / Tolak Ketua"
                          : "Permohonan yang menunggu kelengkapan Assessment atau Dokumentasi Penyaluran"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
                  {data.inbox.count} Permohonan
                </span>
              </div>

              {data.inbox.items.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  Tidak ada antrean yang menunggu tindakan pada peran ini.
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-100">
                  {data.inbox.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/permohonan/${item.id}`)}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-800">
                            #{item.no_register}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="truncate text-sm font-bold text-slate-900">
                            {item.nama}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-600">
                          {item.program} — {item.perihal}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <StatusBadge status={item.status} size="sm" />
                        <ArrowUpRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Program & Status Distribution */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
                <h2 className="text-sm font-bold text-slate-900">Distribusi Program BAZNAS</h2>
                <p className="text-xs text-slate-500">
                  Jumlah permohonan dan akumulasi dana ACC per program
                </p>
                <div className="mt-4 space-y-3">
                  {data.by_program.map((prog) => (
                    <div
                      key={prog.program}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{prog.program}</p>
                        <p className="text-[11px] text-slate-500">{prog.n} permohonan</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-800">
                        {formatRupiah(prog.nominal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <h2 className="text-sm font-bold text-slate-900">Rekapitulasi Status</h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <Link
                      key={key}
                      to={`/permohonan?status=${key}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <span>{label}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 font-mono text-xs font-bold text-slate-900 shadow-2xs">
                        {data.by_status[key] || 0}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Permohonan Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Permohonan Terbaru</h2>
                <p className="text-xs text-slate-500">Klik baris untuk melihat detail permohonan</p>
              </div>
              <Link
                to="/permohonan"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                    <th className="py-3 pr-4">Tanggal</th>
                    <th className="px-4 py-3">No. Register</th>
                    <th className="px-4 py-3">Nama Pemohon</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Perihal</th>
                    <th className="px-4 py-3">Nominal ACC</th>
                    <th className="py-3 pl-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/permohonan/${row.id}`)}
                      className="cursor-pointer transition hover:bg-emerald-50/50"
                    >
                      <td className="py-3 pr-4 whitespace-nowrap text-xs text-slate-600">
                        {formatDateShort(row.tanggal)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                        {row.no_register}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.nama}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700">
                        {row.program}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-600">
                        {row.perihal}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold text-slate-800">
                        {formatRupiah(row.nominal_acc ?? row.nominal_rekomendasi)}
                      </td>
                      <td className="py-3 pl-4 whitespace-nowrap">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
