// ══ Client-side helper to ping /api/notify ═════════════════
// Fire-and-forget: never throws, never blocks the UI.

type NotifyType =
  | "signup"
  | "beta_request"
  | "support_request"
  | "beta_approved"
  | "beta_rejected"
  | "generic";

interface NotifyPayload {
  type: NotifyType;
  userName?: string;
  userEmail?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export function notifyAdmin(payload: NotifyPayload): void {
  if (typeof window === "undefined") return;
  // Fire and forget — no await, no error bubbling.
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((e) => {
    console.warn("[notifyAdmin] failed (non-fatal):", e);
  });
}
