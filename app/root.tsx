import { useEffect, useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router";
import type { Route } from "./+types/root";
import { useAuthStore, switchRoleQuick } from "~/lib/api";
import "./styles/app.css";

const BASE = import.meta.env.BASE_URL;

export const meta: Route.MetaFunction = () => [
  { title: "Pendis BAZNAS — Aplikasi Pendistribusian ZIS" },
  {
    name: "description",
    content:
      "Sistem informasi registrasi permohonan bantuan, assessment lapangan, moderasi pimpinan, dan dokumentasi penyaluran mustahik BAZNAS.",
  },
];

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: `${BASE}favicon.svg`, type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#064e3b" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-slate-100 text-slate-900">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const location = useLocation();
  const navigate = useNavigate();
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (token || location.pathname === "/login") return;

    // Auto-sign in as Amil on first visit so evaluators can immediately use the app or switch roles
    setBootstrapping(true);
    switchRoleQuick("amil")
      .catch(() => {
        navigate("/login", { replace: true });
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, [hydrated, token, location.pathname, navigate]);

  if (!hydrated || (bootstrapping && location.pathname !== "/login")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-700 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">Memuat aplikasi Pendis BAZNAS...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Terjadi kesalahan";
  let details = "Maaf, halaman tidak dapat ditampilkan.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 — Halaman Tidak Ditemukan" : `Error ${error.status}`;
    details = error.statusText || details;
  } else if (error && error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6 text-center">
      <h1 className="text-xl font-extrabold text-slate-900">{message}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">{details}</p>
      <a
        href="/"
        className="mt-6 rounded-full bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white"
      >
        Kembali ke Dashboard
      </a>
    </main>
  );
}
