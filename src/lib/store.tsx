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
  AccountType,
  Client,
  Appointment,
  Invoice,
  InvoiceItem,
  Product,
  Service,
  AppointmentStatus,
  PaymentStatus,
  UserProfile,
  LoyaltyTemplate,
  LoyaltyCard,
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
    id: r.id as string, firstName: r.first_name as string, lastName: r.last_name as string,
    phone: r.phone as string, email: r.email as string, notes: r.notes as string,
    avatar: r.avatar as string, createdAt: (r.created_at as string).split("T")[0],
  };
}

function rowToAppointment(r: Record<string, unknown>): Appointment {
  return {
    id: r.id as string, clientId: (r.client_id as string) || "", title: r.title as string,
    date: (r.date as string).split("T")[0], time: (r.time as string).substring(0, 5),
    duration: r.duration as number, status: r.status as AppointmentStatus,
    price: Number(r.price), notes: r.notes as string,
    guestName: (r.guest_name as string) || undefined, guestEmail: (r.guest_email as string) || undefined,
    guestPhone: (r.guest_phone as string) || undefined, isGuest: (r.is_guest as boolean) || false,
  };
}

function rowToInvoice(r: Record<string, unknown>): Invoice {
  return {
    id: r.id as string, clientId: (r.client_id as string) || "",
    appointmentId: (r.appointment_id as string) || undefined,
    amount: Number(r.amount), status: r.status as PaymentStatus,
    date: (r.date as string).split("T")[0], description: r.description as string,
    items: (r.items as InvoiceItem[]) || undefined,
  };
}

function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string, name: r.name as string, quantity: r.quantity as number,
    minQuantity: r.min_quantity as number, price: Number(r.price),
    category: r.category as string, emoji: r.emoji as string,
  };
}

function rowToService(r: Record<string, unknown>): Service {
  return {
    id: r.id as string, name: r.name as string, duration: r.duration as number,
    price: Number(r.price), description: (r.description as string) || "", active: r.active as boolean,
  };
}

// ── Context shape ────────────────────────────────────────
interface AppState {
  hasOnboarded: boolean;
  isDemo: boolean;
  user: UserProfile;
  updateUser: (u: Partial<UserProfile>) => void;

  // Auth actions
  completeAuth: (uid: string, acctType: AccountType) => Promise<void>;
  startDemo: (acctType: AccountType) => void;
  logout: () => void;

  // Data collections
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

  loyaltyTemplates: LoyaltyTemplate[];
  addLoyaltyTemplate: (t: Omit<LoyaltyTemplate, "id">) => void;
  deleteLoyaltyTemplate: (id: string) => void;
  loyaltyCards: LoyaltyCard[];
  addLoyaltyCard: (c: Omit<LoyaltyCard, "id" | "createdAt">) => void;
  updateLoyaltyCard: (id: string, c: Partial<LoyaltyCard>) => void;
  deleteLoyaltyCard: (id: string) => void;
  getLoyaltyCardByCode: (code: string) => LoyaltyCard | undefined;
}

const AppContext = createContext<AppState | null>(null);

// ── Premium Splash Screen ────────────────────────────────
function SplashScreen() {
  const [phase, setPhase] = useState<"intro" | "exit">("intro");
  useEffect(() => { const t = setTimeout(() => setPhase("exit"), 1600); return () => clearTimeout(t); }, []);
  return (
    <div className={`h-full h-[100dvh] flex flex-col items-center justify-center bg-white relative overflow-hidden ${phase === "exit" ? "splash-fade-out" : ""}`}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, rgba(0,122,255,0.04) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 flex items-center justify-center"><div className="splash-orb-glow w-40 h-40 rounded-full bg-accent/6 blur-3xl" /></div>
      <div className="splash-orb relative z-10 w-[72px] h-[72px] rounded-[22px] bg-accent-gradient flex items-center justify-center shadow-apple-lg mb-7">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="8" y="7" width="4" height="18" rx="2" fill="white" fillOpacity="0.95"/>
          <rect x="8" y="21" width="14" height="4" rx="2" fill="white" fillOpacity="0.95"/>
          <circle cx="22" cy="11" r="3" fill="white" fillOpacity="0.4"/>
        </svg>
      </div>
      <h1 className="splash-title relative z-10 text-[22px] font-bold text-foreground tracking-tight">Lumière Pro</h1>
      <p className="splash-subtitle relative z-10 text-[12px] text-muted mt-2 tracking-wide font-medium">Votre activité, simplifiée</p>
    </div>
  );
}

// ── Provider ─────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [user, setUser] = useState<UserProfile>({ name: "", business: "", phone: "", email: "" });
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loyaltyTemplates, setLoyaltyTemplates] = useState<LoyaltyTemplate[]>([]);
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // ── Load all data for a specific user ──────────────────
  const loadUserData = useCallback(async (uid: string) => {
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
  }, []);

  // ── Clear all in-memory data ───────────────────────────
  const clearAllData = useCallback(() => {
    setClients([]);
    setAppointments([]);
    setInvoices([]);
    setProducts([]);
    setServices([]);
    setLoyaltyTemplates([]);
    setLoyaltyCards([]);
  }, []);

  // ── Supabase Auth: check session on mount ──────────────
  useEffect(() => {
    async function init() {
      // Demo accounts: kill on reload — NEVER persist
      if (typeof window !== "undefined" && localStorage.getItem("demo-mode") === "true") {
        localStorage.removeItem("demo-mode");
        localStorage.removeItem("account-type");
        setIsHydrated(true);
        return;
      }

      try {
        // Check Supabase Auth for existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const uid = session.user.id;
          const savedAcctType = (typeof window !== "undefined" ? localStorage.getItem("account-type") : null) as AccountType | null;

          // Load profile from DB
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", uid)
            .single();

          if (profile && profile.has_onboarded) {
            setUserId(uid);
            setUser({
              name: profile.name || "",
              business: profile.business || "",
              phone: profile.phone || "",
              email: profile.email || session.user.email || "",
              bookingSlug: profile.booking_slug || undefined,
              accountType: savedAcctType || undefined,
            });
            setHasOnboarded(true);
            await loadUserData(uid);
          }
          // If profile doesn't exist or not onboarded, user stays on onboarding
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
      setIsHydrated(true);
    }

    init();

    // Listen for sign-out events to clean up state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setHasOnboarded(false);
        setUserId(null);
        setUser({ name: "", business: "", phone: "", email: "" });
        clearAllData();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData, clearAllData]);

  // Dismiss splash after hydration + minimum display time
  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => setShowSplash(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  // ── Realtime subscriptions ─────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `user_id=eq.${userId}` },
        (p) => {
          if (p.eventType === "INSERT") setClients((prev) => [rowToClient(p.new), ...prev]);
          if (p.eventType === "UPDATE") setClients((prev) => prev.map((c) => c.id === p.new.id ? rowToClient(p.new) : c));
          if (p.eventType === "DELETE") setClients((prev) => prev.filter((c) => c.id !== p.old.id));
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${userId}` },
        (p) => {
          if (p.eventType === "INSERT") setAppointments((prev) => [...prev, rowToAppointment(p.new)]);
          if (p.eventType === "UPDATE") setAppointments((prev) => prev.map((a) => a.id === p.new.id ? rowToAppointment(p.new) : a));
          if (p.eventType === "DELETE") setAppointments((prev) => prev.filter((a) => a.id !== p.old.id));
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `user_id=eq.${userId}` },
        (p) => {
          if (p.eventType === "INSERT") setInvoices((prev) => [rowToInvoice(p.new), ...prev]);
          if (p.eventType === "UPDATE") setInvoices((prev) => prev.map((i) => i.id === p.new.id ? rowToInvoice(p.new) : i));
          if (p.eventType === "DELETE") setInvoices((prev) => prev.filter((i) => i.id !== p.old.id));
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `user_id=eq.${userId}` },
        (p) => {
          if (p.eventType === "INSERT") setProducts((prev) => [...prev, rowToProduct(p.new)]);
          if (p.eventType === "UPDATE") setProducts((prev) => prev.map((x) => x.id === p.new.id ? rowToProduct(p.new) : x));
          if (p.eventType === "DELETE") setProducts((prev) => prev.filter((x) => x.id !== p.old.id));
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter: `user_id=eq.${userId}` },
        (p) => {
          if (p.eventType === "INSERT") setServices((prev) => [...prev, rowToService(p.new)]);
          if (p.eventType === "UPDATE") setServices((prev) => prev.map((x) => x.id === p.new.id ? rowToService(p.new) : x));
          if (p.eventType === "DELETE") setServices((prev) => prev.filter((x) => x.id !== p.old.id));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ═══ AUTH ACTIONS ══════════════════════════════════════

  /** Called after successful signup/login. Loads profile + data, sets session. */
  const completeAuth = useCallback(async (uid: string, acctType: AccountType) => {
    setUserId(uid);
    localStorage.setItem("account-type", acctType);

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (profile) {
      setUser({
        name: profile.name || "",
        business: profile.business || "",
        phone: profile.phone || "",
        email: profile.email || "",
        bookingSlug: profile.booking_slug || undefined,
        accountType: acctType,
      });
    }

    await loadUserData(uid);
    setHasOnboarded(true);
  }, [loadUserData]);

  /** Start a demo session — in-memory only, NEVER touches DB */
  const startDemo = useCallback((acctType: AccountType) => {
    localStorage.setItem("demo-mode", "true");
    setIsDemo(true);
    setUser({
      name: acctType === "pro" ? "Marie Dupont" : "Julien Lefebvre",
      business: acctType === "pro" ? "Consultante" : "",
      phone: "",
      email: acctType === "pro" ? "marie@demo.com" : "julien@demo.com",
      accountType: acctType,
    });
    setHasOnboarded(true);
  }, []);

  /** Full logout — clears everything, calls Supabase signOut */
  const logout = useCallback(() => {
    setHasOnboarded(false);
    setUser({ name: "", business: "", phone: "", email: "" });
    clearAllData();
    setIsDemo(false);
    setUserId(null);
    localStorage.removeItem("account-type");
    localStorage.removeItem("demo-mode");
    // Sign out from Supabase Auth (async, fire-and-forget)
    supabase.auth.signOut().catch(() => {});
  }, [clearAllData]);

  // ═══ USER PROFILE ═════════════════════════════════════

  const updateUser = useCallback(
    (u: Partial<UserProfile>) => {
      setUser((prev) => ({ ...prev, ...u }));
      if (!userId || isDemo) return;
      const dbFields: Record<string, unknown> = {};
      if (u.name !== undefined) dbFields.name = u.name;
      if (u.business !== undefined) dbFields.business = u.business;
      if (u.phone !== undefined) dbFields.phone = u.phone;
      if (u.email !== undefined) dbFields.email = u.email;
      if (u.bookingSlug !== undefined) dbFields.booking_slug = u.bookingSlug;
      if (Object.keys(dbFields).length > 0) {
        supabase.from("user_profiles").update(dbFields).eq("id", userId).then();
      }
    },
    [userId, isDemo]
  );

  // ═══ CLIENTS ══════════════════════════════════════════

  const addClient = useCallback(
    async (c: Omit<Client, "id" | "createdAt" | "avatar">) => {
      if (!userId) return;
      const avatar = avatarColors[clients.length % avatarColors.length];
      const { data } = await supabase.from("clients")
        .insert({ user_id: userId, first_name: c.firstName, last_name: c.lastName, phone: c.phone, email: c.email, notes: c.notes, avatar })
        .select().single();
      if (data) setClients((prev) => [rowToClient(data), ...prev]);
    }, [userId, clients.length]
  );

  const updateClient = useCallback((id: string, c: Partial<Client>) => {
    setClients((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x)));
    const dbFields: Record<string, unknown> = {};
    if (c.firstName !== undefined) dbFields.first_name = c.firstName;
    if (c.lastName !== undefined) dbFields.last_name = c.lastName;
    if (c.phone !== undefined) dbFields.phone = c.phone;
    if (c.email !== undefined) dbFields.email = c.email;
    if (c.notes !== undefined) dbFields.notes = c.notes;
    if (c.avatar !== undefined) dbFields.avatar = c.avatar;
    supabase.from("clients").update(dbFields).eq("id", id).then();
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((x) => x.id !== id));
    supabase.from("clients").delete().eq("id", id).then();
  }, []);

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  // ═══ APPOINTMENTS ═════════════════════════════════════

  const addAppointment = useCallback(async (a: Omit<Appointment, "id">) => {
    if (!userId) return;
    const row: Record<string, unknown> = {
      user_id: userId, client_id: a.clientId || null, title: a.title, date: a.date,
      time: a.time, duration: a.duration, status: a.status, price: a.price, notes: a.notes,
    };
    if (a.isGuest) { row.is_guest = true; row.guest_name = a.guestName || null; row.guest_email = a.guestEmail || null; row.guest_phone = a.guestPhone || null; }
    const { data } = await supabase.from("appointments").insert(row).select().single();
    if (data) setAppointments((prev) => [...prev, rowToAppointment(data)]);
  }, [userId]);

  const updateAppointment = useCallback((id: string, a: Partial<Appointment>) => {
    setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, ...a } : x)));
    const f: Record<string, unknown> = {};
    if (a.clientId !== undefined) f.client_id = a.clientId || null;
    if (a.title !== undefined) f.title = a.title;
    if (a.date !== undefined) f.date = a.date;
    if (a.time !== undefined) f.time = a.time;
    if (a.duration !== undefined) f.duration = a.duration;
    if (a.status !== undefined) f.status = a.status;
    if (a.price !== undefined) f.price = a.price;
    if (a.notes !== undefined) f.notes = a.notes;
    supabase.from("appointments").update(f).eq("id", id).then();
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((x) => x.id !== id));
    supabase.from("appointments").delete().eq("id", id).then();
  }, []);

  const setAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    supabase.from("appointments").update({ status }).eq("id", id).then();
  }, []);

  const getTodayAppointments = useCallback(
    () => appointments.filter((a) => a.date === today() && a.status !== "canceled").sort((a, b) => a.time.localeCompare(b.time)),
    [appointments]
  );

  const getClientAppointments = useCallback(
    (clientId: string) => appointments.filter((a) => a.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)),
    [appointments]
  );

  // ═══ INVOICES ═════════════════════════════════════════

  const addInvoice = useCallback(async (i: Omit<Invoice, "id">) => {
    if (!userId) return;
    const { data } = await supabase.from("invoices").insert({
      user_id: userId, client_id: i.clientId || null, appointment_id: i.appointmentId || null,
      amount: i.amount, status: i.status, date: i.date, description: i.description, items: i.items || [],
    }).select().single();
    if (data) setInvoices((prev) => [rowToInvoice(data), ...prev]);
  }, [userId]);

  const setInvoiceStatus = useCallback((id: string, status: PaymentStatus) => {
    setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    supabase.from("invoices").update({ status }).eq("id", id).then();
  }, []);

  const getClientInvoices = useCallback(
    (clientId: string) => invoices.filter((i) => i.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)),
    [invoices]
  );

  const getTodayRevenue = useCallback(
    () => invoices.filter((i) => i.date === today() && i.status === "paid").reduce((s, i) => s + i.amount, 0), [invoices]
  );
  const getWeekRevenue = useCallback(() => {
    const w = new Date(); w.setDate(w.getDate() - 7);
    return invoices.filter((i) => i.status === "paid" && new Date(i.date) >= w).reduce((s, i) => s + i.amount, 0);
  }, [invoices]);
  const getMonthRevenue = useCallback(() => {
    const m = new Date(); m.setDate(m.getDate() - 30);
    return invoices.filter((i) => i.status === "paid" && new Date(i.date) >= m).reduce((s, i) => s + i.amount, 0);
  }, [invoices]);
  const getPendingAmount = useCallback(
    () => invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0), [invoices]
  );

  // ═══ STOCK ════════════════════════════════════════════

  const addProduct = useCallback(async (p: Omit<Product, "id">) => {
    if (!userId) return;
    const { data } = await supabase.from("products")
      .insert({ user_id: userId, name: p.name, quantity: p.quantity, min_quantity: p.minQuantity, price: p.price, category: p.category, emoji: p.emoji })
      .select().single();
    if (data) setProducts((prev) => [...prev, rowToProduct(data)]);
  }, [userId]);

  const updateProduct = useCallback((id: string, p: Partial<Product>) => {
    setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));
    const f: Record<string, unknown> = {};
    if (p.name !== undefined) f.name = p.name;
    if (p.quantity !== undefined) f.quantity = p.quantity;
    if (p.minQuantity !== undefined) f.min_quantity = p.minQuantity;
    if (p.price !== undefined) f.price = p.price;
    if (p.category !== undefined) f.category = p.category;
    if (p.emoji !== undefined) f.emoji = p.emoji;
    supabase.from("products").update(f).eq("id", id).then();
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((x) => x.id !== id));
    supabase.from("products").delete().eq("id", id).then();
  }, []);

  const getLowStockProducts = useCallback(() => products.filter((p) => p.quantity <= p.minQuantity), [products]);

  // ═══ SERVICES ═════════════════════════════════════════

  const addService = useCallback(async (s: Omit<Service, "id">) => {
    if (!userId) return;
    const { data } = await supabase.from("services")
      .insert({ user_id: userId, name: s.name, duration: s.duration, price: s.price, description: s.description, active: s.active })
      .select().single();
    if (data) setServices((prev) => [...prev, rowToService(data)]);
  }, [userId]);

  const updateService = useCallback((id: string, s: Partial<Service>) => {
    setServices((prev) => prev.map((x) => (x.id === id ? { ...x, ...s } : x)));
    const f: Record<string, unknown> = {};
    if (s.name !== undefined) f.name = s.name;
    if (s.duration !== undefined) f.duration = s.duration;
    if (s.price !== undefined) f.price = s.price;
    if (s.description !== undefined) f.description = s.description;
    if (s.active !== undefined) f.active = s.active;
    supabase.from("services").update(f).eq("id", id).then();
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((x) => x.id !== id));
    supabase.from("services").delete().eq("id", id).then();
  }, []);

  // ═══ LOYALTY (local state) ════════════════════════════

  const addLoyaltyTemplate = useCallback((t: Omit<LoyaltyTemplate, "id">) => {
    const id = "lt_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setLoyaltyTemplates((prev) => [...prev, { ...t, id }]);
  }, []);
  const deleteLoyaltyTemplate = useCallback((id: string) => { setLoyaltyTemplates((prev) => prev.filter((x) => x.id !== id)); }, []);
  const addLoyaltyCard = useCallback((c: Omit<LoyaltyCard, "id" | "createdAt">) => {
    const id = "lc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setLoyaltyCards((prev) => [...prev, { ...c, id, createdAt: new Date().toISOString().split("T")[0] }]);
  }, []);
  const updateLoyaltyCard = useCallback((id: string, c: Partial<LoyaltyCard>) => { setLoyaltyCards((prev) => prev.map((x) => x.id === id ? { ...x, ...c } : x)); }, []);
  const deleteLoyaltyCard = useCallback((id: string) => { setLoyaltyCards((prev) => prev.filter((x) => x.id !== id)); }, []);
  const getLoyaltyCardByCode = useCallback((code: string) => loyaltyCards.find((c) => c.code === code), [loyaltyCards]);

  if (showSplash) return <SplashScreen />;

  return (
    <AppContext.Provider
      value={{
        hasOnboarded, isDemo, user, updateUser,
        completeAuth, startDemo, logout,
        clients, addClient, updateClient, deleteClient, getClient,
        appointments, addAppointment, updateAppointment, deleteAppointment,
        setAppointmentStatus, getTodayAppointments, getClientAppointments,
        invoices, addInvoice, setInvoiceStatus, getClientInvoices,
        getTodayRevenue, getWeekRevenue, getMonthRevenue, getPendingAmount,
        products, addProduct, updateProduct, deleteProduct, getLowStockProducts,
        services, addService, updateService, deleteService,
        loyaltyTemplates, addLoyaltyTemplate, deleteLoyaltyTemplate,
        loyaltyCards, addLoyaltyCard, updateLoyaltyCard, deleteLoyaltyCard, getLoyaltyCardByCode,
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
