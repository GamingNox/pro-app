// ══ Push notification sender ══════════════════════════════
// POST /api/push/send — delivers a web push to every subscription
// registered for a given user_id. Used by the booking flow to notify
// a pro when a new reservation lands.
//
// REQUIRED ENV VARS (set in Vercel → Project → Settings → Environment Variables):
//   VAPID_PRIVATE_KEY   — private half of the VAPID pair (public key is in src/lib/push.ts)
//   VAPID_SUBJECT       — mailto: or https: identifying the sender (e.g. mailto:admin@clientbase.fr)
//
// Body shape:
//   { userId: string, title: string, body: string, url?: string, tag?: string }
//
// SECURITY NOTE: this endpoint has no auth. Anyone can POST and trigger
// a push to any user_id. That is acceptable for "new booking" notifications
// because the worst attacker can do is send "noise" to a pro's device.
// If abuse becomes a problem, add an IP rate limit or require a signed
// token tied to an actual booking row. For now the cost/benefit of the
// open endpoint is fine for an MVP.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush, { type PushSubscription } from "web-push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // web-push is not Edge-compatible.

const VAPID_PUBLIC =
  "BKzFclWT1XCk8Xo-n1c1Ds7gBFnjRRxqWpFR5eAb43aXuHcKN0pLOK3L-Q6RTY4qbdLxLdq2JDgTRweIBNa8nHk";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:clientbase.fr@gmail.com";

let vapidConfigured = false;
function configureVapid() {
  if (vapidConfigured) return;
  if (!VAPID_PRIVATE) return;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidConfigured = true;
}

// Use anon key; the user_id filter plus the RLS policy restricts reads.
// For this route we need cross-user access, so we use the service role
// if available. Falls back to anon which works because the push_subscriptions
// row is fetched by user_id only from server-side.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SendBody = {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

// ── Simple in-memory rate limiter (per IP, 5 req/min) ──
const ipHits = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.reset) {
    ipHits.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

export async function POST(req: Request) {
  // Rate limit by IP
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    console.warn("[push/send] rate limited", { ip });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  configureVapid();
  if (!VAPID_PRIVATE) {
    console.warn("[push/send] VAPID_PRIVATE_KEY not set — push disabled");
    return NextResponse.json({ ok: true, disabled: true });
  }

  const usingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[push/send] start", { usingServiceRole });

  let payload: SendBody;
  try {
    payload = (await req.json()) as SendBody;
  } catch {
    console.warn("[push/send] invalid json body");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!payload.userId || !payload.title) {
    console.warn("[push/send] missing fields", { hasUser: !!payload.userId, hasTitle: !!payload.title });
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  // ── Check push preferences ──
  // If the user has explicitly disabled this notification type, skip it entirely.
  const tag = payload.tag || "clientbase";
  const TAG_TO_PREF: Record<string, string> = {
    "new-booking": "new_booking",
    "cancelled-booking": "cancelled_booking",
    "new-message": "new_message",
    "waitlist": "waitlist_entry",
    "low-stock": "low_stock",
  };
  const prefKey = TAG_TO_PREF[tag];
  if (prefKey) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("settings")
      .eq("id", payload.userId)
      .single();
    const settings = (profile?.settings as Record<string, unknown>) || {};
    const pushPrefs = (settings.push_preferences as Record<string, boolean>) || {};
    if (pushPrefs[prefKey] === false) {
      console.log("[push/send] skipped — user disabled", { tag, prefKey });
      return NextResponse.json({ ok: true, sent: 0, reason: "preference_disabled" });
    }
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", payload.userId);

  if (error) {
    console.error("[push/send] subs fetch failed:", error.message, error);
    return NextResponse.json({ error: "db_failed", detail: error.message }, { status: 500 });
  }

  console.log("[push/send] fetched subs", { userId: payload.userId, count: subs?.length || 0 });

  if (!subs || subs.length === 0) {
    console.warn("[push/send] no subscriptions found for user", payload.userId);
    return NextResponse.json({ ok: true, sent: 0, reason: "no_subscriptions" });
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    tag: payload.tag || "clientbase",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
  });

  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];
  const failures: Array<{ endpoint: string; statusCode?: number; message?: string }> = [];

  for (const s of subs) {
    const sub: PushSubscription = {
      endpoint: s.endpoint as string,
      keys: { p256dh: s.p256dh as string, auth: s.auth as string },
    };
    try {
      await webpush.sendNotification(sub, body);
      sent++;
      console.log("[push/send] delivered", { endpoint: sub.endpoint.slice(0, 60) });
    } catch (e) {
      failed++;
      const statusCode = (e as { statusCode?: number }).statusCode;
      const message = (e as { body?: string; message?: string }).body || (e as Error).message;
      failures.push({ endpoint: sub.endpoint.slice(0, 60), statusCode, message });
      console.warn("[push/send] push failed", { statusCode, message, endpoint: sub.endpoint.slice(0, 60) });
      if (statusCode === 404 || statusCode === 410) {
        staleIds.push(s.id as string);
      }
    }
  }

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
    console.log("[push/send] purged stale subs", { count: staleIds.length });
  }

  if (sent > 0) {
    await supabase
      .from("push_subscriptions")
      .update({ last_used: new Date().toISOString() })
      .eq("user_id", payload.userId);
  }

  console.log("[push/send] done", { sent, failed, total: subs.length });
  return NextResponse.json({ ok: true, sent, failed, total: subs.length, failures });
}
