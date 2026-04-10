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

// ── User ─────────────────────────────────────────────────
export type AccountType = "pro" | "client";

export interface UserProfile {
  name: string;
  business: string;
  phone: string;
  email: string;
  bookingSlug?: string;
  accountType?: AccountType;
}
