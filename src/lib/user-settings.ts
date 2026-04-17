// ══ User settings — Supabase-backed with localStorage cache ═══════
// Replaces the per-feature localStorage keys (automated_messages,
// booking_rules, availability_exceptions, profile_visibility_config,
// external-payment-link) with a single JSONB column on user_profiles.
//
// Usage in a settings page:
//   const [cfg, setCfg, saving] = useUserSettings("automated_messages", DEFAULT);
//   setCfg(next);  // debounced save to Supabase, mirrored to localStorage
//
// Reads are instant (hydrated from localStorage on mount) then reconciled
// with Supabase in the background. Writes go to Supabase first, with
// localStorage as a fallback for offline/logged-out users.

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// Known top-level keys under user_profiles.settings
export type SettingsKey =
  | "automated_messages"
  | "booking_rules"
  | "availability_exceptions"
  | "visibility_config"
  | "external_payment_link"
  | "push_preferences"
  | "invoice_config";

// Map old localStorage keys → new settings keys.
// Used to migrate existing data on first load.
const LEGACY_KEY_MAP: Record<SettingsKey, string> = {
  automated_messages: "automated_messages",
  booking_rules: "booking_rules",
  availability_exceptions: "availability_exceptions",
  visibility_config: "profile_visibility_config",
  external_payment_link: "external-payment-link",
  push_preferences: "push_preferences",
  invoice_config: "invoice_config",
};

// Cache the full settings JSONB to minimize round trips
let cachedFullSettings: Record<string, unknown> | null = null;
let cachedUserId: string | null = null;

async function getCurrentUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  const { data: { user } } = await supabase.auth.getUser();
  cachedUserId = user?.id || null;
  return cachedUserId;
}

async function fetchFullSettings(userId: string): Promise<Record<string, unknown>> {
  if (cachedFullSettings) return cachedFullSettings;
  const { data } = await supabase
    .from("user_profiles")
    .select("settings")
    .eq("id", userId)
    .single();
  const s = (data?.settings as Record<string, unknown>) || {};
  cachedFullSettings = s;
  return s;
}

async function persistFullSettings(userId: string, next: Record<string, unknown>) {
  cachedFullSettings = next;
  await supabase.from("user_profiles").update({ settings: next }).eq("id", userId);
}

/** Read a single settings key. Falls back through: Supabase → legacy localStorage → default. */
export async function loadSetting<T>(key: SettingsKey, defaultValue: T): Promise<T> {
  const userId = await getCurrentUserId();
  // If logged in → read from Supabase
  if (userId) {
    try {
      const all = await fetchFullSettings(userId);
      if (all[key] !== undefined) return all[key] as T;
    } catch { /* fall through */ }
  }
  // Legacy localStorage fallback
  try {
    const raw = localStorage.getItem(LEGACY_KEY_MAP[key]);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return defaultValue;
}

/** Write a single settings key. Writes to Supabase (if logged in) AND localStorage. */
export async function saveSetting<T>(key: SettingsKey, value: T): Promise<void> {
  // Mirror to localStorage first so reloads feel instant even if network is slow
  try {
    localStorage.setItem(LEGACY_KEY_MAP[key], JSON.stringify(value));
  } catch { /* ignore */ }

  const userId = await getCurrentUserId();
  if (!userId) return;
  try {
    const all = await fetchFullSettings(userId);
    const next = { ...all, [key]: value };
    await persistFullSettings(userId, next);
  } catch (e) {
    console.warn(`[settings] save ${key} failed:`, e);
  }
}

/** Reset caches — call on logout. */
export function clearSettingsCache() {
  cachedFullSettings = null;
  cachedUserId = null;
}

// ── React hook ──────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * React hook with instant localStorage hydration + async Supabase reconciliation.
 * Returns [value, setValue, status].
 */
export function useUserSettings<T>(key: SettingsKey, defaultValue: T): [T, (next: T) => void, SaveStatus] {
  // Instant hydration from legacy localStorage
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(LEGACY_KEY_MAP[key]) : null;
      if (raw) return JSON.parse(raw) as T;
    } catch { /* ignore */ }
    return defaultValue;
  });
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reconcile with Supabase once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fromDb = await loadSetting(key, defaultValue);
      if (!cancelled) {
        setValue((curr) => {
          // Only overwrite if DB has a real value different from current
          if (JSON.stringify(curr) === JSON.stringify(fromDb)) return curr;
          return fromDb;
        });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Debounced persistence
  const updateValue = useCallback((next: T) => {
    setValue(next);
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void (async () => {
        try {
          await saveSetting(key, next);
          setStatus("saved");
          if (typeof window !== "undefined") window.dispatchEvent(new Event("settings-saved"));
          setTimeout(() => setStatus("idle"), 1500);
        } catch {
          setStatus("error");
          if (typeof window !== "undefined") window.dispatchEvent(new Event("settings-error"));
          setTimeout(() => setStatus("idle"), 2500);
        }
      })();
    }, 400);
  }, [key]);

  return [value, updateValue, status];
}
