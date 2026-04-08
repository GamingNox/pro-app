import type { Client, Appointment, Invoice, Product } from "./types";

// Helper: today and nearby dates for realistic mock data
const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

// ── Avatar colors ────────────────────────────────────────
export const avatarColors = [
  "#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899",
  "#8B5CF6", "#06B6D4", "#EF4444", "#14B8A6", "#F97316",
];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// ── Clients ──────────────────────────────────────────────
export const initialClients: Client[] = [
  {
    id: "c1",
    firstName: "Marie",
    lastName: "Dupont",
    phone: "06 12 34 56 78",
    email: "marie.dupont@email.com",
    notes: "Préfère les créneaux du matin. Allergie au latex.",
    createdAt: fmt(addDays(today, -60)),
    avatar: "#7C3AED",
  },
  {
    id: "c2",
    firstName: "Sophie",
    lastName: "Martin",
    phone: "06 98 76 54 32",
    email: "sophie.martin@email.com",
    notes: "Cliente régulière, tous les 15 jours.",
    createdAt: fmt(addDays(today, -45)),
    avatar: "#3B82F6",
  },
  {
    id: "c3",
    firstName: "Léa",
    lastName: "Bernard",
    phone: "07 11 22 33 44",
    email: "lea.bernard@email.com",
    notes: "",
    createdAt: fmt(addDays(today, -30)),
    avatar: "#10B981",
  },
  {
    id: "c4",
    firstName: "Camille",
    lastName: "Petit",
    phone: "06 55 66 77 88",
    email: "camille.petit@email.com",
    notes: "Vient avec sa fille parfois.",
    createdAt: fmt(addDays(today, -20)),
    avatar: "#F59E0B",
  },
  {
    id: "c5",
    firstName: "Julie",
    lastName: "Robert",
    phone: "07 99 88 77 66",
    email: "julie.robert@email.com",
    notes: "Nouvelle cliente, recommandée par Sophie.",
    createdAt: fmt(addDays(today, -5)),
    avatar: "#EC4899",
  },
  {
    id: "c6",
    firstName: "Thomas",
    lastName: "Leroy",
    phone: "06 44 33 22 11",
    email: "thomas.leroy@email.com",
    notes: "Coaching business. Séances le vendredi.",
    createdAt: fmt(addDays(today, -15)),
    avatar: "#8B5CF6",
  },
];

// ── Appointments ─────────────────────────────────────────
export const initialAppointments: Appointment[] = [
  {
    id: "a1",
    clientId: "c1",
    title: "Manucure gel",
    date: fmt(today),
    time: "09:00",
    duration: 60,
    status: "confirmed",
    price: 45,
    notes: "",
  },
  {
    id: "a2",
    clientId: "c2",
    title: "Pose complète",
    date: fmt(today),
    time: "10:30",
    duration: 90,
    status: "confirmed",
    price: 65,
    notes: "Couleur : rouge cerise",
  },
  {
    id: "a3",
    clientId: "c4",
    title: "Retouche",
    date: fmt(today),
    time: "14:00",
    duration: 45,
    status: "confirmed",
    price: 30,
    notes: "",
  },
  {
    id: "a4",
    clientId: "c6",
    title: "Séance coaching",
    date: fmt(today),
    time: "16:00",
    duration: 60,
    status: "confirmed",
    price: 80,
    notes: "Suivi mensuel",
  },
  {
    id: "a5",
    clientId: "c3",
    title: "Nail art",
    date: fmt(addDays(today, 1)),
    time: "11:00",
    duration: 75,
    status: "confirmed",
    price: 55,
    notes: "Design floral",
  },
  {
    id: "a6",
    clientId: "c5",
    title: "Première consultation",
    date: fmt(addDays(today, 1)),
    time: "15:00",
    duration: 30,
    status: "confirmed",
    price: 0,
    notes: "Consultation gratuite",
  },
  {
    id: "a7",
    clientId: "c1",
    title: "Manucure classique",
    date: fmt(addDays(today, -2)),
    time: "10:00",
    duration: 45,
    status: "done",
    price: 35,
    notes: "",
  },
  {
    id: "a8",
    clientId: "c2",
    title: "Dépose + repose",
    date: fmt(addDays(today, -5)),
    time: "09:30",
    duration: 90,
    status: "done",
    price: 70,
    notes: "",
  },
  {
    id: "a9",
    clientId: "c3",
    title: "Pose gel",
    date: fmt(addDays(today, -7)),
    time: "14:00",
    duration: 60,
    status: "canceled",
    price: 50,
    notes: "Annulé par la cliente",
  },
  {
    id: "a10",
    clientId: "c4",
    title: "Manucure",
    date: fmt(addDays(today, 2)),
    time: "09:00",
    duration: 60,
    status: "confirmed",
    price: 45,
    notes: "",
  },
  {
    id: "a11",
    clientId: "c6",
    title: "Coaching stratégie",
    date: fmt(addDays(today, 3)),
    time: "10:00",
    duration: 60,
    status: "confirmed",
    price: 80,
    notes: "",
  },
];

// ── Invoices ─────────────────────────────────────────────
export const initialInvoices: Invoice[] = [
  {
    id: "inv1",
    clientId: "c1",
    appointmentId: "a7",
    amount: 35,
    status: "paid",
    date: fmt(addDays(today, -2)),
    description: "Manucure classique",
  },
  {
    id: "inv2",
    clientId: "c2",
    appointmentId: "a8",
    amount: 70,
    status: "paid",
    date: fmt(addDays(today, -5)),
    description: "Dépose + repose",
  },
  {
    id: "inv3",
    clientId: "c1",
    appointmentId: "a1",
    amount: 45,
    status: "pending",
    date: fmt(today),
    description: "Manucure gel",
  },
  {
    id: "inv4",
    clientId: "c2",
    appointmentId: "a2",
    amount: 65,
    status: "pending",
    date: fmt(today),
    description: "Pose complète",
  },
  {
    id: "inv5",
    clientId: "c4",
    amount: 30,
    status: "pending",
    date: fmt(today),
    description: "Retouche",
  },
  {
    id: "inv6",
    clientId: "c6",
    amount: 80,
    status: "paid",
    date: fmt(addDays(today, -15)),
    description: "Séance coaching",
  },
  {
    id: "inv7",
    clientId: "c6",
    amount: 80,
    status: "pending",
    date: fmt(today),
    description: "Séance coaching",
  },
];

// ── Products (Stock) ─────────────────────────────────────
export const initialProducts: Product[] = [
  { id: "p1", name: "Gel UV transparent", quantity: 8, minQuantity: 3, price: 12.5, category: "Gel", emoji: "💅" },
  { id: "p2", name: "Vernis rouge cerise", quantity: 2, minQuantity: 3, price: 8.9, category: "Vernis", emoji: "💄" },
  { id: "p3", name: "Lime à ongles 180", quantity: 25, minQuantity: 10, price: 1.5, category: "Accessoires", emoji: "📐" },
  { id: "p4", name: "Primer sans acide", quantity: 5, minQuantity: 2, price: 14.0, category: "Préparation", emoji: "🧴" },
  { id: "p5", name: "Top coat brillant", quantity: 1, minQuantity: 3, price: 11.0, category: "Finition", emoji: "✨" },
  { id: "p6", name: "Coton cellulose", quantity: 150, minQuantity: 50, price: 3.5, category: "Accessoires", emoji: "🧻" },
  { id: "p7", name: "Huile cuticules", quantity: 4, minQuantity: 2, price: 9.9, category: "Soin", emoji: "🫧" },
  { id: "p8", name: "Capsules gel X", quantity: 0, minQuantity: 5, price: 15.0, category: "Extensions", emoji: "💎" },
];
