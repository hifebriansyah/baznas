import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  CircleUserRound,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import { useAuthStore, switchRoleQuick } from "~/lib/api";
import { ICON_VERSION } from "~/lib/icon-version.generated";
import { ROLE_LABELS } from "~/lib/constants";
import type { Role } from "~/lib/types";

const LOGO_MARK = `${import.meta.env.BASE_URL}logo-mark.png?v=${ICON_VERSION}`;

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/permohonan", label: "Permohonan", icon: FileText, end: false },
  { to: "/mustahik", label: "Mustahik", icon: Users, end: false },
];

const ROLES: Role[] = ["amil", "waka2", "ketua"];

export function AppShell({ children, title, subtitle, actions }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<Role | null>(null);

  const handleRoleSwitch = async (role: Role) => {
    if (user?.role === role || switchingRole) return;
    setSwitchingRole(role);
    try {
      await switchRoleQuick(role);
    } catch {
      // ignore error
    } finally {
      setSwitchingRole(null);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-emerald-950 text-emerald-50">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-emerald-900/80 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-0.5 shadow-inner ring-1 ring-amber-400/40">
            <img src={LOGO_MARK} alt="Logo BAZNAS" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">BAZNAS</span>
              <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                Pendis
              </span>
            </div>
            <p className="text-xs text-emerald-300/80">Sistem Pendistribusian ZIS</p>
          </div>
        </div>

        {/* Navigation Links matching Wireframe Sidebar */}
        <nav className="mt-6 space-y-2 px-4" aria-label="Menu Utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white text-emerald-950 shadow-md ring-2 ring-amber-400/80"
                      : "bg-emerald-900/40 text-emerald-100/90 hover:bg-emerald-900/80 hover:text-white"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Interactive POV Role Switcher */}
        <div className="mx-4 mt-8 rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-300 uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simulasi Peran (POV)</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-200/80">
            Uji alur Amil, Rekomendasi Waka II, hingga ACC Ketua dengan satu klik:
          </p>
          <div className="mt-2.5 grid grid-cols-1 gap-1.5">
            {ROLES.map((r) => {
              const active = user?.role === r;
              return (
                <button
                  key={r}
                  type="button"
                  disabled={switchingRole !== null}
                  onClick={() => handleRoleSwitch(r)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                    active
                      ? "bg-amber-400 text-slate-950 shadow-xs"
                      : "bg-emerald-950/60 text-emerald-100 hover:bg-emerald-800/70"
                  }`}
                >
                  <span>{ROLE_LABELS[r]}</span>
                  {active && (
                    <span className="rounded-full bg-slate-950/15 px-1.5 py-0.5 text-[10px] font-bold">
                      Aktif
                    </span>
                  )}
                  {switchingRole === r && <span className="text-[10px]">...</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Footer */}
      {user && (
        <div className="border-t border-emerald-900/80 p-4">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-900/50 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-emerald-300">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-lg p-1.5 text-emerald-200 transition hover:bg-emerald-800 hover:text-white"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-68 shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-10 w-72 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-emerald-100 hover:bg-emerald-800"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-68">
        {/* Top Bar */}
        <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <div>
              {title && (
                <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  {title}
                </h1>
              )}
              {subtitle && <p className="text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            {user && (
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200 sm:inline-flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                POV: {ROLE_LABELS[user.role]}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 pb-28 sm:p-8 sm:pb-28 lg:pb-8">{children}</main>
      </div>

      {/* Bottom navigation on a phone, like WhatsApp: an icon and a label for each place; the active one sits in a pill */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navigasi bawah"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className="flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-16 items-center justify-center rounded-full transition-colors ${
                          isActive ? "bg-emerald-100 text-emerald-900" : "text-slate-500"
                        }`}
                      >
                        <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                      </span>
                      <span className={isActive ? "text-emerald-900" : "text-slate-500"}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex w-full flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold text-slate-500"
              aria-label="Buka menu akun dan peran"
            >
              <span className="flex h-8 w-16 items-center justify-center rounded-full">
                <CircleUserRound className="h-[22px] w-[22px]" />
              </span>
              <span>Akun</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
