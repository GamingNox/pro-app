"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  initialClients,
  initialAppointments,
  initialInvoices,
  initialProducts,
} from "./data";
import type {
  Client,
  Appointment,
  Invoice,
  InvoiceItem,
  Product,
  AppointmentStatus,
  PaymentStatus,
  UserProfile,
} from "./types";

// ── Helpers ──────────────────────────────────────────────
let _id = 100;
const nextId = (prefix: string) => `${prefix}${++_id}`;

const today = () => new Date().toISOString().split("T")[0];

// ── Context shape ────────────────────────────────────────
interface AppState {
  // Onboarding
  hasOnboarded: boolean;
  completeOnboarding: () => void;

  // User
  user: UserProfile;
  updateUser: (u: Partial<UserProfile>) => void;

  // Clients
  clients: Client[];
  addClient: (c: Omit<Client, "id" | "createdAt" | "avatar">) => void;
  updateClient: (id: string, c: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;

  // Appointments
  appointments: Appointment[];
  addAppointment: (a: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, a: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  setAppointmentStatus: (id: string, s: AppointmentStatus) => void;
  getTodayAppointments: () => Appointment[];
  getClientAppointments: (clientId: string) => Appointment[];

  // Invoices
  invoices: Invoice[];
  addInvoice: (i: Omit<Invoice, "id">) => void;
  setInvoiceStatus: (id: string, s: PaymentStatus) => void;
  getClientInvoices: (clientId: string) => Invoice[];
  getTodayRevenue: () => number;
  getWeekRevenue: () => number;
  getMonthRevenue: () => number;
  getPendingAmount: () => number;

  // Stock
  products: Product[];
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getLowStockProducts: () => Product[];
}

const AppContext = createContext<AppState | null>(null);

// ── Provider ─────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState<UserProfile>({
    name: "",
    business: "",
    phone: "",
    email: "",
  });
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("proapp_state");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.hasOnboarded !== undefined) setHasOnboarded(s.hasOnboarded);
        if (s.user) setUser(s.user);
        if (s.clients) setClients(s.clients);
        if (s.appointments) setAppointments(s.appointments);
        if (s.invoices) setInvoices(s.invoices);
        if (s.products) setProducts(s.products);
      } catch {
        // ignore
      }
    }
    setIsHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      "proapp_state",
      JSON.stringify({ hasOnboarded, user, clients, appointments, invoices, products })
    );
  }, [hasOnboarded, user, clients, appointments, invoices, products, isHydrated]);

  // ── Onboarding ──
  const completeOnboarding = useCallback(() => setHasOnboarded(true), []);

  // ── User ──
  const updateUser = useCallback(
    (u: Partial<UserProfile>) => setUser((prev) => ({ ...prev, ...u })),
    []
  );

  // ── Clients ──
  const addClient = useCallback(
    (c: Omit<Client, "id" | "createdAt" | "avatar">) => {
      const id = nextId("c");
      const colors = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];
      setClients((prev) => [
        ...prev,
        { ...c, id, createdAt: today(), avatar: colors[prev.length % colors.length] },
      ]);
    },
    []
  );
  const updateClient = useCallback(
    (id: string, c: Partial<Client>) =>
      setClients((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x))),
    []
  );
  const deleteClient = useCallback(
    (id: string) => setClients((prev) => prev.filter((x) => x.id !== id)),
    []
  );
  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  // ── Appointments ──
  const addAppointment = useCallback(
    (a: Omit<Appointment, "id">) =>
      setAppointments((prev) => [...prev, { ...a, id: nextId("a") }]),
    []
  );
  const updateAppointment = useCallback(
    (id: string, a: Partial<Appointment>) =>
      setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, ...a } : x))),
    []
  );
  const deleteAppointment = useCallback(
    (id: string) => setAppointments((prev) => prev.filter((x) => x.id !== id)),
    []
  );
  const setAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus) =>
      setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x))),
    []
  );
  const getTodayAppointments = useCallback(
    () =>
      appointments
        .filter((a) => a.date === today() && a.status !== "canceled")
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments]
  );
  const getClientAppointments = useCallback(
    (clientId: string) =>
      appointments
        .filter((a) => a.clientId === clientId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [appointments]
  );

  // ── Invoices ──
  const addInvoice = useCallback(
    (i: Omit<Invoice, "id">) =>
      setInvoices((prev) => [...prev, { ...i, id: nextId("inv") }]),
    []
  );
  const setInvoiceStatus = useCallback(
    (id: string, status: PaymentStatus) =>
      setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x))),
    []
  );
  const getClientInvoices = useCallback(
    (clientId: string) =>
      invoices.filter((i) => i.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)),
    [invoices]
  );

  const getTodayRevenue = useCallback(
    () =>
      invoices
        .filter((i) => i.date === today() && i.status === "paid")
        .reduce((s, i) => s + i.amount, 0),
    [invoices]
  );

  const getWeekRevenue = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return invoices
      .filter((i) => i.status === "paid" && new Date(i.date) >= weekAgo)
      .reduce((s, i) => s + i.amount, 0);
  }, [invoices]);

  const getMonthRevenue = useCallback(() => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return invoices
      .filter((i) => i.status === "paid" && new Date(i.date) >= monthAgo)
      .reduce((s, i) => s + i.amount, 0);
  }, [invoices]);

  const getPendingAmount = useCallback(
    () => invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0),
    [invoices]
  );

  // ── Stock ──
  const addProduct = useCallback(
    (p: Omit<Product, "id">) =>
      setProducts((prev) => [...prev, { ...p, id: nextId("p") }]),
    []
  );
  const updateProduct = useCallback(
    (id: string, p: Partial<Product>) =>
      setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x))),
    []
  );
  const deleteProduct = useCallback(
    (id: string) => setProducts((prev) => prev.filter((x) => x.id !== id)),
    []
  );
  const getLowStockProducts = useCallback(
    () => products.filter((p) => p.quantity <= p.minQuantity),
    [products]
  );

  if (!isHydrated) return null;

  return (
    <AppContext.Provider
      value={{
        hasOnboarded,
        completeOnboarding,
        user,
        updateUser,
        clients,
        addClient,
        updateClient,
        deleteClient,
        getClient,
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        setAppointmentStatus,
        getTodayAppointments,
        getClientAppointments,
        invoices,
        addInvoice,
        setInvoiceStatus,
        getClientInvoices,
        getTodayRevenue,
        getWeekRevenue,
        getMonthRevenue,
        getPendingAmount,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getLowStockProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
