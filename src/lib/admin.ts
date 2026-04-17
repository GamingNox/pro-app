// ═══ Admin operations ═════════════════════════════════
// Client-side admin helpers. Cross-user reads go through
// server API routes (/api/admin/*) which use the service
// role key to bypass RLS. Single-user mutations (plan update,
// password reset) still go through Supabase client + rely
// on the admin user having appropriate RLS permissions.

import { supabase } from "./supabase";
import type { PlanTier } from "./types";

// Shared secret used to authenticate client → server admin calls.
// Kept in the client bundle because the admin panel is gated
// by localStorage + the layout check — a random visitor would
// have to know the admin credentials first.
const ADMIN_SECRET = "clientbase-admin-2026";

/**
 * Update any user's subscription plan in Supabase.
 * Returns true on success, false otherwise.
 */
export async function adminUpdateUserPlan(userId: string, plan: PlanTier): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({ subscription_plan: plan })
      .eq("id", userId);
    if (error) {
      console.error("[adminUpdateUserPlan] Supabase error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[adminUpdateUserPlan] Unexpected error:", err);
    return false;
  }
}

/**
 * Send a password reset email to the given address.
 */
export async function adminSendPasswordReset(email: string): Promise<boolean> {
  try {
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/onboarding`
      : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return !error;
  } catch {
    return false;
  }
}

/**
 * List every user with aggregated stats (client count, appointment count, revenue).
 * Calls the server API route which uses the service role key.
 */
export async function adminListUsers() {
  try {
    const res = await fetch("/api/admin/list-users", {
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    if (!res.ok) {
      console.error("[adminListUsers] HTTP", res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("[adminListUsers] fetch failed:", e);
    return null;
  }
}

/**
 * Delete a user entirely: wipes app data then deletes the auth.users row.
 * Gated by the server (caller's Supabase session must have is_admin = true).
 */
export async function adminDeleteUser(userId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });
    return res.ok;
  } catch (e) {
    console.error("[adminDeleteUser] failed:", e);
    return false;
  }
}

/**
 * Fetch aggregated data for a single user.
 */
export async function adminFetchUserData(userId: string) {
  try {
    const res = await fetch("/api/admin/user-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      console.error("[adminFetchUserData] HTTP", res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("[adminFetchUserData] fetch failed:", e);
    return null;
  }
}
