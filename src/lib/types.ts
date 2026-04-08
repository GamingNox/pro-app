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
  minQuantity: number; // threshold for low-stock alert
  price: number;
  category: string;
  emoji: string;
}

// ── User ─────────────────────────────────────────────────
export interface UserProfile {
  name: string;
  business: string;
  phone: string;
  email: string;
}
