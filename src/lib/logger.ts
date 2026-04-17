// ── Production-safe logger ───────────────────────────────
// Wraps console methods. In production, only errors are logged.
// In development, everything goes through.

const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { console.error(...args); }, // always log errors
  info: (...args: unknown[]) => { if (isDev) console.info(...args); },
};
