// ══ Feature Category Color System ══════════════════════
// Centralized color-coding for features by category.
// Each category has: label, hex color, soft/background variant, icon color.
// Apply consistently across dashboard, settings, navigation.

export type CategoryKey =
  | "clients"
  | "bookings"
  | "business"
  | "finance"
  | "marketing"
  | "system"
  | "premium"
  | "referral"
  | "beta";

export interface Category {
  key: CategoryKey;
  label: string;
  /** Main hex (icons, badges, active states) */
  color: string;
  /** Soft background (cards, tag backgrounds) */
  soft: string;
  /** Deep variant (hover, pressed) */
  deep: string;
}

export const CATEGORIES: Record<CategoryKey, Category> = {
  clients: {
    key: "clients",
    label: "CLIENTS",
    color: "#3B82F6",     // soft blue
    soft: "#EFF6FF",
    deep: "#1D4ED8",
  },
  bookings: {
    key: "bookings",
    label: "RESERVATIONS",
    color: "#8B5CF6",     // purple
    soft: "#F5F3FF",
    deep: "#6D28D9",
  },
  business: {
    key: "business",
    label: "BUSINESS",
    color: "#0891B2",     // cyan-600 — clearly distinct from green
    soft: "#ECFEFF",
    deep: "#164E63",
  },
  finance: {
    key: "finance",
    label: "FINANCE",
    color: "#16A34A",     // green-600 — strong vibrant green
    soft: "#F0FDF4",
    deep: "#15803D",
  },
  marketing: {
    key: "marketing",
    label: "MARKETING",
    color: "#F59E0B",     // orange amber
    soft: "#FFFBEB",
    deep: "#B45309",
  },
  system: {
    key: "system",
    label: "SYSTEME",
    color: "#71717A",     // neutral grey (zinc-500)
    soft: "#F4F4F5",
    deep: "#3F3F46",
  },
  premium: {
    key: "premium",
    label: "PREMIUM",
    color: "#D4A017",     // gold
    soft: "#FFF8E1",
    deep: "#B8860B",
  },
  referral: {
    key: "referral",
    label: "PARRAINAGE",
    color: "#EC4899",     // rose/pink — warm complement that plays with violet ecosystem
    soft: "#FDF2F8",
    deep: "#BE185D",
  },
  beta: {
    key: "beta",
    label: "BETA TESTEUR",
    color: "#8B5CF6",     // violet — beta program is a sibling of the brand indigo
    soft: "#F3F0FF",
    deep: "#6D28D9",
  },
};

/** Route → Category mapping. Used to color-code anything that links somewhere. */
export const ROUTE_CATEGORY: Record<string, CategoryKey> = {
  "/clients": "clients",
  "/loyalty-manage": "clients",

  "/settings/referral": "referral",

  "/appointments": "bookings",
  "/settings/availability": "bookings",
  "/settings/booking-link": "bookings",
  "/settings/booking-rules": "bookings",

  "/settings/services": "business",
  "/settings/stock": "business",
  "/settings/info": "business",
  "/settings/qr-code": "business",

  "/gestion": "finance",
  "/settings/accounting": "finance",
  "/settings/taxes": "finance",
  "/settings/payments": "finance",
  "/settings/invoice": "finance",
  "/settings/analytics": "finance",

  "/settings/promotions": "marketing",
  "/settings/messages": "marketing",

  "/settings/preferences": "system",
  "/settings/notifications": "system",
  "/settings/updates": "system",
  "/settings/help": "system",
  "/guide": "system",

  "/subscription": "premium",

  "/settings/beta-tester": "beta",
  "/beta-space": "beta",

  // Client account routes
  "/account": "clients",
  "/account/info": "clients",
  "/account/notifications": "system",
  "/account/updates": "system",
  "/account/legal": "system",
  "/reservations": "bookings",
  "/loyalty": "clients",
  "/offers": "marketing",
};

export function getCategoryForRoute(route: string): Category {
  const key = ROUTE_CATEGORY[route] || "system";
  return CATEGORIES[key];
}
