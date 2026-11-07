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
import { ICON_VERSION } from "~/lib/icon-version.generated";
import "./styles/app.css";

const BASE = import.meta.env.BASE_URL;

const SITE = "https://baznas.situs.id"; // the public address: the share image must be an absolute address
const TITLE = "Pendis BAZNAS — Aplikasi Pendistribusian ZIS";
const DESCRIPTION =
  "Sistem informasi registrasi permohonan bantuan, assessment lapangan, moderasi pimpinan, dan dokumentasi penyaluran mustahik BAZNAS.";
const V = `?v=${ICON_VERSION}`; // changes when the logo changes, so browsers fetch the new icons (scripts/make_icons.py)

export const meta: Route.MetaFunction = () => [
  { title: TITLE },
  { name: "description", content: DESCRIPTION },
  { name: "application-name", content: "Pendis BAZNAS" },
  { name: "apple-mobile-web-app-title", content: "Pendis BAZNAS" },
  { name: "mobile-web-app-capable", content: "yes" },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: "Pendis BAZNAS" },
  { property: "og:locale", content: "id_ID" },
  { property: "og:title", content: TITLE },
  { property: "og:description", content: DESCRIPTION },
  { property: "og:url", content: `${SITE}/` },
  { property: "og:image", content: `${SITE}/og-image.png${V}` },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "675" },
  { property: "og:image:alt", content: "Logo BAZNAS Kabupaten Cianjur" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: TITLE },
  { name: "twitter:description", content: DESCRIPTION },
  { name: "twitter:image", content: `${SITE}/og-image.png${V}` },
];

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: `${BASE}favicon.ico${V}`, sizes: "any" },
  { rel: "icon", href: `${BASE}icons/favicon-32.png${V}`, type: "image/png", sizes: "32x32" },
  { rel: "icon", href: `${BASE}icons/favicon-16.png${V}`, type: "image/png", sizes: "16x16" },
  { rel: "apple-touch-icon", href: `${BASE}icons/apple-touch-icon.png${V}`, sizes: "180x180" },
  { rel: "manifest", href: `${BASE}manifest.webmanifest${V}` },
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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
  const signedOut = useAuthStore((s) => s.signedOut);
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

    // Someone signed out on purpose: show the login page, do not sign in again
    if (signedOut) {
      navigate("/login", { replace: true });
      return;
    }

    // Auto-sign in as Amil on first visit so evaluators can immediately use the app or switch roles
    setBootstrapping(true);
    switchRoleQuick("amil")
      .catch(() => {
        navigate("/login", { replace: true });
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, [hydrated, token, signedOut, location.pathname, navigate]);

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
