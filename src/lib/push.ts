// Client-side push subscription helper.
// Registers the service worker, asks for permission, subscribes
// the browser to the push service, and persists the subscription
// under the current user's push_subscriptions row.

import { supabase } from "./supabase";

// Public VAPID key — safe to embed in the client bundle.
// Matches VAPID_PRIVATE_KEY env var on the server.
export const VAPID_PUBLIC_KEY =
  "BKzFclWT1XCk8Xo-n1c1Ds7gBFnjRRxqWpFR5eAb43aXuHcKN0pLOK3L-Q6RTY4qbdLxLdq2JDgTRweIBNa8nHk";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const cleaned = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(cleaned);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Register the service worker if not already registered. */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/sw.js");
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.warn("[push] SW register failed:", e);
    return null;
  }
}

/** Returns the current subscription status for this browser. */
export async function getSubscriptionStatus(): Promise<
  "unsupported" | "denied" | "granted" | "default" | "subscribed"
> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await ensureServiceWorker();
  if (!reg) return "unsupported";
  const sub = await reg.pushManager.getSubscription();
  if (sub) return "subscribed";
  return Notification.permission;
}

/** Ask the user for permission, subscribe, and persist server-side. */
export async function subscribeToPush(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: permission };

  const reg = await ensureServiceWorker();
  if (!reg) return { ok: false, error: "sw_failed" };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    } catch (e) {
      console.warn("[push] subscribe failed:", e);
      return { ok: false, error: "subscribe_failed" };
    }
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, error: "invalid_subscription" };
  }

  // Upsert by endpoint so refreshing the page does not duplicate rows.
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.warn("[push] db upsert failed:", error.message);
    return { ok: false, error: "db_failed" };
  }
  return { ok: true };
}

/** Remove the subscription both locally and in Supabase. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await ensureServiceWorker();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch { /* ignore */ }

  try {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  } catch { /* ignore */ }
}
