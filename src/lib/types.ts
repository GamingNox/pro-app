// ── Clients ──────────────────────────────────────────────
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string; // ISO date
  avatar: string; // initials-based color
}

// ── Services ─────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  description: string;
  active: boolean;
}

// ── Appointments ─────────────────────────────────────────
export type AppointmentStatus = "confirmed" | "done" | "canceled";

export interface Appointment {
  id: string;
  clientId: string;
  title: string;
  date: string; // ISO date
  time: string; // "HH:mm"
  duration: number; // minutes
  status: AppointmentStatus;
  price: number;
  notes: string;
  // Guest booking fields
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  isGuest?: boolean;
}

// ── Finances ─────────────────────────────────────────────
export type PaymentStatus = "paid" | "pending";

export interface InvoiceItem {
  label: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  appointmentId?: string;
  amount: number;
  status: PaymentStatus;
  date: string; // ISO date
  description: string;
  items?: InvoiceItem[];
  invoiceNumber?: string; // FA-YYYY-NNNN (assigned at creation, sequential per user)
}

// ── Stock ────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  price: number;
  category: string;
  emoji: string;
}

// ── Loyalty ──────────────────────────────────────────────
export type LoyaltyMode = "visits" | "points";

export interface LoyaltyTemplate {
  id: string;
  name: string;
  color: string;
  emoji: string;
  mode: LoyaltyMode;
  goal: number;
  reward: string;
  message: string;
}

export interface LoyaltyCard {
  id: string;
  templateId: string;
  clientId: string;
  code: string;
  progress: number;
  createdAt: string;
}

// ── Subscription ────────────────────────────────────────
export type PlanTier = "essentiel" | "croissance" | "entreprise";

export type Feature =
  | "clients_unlimited" | "appointments_unlimited" | "dashboard_full"
  | "stock_management" | "finance_tracking" | "analytics_advanced"
  | "loyalty_system" | "booking_page" | "priority_support"
  | "custom_branding" | "api_access" | "pdf_reports"
  | "multi_staff" | "auto_reminders" | "sla_99";

export const PLAN_LIMITS: Record<PlanTier, { maxClients: number; maxAppointments: number }> = {
  essentiel: { maxClients: 15, maxAppointments: 30 },
  croissance: { maxClients: Infinity, maxAppointments: Infinity },
  entreprise: { maxClients: Infinity, maxAppointments: Infinity },
};

export const PLAN_FEATURES: Record<PlanTier, Feature[]> = {
  essentiel: [
    "dashboard_full", "booking_page",
  ],
  croissance: [
    "dashboard_full", "booking_page",
    "clients_unlimited", "appointments_unlimited",
    "stock_management", "finance_tracking",
    "loyalty_system", "auto_reminders", "pdf_reports",
  ],
  entreprise: [
    "dashboard_full", "booking_page",
    "clients_unlimited", "appointments_unlimited",
    "stock_management", "finance_tracking",
    "loyalty_system", "auto_reminders", "pdf_reports",
    "analytics_advanced", "priority_support",
    "custom_branding", "api_access", "multi_staff", "sla_99",
  ],
};

export const PLAN_PRICES: Record<PlanTier, string> = {
  essentiel: "0",
  croissance: "9,99",
  entreprise: "19,99",
};

export const PLAN_NAMES: Record<PlanTier, string> = {
  essentiel: "Essentiel",
  croissance: "Pro",
  entreprise: "Elite",
};

/** Check if a plan has access to a specific feature */
export function hasAccess(feature: Feature, plan: PlanTier): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

/** Get the minimum plan required for a feature */
export function requiredPlan(feature: Feature): PlanTier {
  if (PLAN_FEATURES.essentiel.includes(feature)) return "essentiel";
  if (PLAN_FEATURES.croissance.includes(feature)) return "croissance";
  return "entreprise";
}

// ── User ─────────────────────────────────────────────────
export type AccountType = "pro" | "client";

export type BetaStatus = "none" | "pending" | "approved" | "rejected";

export interface UserProfile {
  name: string;
  business: string;
  phone: string;
  email: string;
  address?: string;
  bookingSlug?: string;
  accountType?: AccountType;
  plan?: PlanTier;
  betaStatus?: BetaStatus;
  chatEnabled?: boolean;
  businessType?: string;
  setupCompleted?: boolean;
  onboardingData?: OnboardingData;
}

// Progressive multi-step onboarding snapshot. Persisted to
// user_profiles.onboarding_data (JSONB) and to localStorage as fallback.
export interface OnboardingData {
  businessType?: string;
  phone?: string;
  services?: { name: string; price: number; duration: number }[];
  workDays?: { [key: string]: boolean };
  workStart?: string;
  workEnd?: string;
  notifications?: boolean;
  referralCode?: string;
  stepsCompleted?: number;
}

// ── Chat ──────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  bookingId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ── Beta tester ─────────────────────────────────────────
export interface BetaRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  motivation: string;
  feedback?: string;
  experience?: string;
  status: BetaStatus;
  createdAt: string;
  decidedAt?: string;
}

export type BetaReportKind = "bug" | "feedback" | "suggestion";
export type BetaReportStatus = "received" | "in_progress" | "fixed";

export interface BetaReport {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  kind: BetaReportKind;
  title: string;
  description: string;
  step?: string;
  verdict?: string;
  createdAt: string;
  status: BetaReportStatus;
}
