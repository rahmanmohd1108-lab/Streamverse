/**
 * StreamVerse Frontend API Client
 *
 * Thin wrapper around fetch() that talks to our own /api routes.
 * Used by React client components with TanStack Query.
 */
import type { ApiError } from "@/lib/errors";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    credentials: "same-origin",
  });

  if (!res.ok) {
    let err: { error?: ApiError; message?: string };
    try {
      err = await res.json();
    } catch {
      throw new Error(res.statusText || `HTTP ${res.status}`);
    }
    if (err?.error) {
      throw new Error(err.error.message);
    }
    if (err?.message) throw new Error(err.message);
    throw new Error(`HTTP ${res.status}`);
  }

  // Some endpoints return nothing (204)
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
) {
  return apiFetch<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
) {
  return apiFetch<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });
}

export async function apiDelete<T>(path: string, init?: RequestInit) {
  return apiFetch<T>(path, { method: "DELETE", ...init });
}

/** Build a query string from an object, omitting null/undefined. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
