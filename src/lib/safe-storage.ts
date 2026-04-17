// ── Safe localStorage wrapper ────────────────────────────
// Silently no-ops on Safari private mode, SSR, or any other
// environment where localStorage throws.

export function safeGet(key: string): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

export function safeRemove(key: string): void {
  try {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  } catch { /* ignore */ }
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function safeSetJSON(key: string, value: unknown): void {
  try {
    if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}
