"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type {
  Client,
  Appointment,
  Invoice,
  InvoiceItem,
  Product,
  Service,
  AppointmentStatus,
  PaymentStatus,
  UserProfile,
} from "./types";

// ── Helpers ──────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

const avatarColors = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4", "#EF4444", "#14B8A6", "#F97316"];

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pro";
}

// ── DB row → app model mappers ───────────────────────────
function rowToClient(r: Record<string, unknown>): Client {
  return {
    id: r.id as string,
    firstName: r.first_name as string,
    lastName: r.last_name as string,
    phone: r.phone as string,
    email: r.email as string,
    notes: r.notes as string,
    avatar: r.avatar as string,
    createdAt: (r.created_at as string).split("T")[0],
  };
}

function rowToAppointment(r: Record<string, unknown>): Appointment {
  return {
    id: r.id as string,
    clientId: (r.client_id as string) || "",
    title: r.title as string,
    date: (r.date as string).split("T")[0],
    time: (r.time as string).substring(0, 5),
    duration: r.duration as number,
    status: r.status as AppointmentStatus,
    price: Number(r.price),
    notes: r.notes as string,
  };
}

function rowToInvoice(r: Record<string, unknown>): Invoice {
  return {
    id: r.id as string,
    clientId: (r.client_id as string) || "",
    appointmentId: (r.appointment_id as string) || undefined,
    amount: Number(r.amount),
    status: r.status as PaymentStatus,
    date: (r.date as string).split("T")[0],
    description: r.description as string,
    items: (r.items as InvoiceItem[]) || undefined,
  };
}

function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string,
    name: r.name as string,
    quantity: r.quantity as number,
    minQuantity: r.min_quantity as number,
    price: Number(r.price),
    category: r.category as string,
    emoji: r.emoji as string,
  };
}

function rowToService(r: Record<string, unknown>): Service {
  return {
    id: r.id as string,
    name: r.name as string,
    duration: r.duration as number,
    price: Number(r.price),
    description: (r.description as string) || "",
    active: r.active as boolean,
  };
}

// ── Context shape ────────────────────────────────────────
interface AppState {
  hasOnboarded: boolean;
  completeOnboarding: () => void;
  user: UserProfile;
  updateUser: (u: Partial<UserProfile>) => void;

  clients: Client[];
  addClient: (c: Omit<Client, "id" | "createdAt" | "avatar">) => void;
  updateClient: (id: string, c: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;

  appointments: Appointment[];
  addAppointment: (a: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, a: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  setAppointmentStatus: (id: string, s: AppointmentStatus) => void;
  getTodayAppointments: () => Appointment[];
  getClientAppointments: (clientId: string) => Appointment[];

  invoices: Invoice[];
  addInvoice: (i: Omit<Invoice, "id">) => void;
  setInvoiceStatus: (id: string, s: PaymentStatus) => void;
  getClientInvoices: (clientId: string) => Invoice[];
  getTodayRevenue: () => number;
  getWeekRevenue: () => number;
  getMonthRevenue: () => number;
  getPendingAmount: () => number;

  products: Product[];
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getLowStockProducts: () => Product[];

  services: Service[];
  addService: (s: Omit<Service, "id">) => void;
  updateService: (id: string, s: Partial<Service>) => void;
  deleteService: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

// ── Loading skeleton ─────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto bg-background">
      <div className="flex-1 px-6 pt-8">
        <div className="skeleton h-4 w-32 mb-2" />
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="flex gap-2.5 mb-6">
          <div className="skeleton h-20 flex-1 rounded-2xl" />
          <div className="skeleton h-20 flex-1 rounded-2xl" />
          <div className="skeleton h-20 flex-1 rounded-2xl" />
        </div>
        <div className="skeleton h-36 w-full rounded-2xl mb-5" />
        <div className="skeleton h-4 w-28 mb-3" />
        <div className="skeleton h-24 w-full rounded-2xl mb-2" />
        <div className="skeleton h-24 w-full rounded-2xl" />
      </div>
      <div className="h-14 bg-white shadow-nav" />
    </div>
  );
}

// ── Provider ─────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState<UserProfile>({ name: "", business: "", phone: "", email: "" });
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Hydrate from Supabase ──────────────────────────────
  useEffect(() => {
    async function hydrate() {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("*")
        .limit(1);

      let uid: string;
      if (profiles && profiles.length > 0) {
        const p = profiles[0];
        uid = p.id;
        setHasOnboarded(p.has_onboarded);
        setUser({ name: p.name, business: p.business, phone: p.phone, email: p.email, bookingSlug: p.booking_slug || undefined });
      } else {
        const { data: newProfile } = await supabase
          .from("user_profiles")
          .insert({ name: "", business: "", phone: "", email: "", has_onboarded: false })
          .select()
          .single();
        uid = newProfile!.id;
      }
      setUserId(uid);

      const [cRes, aRes, iRes, pRes, sRes] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").eq("user_id", uid),
        supabase.from("invoices").select("*").eq("user_id", uid).order("date", { ascending: false }),
        supabase.from("products").select("*").eq("user_id", uid),
        supabase.from("services").select("*").eq("user_id", uid).order("created_at", { ascending: true }),
      ]);

      if (cRes.data) setClients(cRes.data.map(rowToClient));
      if (aRes.data) setAppointments(aRes.data.map(rowToAppointment));
      if (iRes.data) setInvoices(iRes.data.map(rowToInvoice));
      if (pRes.data) setProducts(pRes.data.map(rowToProduct));
      if (sRes.data) setServices(sRes.data.map(rowToService));

      setIsHydrated(true);
    }
    hydrate();
  }, []);

  // ── Realtime subscriptions ─────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") setClients((prev) => [rowToClient(payload.new), ...prev]);
          if (payload.eventType === "UPDATE") setClients((prev) => prev.map((c) => c.id === payload.new.id ? rowToClient(payload.new) : c));
          if (payload.eventType === "DELETE") setClients((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") setAppointments((prev) => [...prev, rowToAppointment(payload.new)]);
          if (payload.eventType === "UPDATE") setAppointments((prev) => prev.map((a) => a.id === payload.new.id ? rowToAppointment(payload.new) : a));
          if (payload.eventType === "DELETE") setAppointments((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") setInvoices((prev) => [rowToInvoice(payload.new), ...prev]);
          if (payload.eventType === "UPDATE") setInvoices((prev) => prev.map((i) => i.id === payload.new.id ? rowToInvoice(payload.new) : i));
          if (payload.eventType === "DELETE") setInvoices((prev) => prev.filter((i) => i.id !== payload.old.id));
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") setProducts((prev) => [...prev, rowToProduct(payload.new)]);
          if (payload.eventType === "UPDATE") setProducts((prev) => prev.map((p) => p.id === payload.new.id ? rowToProduct(payload.new) : p));
          if (payload.eventType === "DELETE") setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") setServices((prev) => [...prev, rowToService(payload.new)]);
          if (payload.eventType === "UPDATE") setServices((prev) => prev.map((s) => s.id === payload.new.id ? rowToService(payload.new) : s));
          if (payload.eventType === "DELETE") setServices((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Onboarding ─────────────────────────────────────────
  const completeOnboarding = useCallback(() => {
    setHasOnboarded(true);
    if (userId) {
      const slug = generateSlug(user.name || "pro") + "-" + userId.substring(0, 6);
      setUser((prev) => ({ ...prev, bookingSlug: slug }));
      supabase.from("user_profiles").update({ has_onboarded: true, booking_slug: slug }).eq("id", userId).then();
    }
  }, [userId, user.name]);

  // ── User ───────────────────────────────────────────────
  const updateUser = useCallback(
    (u: Partial<UserProfile>) => {
      setUser((prev) => ({ ...prev, ...u }));
      if (userId) {
        const dbFields: Record<string, unknown> = {};
        if (u.name !== undefined) dbFields.name = u.name;
        if (u.business !== undefined) dbFields.business = u.business;
        if (u.phone !== undefined) dbFields.phone = u.phone;
        if (u.email !== undefined) dbFields.email = u.email;
        if (u.bookingSlug !== undefined) dbFields.booking_slug = u.bookingSlug;
        supabase.from("user_profiles").update(dbFields).eq("id", userId).then();
      }
    },
    [userId]
  );

  // ── Clients ────────────────────────────────────────────
  const addClient = useCallback(
    async (c: Omit<Client, "id" | "createdAt" | "avatar">) => {
      if (!userId) return;
      const avatar = avatarColors[clients.length % avatarColors.length];
      const { data } = await supabase
        .from("clients")
        .insert({ user_id: userId, first_name: c.firstName, last_name: c.lastName, phone: c.phone, email: c.email, notes: c.notes, avatar })
        .select()
        .single();
      if (data) setClients((prev) => [rowToClient(data), ...prev]);
    },
    [userId, clients.length]
  );

  const updateClient = useCallback(
    (id: string, c: Partial<Client>) => {
      setClients((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x)));
      const dbFields: Record<string, unknown> = {};
      if (c.firstName !== undefined) dbFields.first_name = c.firstName;
      if (c.lastName !== undefined) dbFields.last_name = c.lastName;
      if (c.phone !== undefined) dbFields.phone = c.phone;
      if (c.email !== undefined) dbFields.email = c.email;
      if (c.notes !== undefined) dbFields.notes = c.notes;
      if (c.avatar !== undefined) dbFields.avatar = c.avatar;
      supabase.from("clients").update(dbFields).eq("id", id).then();
    },
    []
  );

  const deleteClient = useCallback(
    (id: string) => {
      setClients((prev) => prev.filter((x) => x.id !== id));
      supabase.from("clients").delete().eq("id", id).then();
    },
    []
  );

  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  // ── Appointments ───────────────────────────────────────
  const addAppointment = useCallback(
    async (a: Omit<Appointment, "id">) => {
      if (!userId) return;
      const { data } = await supabase
        .from("appointments")
        .insert({
          user_id: userId, client_id: a.clientId || null, title: a.title, date: a.date,
          time: a.time, duration: a.duration, status: a.status, price: a.price, notes: a.notes,
        })
        .select()
        .single();
      if (data) setAppointments((prev) => [...prev, rowToAppointment(data)]);
    },
    [userId]
  );

  const updateAppointment = useCallback(
    (id: string, a: Partial<Appointment>) => {
      setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, ...a } : x)));
      const dbFields: Record<string, unknown> = {};
      if (a.clientId !== undefined) dbFields.client_id = a.clientId || null;
      if (a.title !== undefined) dbFields.title = a.title;
      if (a.date !== undefined) dbFields.date = a.date;
      if (a.time !== undefined) dbFields.time = a.time;
      if (a.duration !== undefined) dbFields.duration = a.duration;
      if (a.status !== undefined) dbFields.status = a.status;
      if (a.price !== undefined) dbFields.price = a.price;
      if (a.notes !== undefined) dbFields.notes = a.notes;
      supabase.from("appointments").update(dbFields).eq("id", id).then();
    },
    []
  );

  const deleteAppointment = useCallback(
    (id: string) => {
      setAppointments((prev) => prev.filter((x) => x.id !== id));
      supabase.from("appointments").delete().eq("id", id).then();
    },
    []
  );

  const setAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus) => {
      setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
      supabase.from("appointments").update({ status }).eq("id", id).then();
    },
    []
  );

  const getTodayAppointments = useCallback(
    () => appointments
      .filter((a) => a.date === today() && a.status !== "canceled")
      .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments]
  );

  const getClientAppointments = useCallback(
    (clientId: string) => appointments
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [appointments]
  );

  // ── Invoices ───────────────────────────────────────────
  const addInvoice = useCallback(
    async (i: Omit<Invoice, "id">) => {
      if (!userId) return;
      const { data } = await supabase
        .from("invoices")
        .insert({
          user_id: userId, client_id: i.clientId || null, appointment_id: i.appointmentId || null,
          amount: i.amount, status: i.status, date: i.date, description: i.description,
          items: i.items || [],
        })
        .select()
        .single();
      if (data) setInvoices((prev) => [rowToInvoice(data), ...prev]);
    },
    [userId]
  );

  const setInvoiceStatus = useCallback(
    (id: string, status: PaymentStatus) => {
      setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
      supabase.from("invoices").update({ status }).eq("id", id).then();
    },
    []
  );

  const getClientInvoices = useCallback(
    (clientId: string) => invoices
      .filter((i) => i.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [invoices]
  );

  const getTodayRevenue = useCallback(
    () => invoices.filter((i) => i.date === today() && i.status === "paid").reduce((s, i) => s + i.amount, 0),
    [invoices]
  );

  const getWeekRevenue = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return invoices.filter((i) => i.status === "paid" && new Date(i.date) >= weekAgo).reduce((s, i) => s + i.amount, 0);
  }, [invoices]);

  const getMonthRevenue = useCallback(() => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return invoices.filter((i) => i.status === "paid" && new Date(i.date) >= monthAgo).reduce((s, i) => s + i.amount, 0);
  }, [invoices]);

  const getPendingAmount = useCallback(
    () => invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0),
    [invoices]
  );

  // ── Stock ──────────────────────────────────────────────
  const addProduct = useCallback(
    async (p: Omit<Product, "id">) => {
      if (!userId) return;
      const { data } = await supabase
        .from("products")
        .insert({ user_id: userId, name: p.name, quantity: p.quantity, min_quantity: p.minQuantity, price: p.price, category: p.category, emoji: p.emoji })
        .select()
        .single();
      if (data) setProducts((prev) => [...prev, rowToProduct(data)]);
    },
    [userId]
  );

  const updateProduct = useCallback(
    (id: string, p: Partial<Product>) => {
      setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));
      const dbFields: Record<string, unknown> = {};
      if (p.name !== undefined) dbFields.name = p.name;
      if (p.quantity !== undefined) dbFields.quantity = p.quantity;
      if (p.minQuantity !== undefined) dbFields.min_quantity = p.minQuantity;
      if (p.price !== undefined) dbFields.price = p.price;
      if (p.category !== undefined) dbFields.category = p.category;
      if (p.emoji !== undefined) dbFields.emoji = p.emoji;
      supabase.from("products").update(dbFields).eq("id", id).then();
    },
    []
  );

  const deleteProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((x) => x.id !== id));
      supabase.from("products").delete().eq("id", id).then();
    },
    []
  );

  const getLowStockProducts = useCallback(
    () => products.filter((p) => p.quantity <= p.minQuantity),
    [products]
  );

  // ── Services ───────────────────────────────────────────
  const addService = useCallback(
    async (s: Omit<Service, "id">) => {
      if (!userId) return;
      const { data } = await supabase
        .from("services")
        .insert({ user_id: userId, name: s.name, duration: s.duration, price: s.price, description: s.description, active: s.active })
        .select()
        .single();
      if (data) setServices((prev) => [...prev, rowToService(data)]);
    },
    [userId]
  );

  const updateService = useCallback(
    (id: string, s: Partial<Service>) => {
      setServices((prev) => prev.map((x) => (x.id === id ? { ...x, ...s } : x)));
      const dbFields: Record<string, unknown> = {};
      if (s.name !== undefined) dbFields.name = s.name;
      if (s.duration !== undefined) dbFields.duration = s.duration;
      if (s.price !== undefined) dbFields.price = s.price;
      if (s.description !== undefined) dbFields.description = s.description;
      if (s.active !== undefined) dbFields.active = s.active;
      supabase.from("services").update(dbFields).eq("id", id).then();
    },
    []
  );

  const deleteService = useCallback(
    (id: string) => {
      setServices((prev) => prev.filter((x) => x.id !== id));
      supabase.from("services").delete().eq("id", id).then();
    },
    []
  );

  if (!isHydrated) return <LoadingSkeleton />;

  return (
    <AppContext.Provider
      value={{
        hasOnboarded, completeOnboarding,
        user, updateUser,
        clients, addClient, updateClient, deleteClient, getClient,
        appointments, addAppointment, updateAppointment, deleteAppointment,
        setAppointmentStatus, getTodayAppointments, getClientAppointments,
        invoices, addInvoice, setInvoiceStatus, getClientInvoices,
        getTodayRevenue, getWeekRevenue, getMonthRevenue, getPendingAmount,
        products, addProduct, updateProduct, deleteProduct, getLowStockProducts,
        services, addService, updateService, deleteService,
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
