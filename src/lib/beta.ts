// ══ Beta tester system ═══════════════════════════════════
// Supabase-backed with graceful localStorage fallback.
//
// Required Supabase schema (run in SQL editor):
//
//   alter table user_profiles add column if not exists beta_status text default 'none';
//
//   create table if not exists beta_requests (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users(id) on delete cascade,
//     motivation text not null,
//     feedback text,
//     experience text,
//     status text not null default 'pending',
//     created_at timestamptz not null default now(),
//     decided_at timestamptz
//   );
//
//   create table if not exists beta_reports (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users(id) on delete cascade,
//     kind text not null check (kind in ('bug','feedback','suggestion')),
//     title text,
//     description text not null,
//     step text,
//     status text not null default 'received' check (status in ('received','in_progress','fixed')),
//     verdict text,
//     created_at timestamptz not null default now()
//   );
//
//   alter publication supabase_realtime add table beta_requests;
//   alter publication supabase_realtime add table beta_reports;

import { supabase } from "./supabase";
import type {
  BetaRequest,
  BetaStatus,
  BetaReport,
  BetaReportKind,
  BetaReportStatus,
} from "./types";

// ─────────────────────────────────────────────────────────
// SCHEMA DIAGNOSTICS
// ─────────────────────────────────────────────────────────
// Runtime probe that surfaces a clear error when the SQL migration
// has not been run. The admin panel uses this to show a helpful
// banner with the exact SQL to paste into the Supabase editor.

export interface BetaSchemaDiagnostics {
  ok: boolean;
  missing: {
    user_profiles_beta_status?: boolean;
    beta_requests?: boolean;
    beta_reports?: boolean;
  };
  errors: string[];
}

export async function checkBetaSchema(): Promise<BetaSchemaDiagnostics> {
  const diag: BetaSchemaDiagnostics = { ok: true, missing: {}, errors: [] };

  // 1. Probe user_profiles.beta_status column
  try {
    const { error } = await supabase
      .from("user_profiles")
      .select("beta_status")
      .limit(1);
    if (error) {
      diag.ok = false;
      diag.missing.user_profiles_beta_status = true;
      diag.errors.push(`user_profiles.beta_status: ${error.message}`);
    }
  } catch (e) {
    diag.ok = false;
    diag.missing.user_profiles_beta_status = true;
    diag.errors.push(`user_profiles.beta_status: ${String(e)}`);
  }

  // 2. Probe beta_requests table
  try {
    const { error } = await supabase
      .from("beta_requests")
      .select("id")
      .limit(1);
    if (error) {
      diag.ok = false;
      diag.missing.beta_requests = true;
      diag.errors.push(`beta_requests: ${error.message}`);
    }
  } catch (e) {
    diag.ok = false;
    diag.missing.beta_requests = true;
    diag.errors.push(`beta_requests: ${String(e)}`);
  }

  // 3. Probe beta_reports table
  try {
    const { error } = await supabase
      .from("beta_reports")
      .select("id")
      .limit(1);
    if (error) {
      diag.ok = false;
      diag.missing.beta_reports = true;
      diag.errors.push(`beta_reports: ${error.message}`);
    }
  } catch (e) {
    diag.ok = false;
    diag.missing.beta_reports = true;
    diag.errors.push(`beta_reports: ${String(e)}`);
  }

  return diag;
}

// ─────────────────────────────────────────────────────────
// BETA REQUESTS (pro asks to join the beta program)
// ─────────────────────────────────────────────────────────

/** Does this user already have a non-rejected beta_requests row? */
export async function hasOpenBetaRequest(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("beta_requests")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["pending", "approved"])
      .limit(1);
    if (error) {
      console.warn("[beta] hasOpenBetaRequest probe failed:", error);
      return false;
    }
    return !!(data && data.length > 0);
  } catch (e) {
    console.warn("[beta] hasOpenBetaRequest threw:", e);
    return false;
  }
}

export type SubmitBetaError = "duplicate" | "schema_missing" | "profile_update" | "insert_failed" | "unknown";

export async function submitBetaRequest(
  userId: string,
  payload: { motivation: string; feedback?: string; experience?: string }
): Promise<{ ok: boolean; error?: SubmitBetaError; message?: string }> {
  // 0. Block duplicate requests
  if (await hasOpenBetaRequest(userId)) {
    return { ok: false, error: "duplicate", message: "Une demande est déjà en cours." };
  }

  // 1. Insert into beta_requests
  try {
    const { error: insertError } = await supabase.from("beta_requests").insert({
      user_id: userId,
      motivation: payload.motivation,
      feedback: payload.feedback || null,
      experience: payload.experience || null,
      status: "pending",
    });
    if (insertError) {
      console.error("[beta] insert beta_request failed:", insertError);
      // Detect common "relation does not exist" error
      const msg = insertError.message || "";
      if (/does not exist|relation.*not.*exist/i.test(msg)) {
        return { ok: false, error: "schema_missing", message: "La table beta_requests n'existe pas encore. Lancez la migration SQL." };
      }
      return { ok: false, error: "insert_failed", message: msg };
    }
  } catch (e) {
    console.error("[beta] submitBetaRequest insert threw:", e);
    return { ok: false, error: "unknown", message: String(e) };
  }

  // 2. Reflect on profile
  try {
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ beta_status: "pending" })
      .eq("id", userId);
    if (updateError) {
      console.error("[beta] profile beta_status update failed:", updateError);
      return { ok: false, error: "profile_update", message: updateError.message };
    }
  } catch (e) {
    console.error("[beta] submitBetaRequest update threw:", e);
    return { ok: false, error: "unknown", message: String(e) };
  }

  return { ok: true };
}

export async function fetchBetaRequests(): Promise<BetaRequest[]> {
  try {
    const { data, error } = await supabase
      .from("beta_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[beta] fetchBetaRequests failed:", error);
      return [];
    }
    if (!data) return [];

    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
    const nameMap: Record<string, { name?: string; email?: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, name, email")
        .in("id", userIds);
      profiles?.forEach((p) => {
        nameMap[p.id] = { name: p.name, email: p.email };
      });
    }

    return data.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: nameMap[r.user_id]?.name,
      userEmail: nameMap[r.user_id]?.email,
      motivation: r.motivation || "",
      feedback: r.feedback || undefined,
      experience: r.experience || undefined,
      status: (r.status || "pending") as BetaStatus,
      createdAt: r.created_at,
      decidedAt: r.decided_at || undefined,
    }));
  } catch (e) {
    console.warn("[beta] fetchBetaRequests threw:", e);
    return [];
  }
}

export async function decideBetaRequest(
  requestId: string,
  userId: string,
  decision: "approved" | "rejected"
): Promise<{ ok: boolean; error?: string }> {
  // Admin "accept" must update both tables; surface failure so the UI knows.
  try {
    const nowIso = new Date().toISOString();

    // 1. Write the request row
    const { error: reqErr } = await supabase
      .from("beta_requests")
      .update({ status: decision, decided_at: nowIso })
      .eq("id", requestId);
    if (reqErr) {
      console.error("[beta] decide request update failed:", reqErr);
      return { ok: false, error: `beta_requests update: ${reqErr.message}` };
    }

    // 2. Mirror the decision onto the user profile so the pro's UI unlocks.
    //    CRITICAL: split the writes. beta_status is mandatory; subscription_plan
    //    is a best-effort bonus — if the column doesn't exist, we still want
    //    the approval to succeed so the user gets access.
    const { error: betaErr } = await supabase
      .from("user_profiles")
      .update({ beta_status: decision })
      .eq("id", userId);
    if (betaErr) {
      console.error("[beta] decide beta_status update failed:", betaErr);
      return { ok: false, error: `beta_status: ${betaErr.message}` };
    }

    // 3. Best-effort: grant the entreprise plan on approval. If the column
    //    is missing, log a warning but do NOT fail the whole operation.
    if (decision === "approved") {
      const { error: planErr } = await supabase
        .from("user_profiles")
        .update({ subscription_plan: "entreprise" })
        .eq("id", userId);
      if (planErr) {
        console.warn(
          "[beta] decide plan update failed (column may be missing, non-fatal):",
          planErr
        );
      }
    }

    return { ok: true };
  } catch (e) {
    console.error("[beta] decideBetaRequest threw:", e);
    return { ok: false, error: String(e) };
  }
}

/** Admin: revoke an approved beta tester's access.
 *  - Clears user_profiles.beta_status back to 'none' (NOT 'rejected' — rejected
 *    is reserved for explicit refusals at application time).
 *  - Resets subscription_plan to 'essentiel' (premium was a beta perk).
 *  - DELETES the beta_requests row so the user can submit a fresh request.
 */
export async function removeBetaAccess(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // Reset beta_status (mandatory) — split from plan reset to stay robust
    // even if subscription_plan column doesn't exist yet.
    const { error: betaErr } = await supabase
      .from("user_profiles")
      .update({ beta_status: "none" })
      .eq("id", userId);
    if (betaErr) {
      console.error("[beta] removeBetaAccess beta_status update failed:", betaErr);
      return { ok: false, error: betaErr.message };
    }

    // Best-effort: reset subscription_plan back to essentiel
    const { error: planErr } = await supabase
      .from("user_profiles")
      .update({ subscription_plan: "essentiel" })
      .eq("id", userId);
    if (planErr) {
      console.warn(
        "[beta] removeBetaAccess plan reset failed (column may be missing, non-fatal):",
        planErr
      );
    }

    // Delete any lingering request rows (pending + approved only — leave
    // rejected history intact as an audit trail)
    const { error: reqErr } = await supabase
      .from("beta_requests")
      .delete()
      .eq("user_id", userId)
      .in("status", ["pending", "approved"]);
    if (reqErr) {
      console.warn("[beta] removeBetaAccess request cleanup failed (non-fatal):", reqErr);
    }

    return { ok: true };
  } catch (e) {
    console.error("[beta] removeBetaAccess threw:", e);
    return { ok: false, error: String(e) };
  }
}

/** Admin: permanently delete a single beta_requests row (used for refused requests). */
export async function deleteBetaRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("beta_requests")
      .delete()
      .eq("id", requestId);
    if (error) {
      console.error("[beta] deleteBetaRequest failed:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("[beta] deleteBetaRequest threw:", e);
    return { ok: false, error: String(e) };
  }
}

export async function fetchBetaStatus(userId: string): Promise<BetaStatus> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("beta_status")
      .eq("id", userId)
      .single();
    if (error || !data) return "none";
    return (data.beta_status as BetaStatus) || "none";
  } catch {
    return "none";
  }
}

// Count the number of pending requests — used by the admin dashboard.
export async function countPendingBetaRequests(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("beta_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) {
      console.warn("[beta] countPendingBetaRequests failed:", error);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────
// BETA REPORTS (beta testers send bugs / feedback / ideas)
// ─────────────────────────────────────────────────────────

const REPORTS_KEY = "beta-reports";

function rowToReport(r: Record<string, unknown>): BetaReport {
  return {
    id: String(r.id),
    userId: r.user_id ? String(r.user_id) : undefined,
    userName: r.user_name ? String(r.user_name) : undefined,
    userEmail: r.user_email ? String(r.user_email) : undefined,
    kind: (r.kind as BetaReportKind) || "feedback",
    title: (r.title as string) || "",
    description: (r.description as string) || "",
    step: (r.step as string) || undefined,
    verdict: (r.verdict as string) || undefined,
    status: (r.status as BetaReportStatus) || "received",
    createdAt: String(r.created_at),
  };
}

export async function saveBetaReport(
  userId: string,
  report: Omit<BetaReport, "id" | "createdAt" | "status" | "userId" | "userName" | "userEmail">
): Promise<BetaReport> {
  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from("beta_reports")
      .insert({
        user_id: userId,
        kind: report.kind,
        title: report.title || null,
        description: report.description,
        step: report.step || null,
        verdict: report.verdict || null,
        status: "received",
      })
      .select()
      .single();
    if (!error && data) {
      const saved = rowToReport(data);
      // Also cache locally so the UI is fast when offline
      cacheLocalReport(userId, saved);
      return saved;
    }
    console.warn("[beta] saveBetaReport supabase error:", error);
  } catch (e) {
    console.warn("[beta] saveBetaReport threw:", e);
  }

  // Fallback: localStorage only
  const fallback: BetaReport = {
    id: `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    kind: report.kind,
    title: report.title,
    description: report.description,
    step: report.step,
    verdict: report.verdict,
    status: "received",
    createdAt: new Date().toISOString(),
  };
  cacheLocalReport(userId, fallback);
  return fallback;
}

function cacheLocalReport(userId: string, item: BetaReport) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(`${REPORTS_KEY}:${userId}`);
    const list = raw ? (JSON.parse(raw) as BetaReport[]) : [];
    localStorage.setItem(`${REPORTS_KEY}:${userId}`, JSON.stringify([item, ...list].slice(0, 50)));
  } catch {}
}

function loadLocalReports(userId: string): BetaReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${REPORTS_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as BetaReport[]) : [];
  } catch {
    return [];
  }
}

/** Load reports for a single user. Supabase first, localStorage fallback. */
export async function loadBetaReports(userId: string): Promise<BetaReport[]> {
  try {
    const { data, error } = await supabase
      .from("beta_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      return data.map(rowToReport);
    }
    console.warn("[beta] loadBetaReports supabase error:", error);
  } catch (e) {
    console.warn("[beta] loadBetaReports threw:", e);
  }
  return loadLocalReports(userId);
}

/** Admin-only: load every report from every beta tester, enriched with user info. */
export async function fetchAllBetaReports(): Promise<BetaReport[]> {
  try {
    const { data, error } = await supabase
      .from("beta_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[beta] fetchAllBetaReports failed:", error);
      return [];
    }
    if (!data) return [];

    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
    const nameMap: Record<string, { name?: string; email?: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, name, email")
        .in("id", userIds);
      profiles?.forEach((p) => {
        nameMap[p.id] = { name: p.name, email: p.email };
      });
    }

    return data.map((r) => {
      const base = rowToReport(r);
      const info = nameMap[base.userId || ""];
      return { ...base, userName: info?.name, userEmail: info?.email };
    });
  } catch (e) {
    console.warn("[beta] fetchAllBetaReports threw:", e);
    return [];
  }
}

/** Admin action: move a report through the status lifecycle. */
export async function updateBetaReportStatus(
  reportId: string,
  status: BetaReportStatus
): Promise<{ ok: boolean }> {
  try {
    const { error } = await supabase
      .from("beta_reports")
      .update({ status })
      .eq("id", reportId);
    if (error) {
      console.warn("[beta] updateBetaReportStatus error:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.warn("[beta] updateBetaReportStatus threw:", e);
    return { ok: false };
  }
}

// ─────────────────────────────────────────────────────────
// LABELS + HELPERS
// ─────────────────────────────────────────────────────────

export function labelFor(kind: BetaReportKind): string {
  if (kind === "bug") return "Bug";
  if (kind === "feedback") return "Avis";
  return "Suggestion";
}

export function xpFor(kind: BetaReportKind): number {
  if (kind === "bug") return 150;
  if (kind === "suggestion") return 100;
  return 50;
}

export function rankFor(totalXp: number): { level: number; label: string; next: number; progress: number } {
  const thresholds = [
    { level: 1, label: "Novice", min: 0 },
    { level: 2, label: "Initiate", min: 300 },
    { level: 3, label: "Contributeur", min: 800 },
    { level: 4, label: "Expert Niveau 4", min: 1500 },
    { level: 5, label: "Elite Analyst", min: 3000 },
    { level: 6, label: "Légende bêta", min: 6000 },
  ];
  let current = thresholds[0];
  let nextIdx = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (totalXp >= thresholds[i].min) {
      current = thresholds[i];
      nextIdx = i + 1;
    }
  }
  const next = thresholds[nextIdx] || thresholds[thresholds.length - 1];
  const span = next.min - current.min || 1;
  const progress = Math.min(100, Math.round(((totalXp - current.min) / span) * 100));
  return { level: current.level, label: current.label, next: next.min, progress };
}

// ─────────────────────────────────────────────────────────
// UNSEEN BETA REQUEST TRACKING (admin side)
// ─────────────────────────────────────────────────────────
// The admin layout subscribes to INSERTs on beta_requests and pops a toast.
// Unread count is persisted to localStorage so it survives page navigations.

const UNSEEN_KEY = "admin-beta-unseen";

export function getUnseenBetaCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(UNSEEN_KEY);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function incrementUnseenBeta() {
  if (typeof window === "undefined") return;
  try {
    const current = getUnseenBetaCount();
    localStorage.setItem(UNSEEN_KEY, String(current + 1));
    window.dispatchEvent(new CustomEvent("admin-beta-unseen", { detail: current + 1 }));
  } catch {}
}

export function clearUnseenBeta() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(UNSEEN_KEY, "0");
    window.dispatchEvent(new CustomEvent("admin-beta-unseen", { detail: 0 }));
  } catch {}
}

export async function syncUnseenBetaFromDb(): Promise<number> {
  const count = await countPendingBetaRequests();
  if (typeof window === "undefined") return count;
  try {
    localStorage.setItem(UNSEEN_KEY, String(count));
    window.dispatchEvent(new CustomEvent("admin-beta-unseen", { detail: count }));
  } catch {}
  return count;
}
