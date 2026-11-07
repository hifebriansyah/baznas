import { create } from "zustand";
import type { AuthUser, Role } from "./types";

const STORAGE_KEY = "pendis_baznas_session_v1";

export const DEFAULT_API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL)
    : "https://baznas-api.vercel.app";

interface SessionData {
  token: string;
  user: AuthUser;
}

function readStoredSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionData;
    if (parsed?.token && parsed?.user?.role) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeStoredSession(data: SessionData | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!data) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore storage errors
  }
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: () => {
    const stored = readStoredSession();
    set({
      token: stored?.token ?? null,
      user: stored?.user ?? null,
      hydrated: true,
    });
  },
  setSession: (token, user) => {
    writeStoredSession({ token, user });
    set({ token, user, hydrated: true });
  },
  logout: () => {
    writeStoredSession(null);
    set({ token: null, user: null, hydrated: true });
  },
}));

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const token = options.token ?? useAuthStore.getState().token;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${DEFAULT_API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail)
        : `Kesalahan permintaan (${res.status})`;
    throw new Error(detail);
  }

  return data as T;
}

export async function switchRoleQuick(role: Role): Promise<AuthUser> {
  const res = await apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: role, password: "baznas123" }),
  });
  useAuthStore.getState().setSession(res.token, res.user);
  return res.user;
}

export async function fetchAttachmentBlobUrl(attachmentId: number): Promise<string> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${DEFAULT_API_BASE}/attachments/${attachmentId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Gagal memuat berkas lampiran");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
