import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, ArrowRight, UserCheck, Lock, User } from "lucide-react";
import { apiFetch, useAuthStore, switchRoleQuick } from "~/lib/api";
import type { AuthUser, Role } from "~/lib/types";
import { ROLE_LABELS } from "~/lib/constants";

export default function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const [username, setUsername] = useState("amil");
  const [password, setPassword] = useState("baznas123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setSession(res.token, res.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setBusy(false);
    }
  };

  const handleQuickDemo = async (role: Role) => {
    setError(null);
    setBusy(true);
    try {
      await switchRoleQuick(role);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-800/80 shadow-xl ring-2 ring-amber-400/60">
            <ShieldCheck className="h-9 w-9 text-amber-400" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            Aplikasi Pendistribusian BAZNAS
          </h1>
          <p className="mt-1 text-sm text-emerald-200/80">
            Sistem Informasi Permohonan, Assessment, Moderasi Pimpinan & Penyaluran Mustahik
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-white/10 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="login-username"
                className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase"
              >
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-4 pl-10 text-sm text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-4 pl-10 text-sm text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-60"
            >
              <span>{busy ? "Memproses..." : "Masuk ke Aplikasi"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Instant Demo Role Selection */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-center text-xs font-bold tracking-wider text-slate-500 uppercase">
              Akses Cepat Akun Peran (Satu Klik)
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {(["amil", "waka2", "ketua"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={busy}
                  onClick={() => handleQuickDemo(r)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-800 transition hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-700" />
                    <span>Masuk sebagai {ROLE_LABELS[r]}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{r} / baznas123</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
