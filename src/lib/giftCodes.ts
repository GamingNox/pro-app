// ═══ Gift Code System ═════════════════════════════════
// Simple gift code management. Attempts Supabase first
// (table `gift_codes`), falls back to localStorage for
// prototype usage when the table isn't available.

import { supabase } from "./supabase";

export type GiftRewardType = "free_month" | "discount_percent";

export interface GiftCode {
  id: string;
  code: string;
  rewardType: GiftRewardType;
  /** For discount_percent: the %. For free_month: number of months. */
  rewardValue: number;
  expiresAt: string | null;
  redeemed: boolean;
  redeemedBy: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

const STORAGE_KEY = "gift-codes";

// ── Local storage fallback ─────────────────────────────
function readLocal(): GiftCode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GiftCode[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(codes: GiftCode[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch {}
}

// ── Public API ─────────────────────────────────────────

/** Generate a random human-readable code like "GIFT-A1B2C3". */
export function generateGiftCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `GIFT-${code}`;
}

/** List all gift codes (admin). */
export async function listGiftCodes(): Promise<GiftCode[]> {
  // Try Supabase
  try {
    const { data, error } = await supabase.from("gift_codes").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      return (data as Array<Record<string, unknown>>).map((r) => ({
        id: r.id as string,
        code: r.code as string,
        rewardType: r.reward_type as GiftRewardType,
        rewardValue: Number(r.reward_value),
        expiresAt: (r.expires_at as string) || null,
        redeemed: Boolean(r.redeemed),
        redeemedBy: (r.redeemed_by as string) || null,
        redeemedAt: (r.redeemed_at as string) || null,
        createdAt: r.created_at as string,
      }));
    }
  } catch {}
  // Fallback
  return readLocal();
}

/** Create a new gift code (admin). */
export async function createGiftCode(params: {
  code: string;
  rewardType: GiftRewardType;
  rewardValue: number;
  expiresAt: string | null;
}): Promise<GiftCode> {
  const newCode: GiftCode = {
    id: `gc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    code: params.code.toUpperCase().trim(),
    rewardType: params.rewardType,
    rewardValue: params.rewardValue,
    expiresAt: params.expiresAt,
    redeemed: false,
    redeemedBy: null,
    redeemedAt: null,
    createdAt: new Date().toISOString(),
  };
  // Try Supabase
  try {
    const { error } = await supabase.from("gift_codes").insert({
      id: newCode.id,
      code: newCode.code,
      reward_type: newCode.rewardType,
      reward_value: newCode.rewardValue,
      expires_at: newCode.expiresAt,
      redeemed: false,
      created_at: newCode.createdAt,
    });
    if (!error) return newCode;
  } catch {}
  // Fallback to localStorage
  const existing = readLocal();
  writeLocal([newCode, ...existing]);
  return newCode;
}

/** Delete a gift code (admin). */
export async function deleteGiftCode(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("gift_codes").delete().eq("id", id);
    if (!error) return;
  } catch {}
  // Fallback
  const existing = readLocal();
  writeLocal(existing.filter((c) => c.id !== id));
}

/** Attempt to redeem a code (user side). Returns the code on success, null on failure. */
export async function redeemGiftCode(code: string, userId: string): Promise<GiftCode | null> {
  const normalized = code.toUpperCase().trim();

  // Try Supabase first
  try {
    const { data } = await supabase.from("gift_codes").select("*").eq("code", normalized).maybeSingle();
    if (data) {
      const row = data as Record<string, unknown>;
      if (row.redeemed) return null;
      const expiresAt = row.expires_at as string | null;
      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return null;
      const { error } = await supabase
        .from("gift_codes")
        .update({ redeemed: true, redeemed_by: userId, redeemed_at: new Date().toISOString() })
        .eq("id", row.id as string);
      if (!error) {
        return {
          id: row.id as string,
          code: row.code as string,
          rewardType: row.reward_type as GiftRewardType,
          rewardValue: Number(row.reward_value),
          expiresAt,
          redeemed: true,
          redeemedBy: userId,
          redeemedAt: new Date().toISOString(),
          createdAt: row.created_at as string,
        };
      }
    }
  } catch {}

  // Fallback: localStorage lookup
  const existing = readLocal();
  const idx = existing.findIndex((c) => c.code === normalized);
  if (idx === -1) return null;
  const found = existing[idx];
  if (found.redeemed) return null;
  if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) return null;
  const updated: GiftCode = {
    ...found,
    redeemed: true,
    redeemedBy: userId,
    redeemedAt: new Date().toISOString(),
  };
  existing[idx] = updated;
  writeLocal(existing);
  return updated;
}
