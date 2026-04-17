// ── Retry with exponential backoff ──────────────────────
// Wraps any async function. Retries up to `maxAttempts` times
// with exponential delay (1s, 2s, 4s). Only retries on network
// errors — NOT on Supabase business errors (RLS, constraint).

const DEFAULT_DELAYS = [1000, 2000, 4000]; // ms

function isRetryable(error: unknown): boolean {
  if (!error) return false;
  const msg = String(error).toLowerCase();
  // Network / timeout errors
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("timeout")) return true;
  if (msg.includes("failed to fetch")) return true;
  if (msg.includes("econnreset") || msg.includes("enotfound")) return true;
  // Supabase rate limit
  if (msg.includes("429") || msg.includes("too many requests")) return true;
  return false;
}

/**
 * Retry an async function with exponential backoff.
 *
 * Usage:
 *   const result = await withRetry(() => supabase.from("x").insert(data));
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxAttempts?: number; delays?: number[]; label?: string }
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? 3;
  const delays = opts?.delays ?? DEFAULT_DELAYS;
  const label = opts?.label ?? "operation";

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!isRetryable(err) || attempt === maxAttempts - 1) {
        throw err;
      }

      const delay = delays[Math.min(attempt, delays.length - 1)];
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[retry] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

/**
 * Wraps a Supabase mutation (insert/update/delete) with retry.
 * Checks .error on the response rather than relying on thrown exceptions
 * (Supabase client doesn't throw on HTTP errors).
 */
export async function withSupabaseRetry<T extends { error: { message: string; code?: string } | null }>(
  fn: () => Promise<T>,
  label = "supabase"
): Promise<T> {
  const delays = DEFAULT_DELAYS;

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await fn();

    if (!result.error) return result;

    // Don't retry business errors (RLS, constraint violations, etc.)
    const code = result.error.code || "";
    const msg = result.error.message || "";
    const isNetwork =
      msg.includes("fetch") || msg.includes("network") || msg.includes("timeout") ||
      code === "PGRST301" || code === "429";

    if (!isNetwork || attempt === 2) return result; // return with error, let caller handle

    const delay = delays[attempt];
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[retry] ${label} attempt ${attempt + 1} failed (${msg}), retrying in ${delay}ms...`);
    }
    await new Promise((r) => setTimeout(r, delay));
  }

  return await fn(); // final attempt
}
