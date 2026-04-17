"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
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

// ── Auto cancellation email (fire-and-forget) ───────────
// Triggered from setAppointmentStatus when an appointment flips to "canceled".
async function fireCancellationEmail(
  appointment: Appointment,
  clientsList: Client[],
  user: UserProfile
): Promise<void> {
  try {
    const client = clientsList.find((c) => c.id === appointment.clientId);
    const recipientEmail = client?.email || appointment.guestEmail;
    const recipientName = client?.firstName || appointment.guestName?.split(" ")[0] || "Client";
    if (!recipientEmail) return;

    const businessName = user.business || user.name || "Client Base";
    const rebookUrl = user.bookingSlug ? `https://clientbase.fr/p/${user.bookingSlug}` : undefined;

    const apptDate = new Date(appointment.date);
    const dateFr = apptDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

    const { sendEmail, buildCancellationEmail } = await import("./email");
    const { subject, html, text } = buildCancellationEmail({
      clientName: recipientName,
      businessName,
      serviceName: appointment.title,
      dateFr,
      timeFr: appointment.time,
      rebookUrl,
    });

    await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
      fromName: businessName,
      replyTo: user.email || undefined,
    });
  } catch (e) {
    console.warn("[cancellation-email] failed:", e);
  }
}

// ── Auto review request (fire-and-forget) ───────────────
// Triggered from setAppointmentStatus when an appointment flips to "done".
// Checks: review_request_enabled setting, client has email, not already sent.
// Dynamically imports the email helpers to keep the store bundle small.
async function fireReviewRequestEmail(
  appointmentId: string,
  appointment: Appointment,
  clientsList: Client[],
  user: UserProfile
): Promise<void> {
  try {
    // Idempotency: already sent for this appointment?
    const sentRaw = localStorage.getItem("review_request_sent");
    const sent: string[] = sentRaw ? JSON.parse(sentRaw) : [];
    if (sent.includes(appointmentId)) return;

    // Find the client with an email
    const client = clientsList.find((c) => c.id === appointment.clientId);
    if (!client || !client.email) return;

    // Gate + optional custom template from automated_messages config
    // (defaults to enabled=true, default template if no config saved yet)
    let enabled = true;
    let customTpl: string | undefined;
    try {
      const msgRaw = localStorage.getItem("automated_messages");
      if (msgRaw) {
        const parsed = JSON.parse(msgRaw);
        if (parsed?.review_request) {
          if (typeof parsed.review_request.enabled === "boolean") enabled = parsed.review_request.enabled;
          if (parsed.review_request.template) customTpl = parsed.review_request.template;
        }
      }
    } catch { /* ignore */ }
    if (!enabled) return;

    const slug = user.bookingSlug || user.name?.replace(/\s/g, "").toLowerCase() || "pro";
    const publicUrl = `https://clientbase.fr/p/${slug}`;
    const businessName = user.business || user.name || "Client Base";

    const { sendEmail, buildReviewRequestEmail } = await import("./email");
    const { subject, html, text } = buildReviewRequestEmail({
      clientName: client.firstName,
      businessName,
      serviceName: appointment.title,
      publicUrl,
      template: customTpl,
    });

    const result = await sendEmail({
      to: client.email,
      subject,
      html,
      text,
      fromName: businessName,
      replyTo: user.email || undefined,
    });

    if (result.delivered) {
      // Mark as sent (keep last 200 entries)
      const next = [appointmentId, ...sent].slice(0, 200);
      localStorage.setItem("review_request_sent", JSON.stringify(next));
    }
  } catch (e) {
    console.warn("[review-request] fire failed:", e);
  }
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
    invoiceNumber: (r.invoice_number as string) || undefined,
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

function rowToLoyaltyTemplate(r: Record<string, unknown>): LoyaltyTemplate {
  return {
    id: r.id as string,
    name: (r.name as string) || "",
    color: (r.color as string) || "#5B4FE9",
    emoji: (r.emoji as string) || "🎁",
    mode: (r.mode as "visits" | "points") || "visits",
    goal: r.goal as number,
    reward: (r.reward as string) || "",
    message: (r.message as string) || "",
  };
}

function rowToLoyaltyCard(r: Record<string, unknown>): LoyaltyCard {
  return {
    id: r.id as string,
    templateId: r.template_id as string,
    clientId: (r.client_id as string) || "",
    code: r.code as string,
    progress: r.progress as number,
    createdAt: (r.created_at as string)?.split("T")[0] || new Date().toISOString().split("T")[0],
  };
}

// ── Context shape ────────────────────────────────────────
interface AppState {
  hasOnboarded: boolean;
  isHydrated: boolean;
  isDemo: boolean;
  userId: string | null;
  user: UserProfile;
  updateUser: (u: Partial<UserProfile>) => void;
  refreshUserProfile: () => Promise<void>;
  saveOnboardingStep: (
    data: Partial<import("./types").OnboardingData>,
    opts?: { completed?: boolean; businessType?: string; phone?: string }
  ) => void;

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
  addLoyaltyTemplate: (t: Omit<LoyaltyTemplate, "id">) => Promise<void>;
  deleteLoyaltyTemplate: (id: string) => void;
  loyaltyCards: LoyaltyCard[];
  addLoyaltyCard: (c: Omit<LoyaltyCard, "id" | "createdAt">) => Promise<void>;
  updateLoyaltyCard: (id: string, c: Partial<LoyaltyCard>) => void;
  deleteLoyaltyCard: (id: string) => void;
  getLoyaltyCardByCode: (code: string) => LoyaltyCard | undefined;
}

const AppContext = createContext<AppState | null>(null);

// ── Launch Screen — premium multi-phase reveal ──────────
const SPLASH_MESSAGES = [
  "Préparation de votre espace",
  "Optimisation de votre gestion",
  "Connexion à vos données",
  "Chargement de vos outils",
  "On prépare tout pour vous",
  "Votre agenda se synchronise",
  "Encore un instant...",
  "Tout est bientôt prêt",
  "Mise en place de votre tableau de bord",
  "Vos clients vous attendent",
  "Chargement de votre activité",
  "Synchronisation en cours",
  "Préparation de vos statistiques",
  "On peaufine les derniers détails",
  "Votre espace pro se configure",
  "Bientôt opérationnel",
  "Récupération de vos rendez-vous",
  "Lancement de votre journée",
  "Un café pendant qu'on charge ?",
  "Mise à jour de vos données",
  "Votre succès commence ici",
  "Calcul de vos performances",
  "Chargement de vos services",
  "Presque prêt, promis",
  "On fait chauffer les serveurs",
  "Configuration de votre univers",
  "Votre business, simplifié",
  "Activation de vos super-pouvoirs",
  "C'est parti dans quelques secondes",
  "Préparation de quelque chose de bien",
];

const PARTICLES = [
  { x: 18, y: 72, s: 8,  c: "#5B4FE9", d: 0.0 },
  { x: 75, y: 80, s: 6,  c: "#7B6DFF", d: 0.2 },
  { x: 30, y: 85, s: 5,  c: "#8B82F0", d: 0.4 },
  { x: 82, y: 68, s: 7,  c: "#5B4FE9", d: 0.1 },
  { x: 50, y: 90, s: 4,  c: "#7C3AED", d: 0.3 },
  { x: 12, y: 60, s: 5,  c: "#6D5FFA", d: 0.5 },
  { x: 90, y: 55, s: 6,  c: "#5B4FE9", d: 0.15 },
  { x: 60, y: 78, s: 5,  c: "#8B82F0", d: 0.35 },
];

function SplashScreen() {
  const [phase, setPhase] = useState<"intro" | "ready" | "exit">("intro");
  const [message] = useState(() => SPLASH_MESSAGES[Math.floor(Math.random() * SPLASH_MESSAGES.length)]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ready"), 1100);
    const t2 = setTimeout(() => setPhase("exit"), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={`splash-container ${phase === "exit" ? "splash-exit" : ""}`}>
      {/* Gradient mesh background */}
      <div className="splash-bg" />

      {/* Floating particles */}
      <div className="splash-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="splash-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s,
              height: p.s,
              backgroundColor: p.c,
              animationDelay: `${p.d}s`,
            }}
          />
        ))}
      </div>

      {/* Soft violet bloom */}
      <div className="splash-bloom" />

      {/* Phase 1: Logo icon — spring in */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.svg"
        alt=""
        className="splash-logo-icon"
        width={80}
        height={80}
        draggable={false}
      />

      {/* Phase 2: Wordmark — reveals after logo settles */}
      <h1 className="splash-wordmark-new">
        <span className="splash-wb">Client</span>
        <span className="splash-wa">base</span>
        <span className="splash-wdot">.fr</span>
      </h1>

      {/* Phase 3: Message + dots */}
      <div className="splash-footer">
        <p className="splash-msg" aria-live="polite">{message}</p>
        <div className="splash-dots-row" aria-hidden="true">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </div>
  );
}

// ── Provider ─────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  // Initial state hydrated synchronously from localStorage so the first render
  // already has the last-known user profile (including beta_status). This
  // eliminates the "wrong UI flickers then switches" race on app load.
  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window === "undefined") return { name: "", business: "", phone: "", email: "" };
    try {
      // If demo-mode flag lingers in localStorage, don't hydrate from the cached
      // demo profile — the init effect will clear it immediately anyway.
      if (localStorage.getItem("demo-mode") === "true") {
        localStorage.removeItem("user-profile-cache");
        return { name: "", business: "", phone: "", email: "" };
      }
      const cached = localStorage.getItem("user-profile-cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && typeof parsed.name === "string") {
          return parsed as UserProfile;
        }
      }
    } catch {}
    return { name: "", business: "", phone: "", email: "" };
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loyaltyTemplates, setLoyaltyTemplates] = useState<LoyaltyTemplate[]>([]);
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [initError, setInitError] = useState(false);

  // ── Load all data for a specific user ──────────────────
  const loadUserData = useCallback(async (uid: string) => {
    const [cRes, aRes, iRes, pRes, sRes, ltRes, lcRes] = await Promise.all([
      supabase.from("clients").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("user_id", uid),
      supabase.from("invoices").select("*").eq("user_id", uid).order("date", { ascending: false }),
      supabase.from("products").select("*").eq("user_id", uid),
      supabase.from("services").select("*").eq("user_id", uid).order("created_at", { ascending: true }),
      supabase.from("loyalty_templates").select("*").eq("user_id", uid).order("created_at", { ascending: true }),
      supabase.from("loyalty_cards").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    if (cRes.data) setClients(cRes.data.map(rowToClient));
    if (aRes.data) setAppointments(aRes.data.map(rowToAppointment));
    if (iRes.data) setInvoices(iRes.data.map(rowToInvoice));
    if (pRes.data) setProducts(pRes.data.map(rowToProduct));
    if (sRes.data) setServices(sRes.data.map(rowToService));
    if (ltRes.data) setLoyaltyTemplates(ltRes.data.map(rowToLoyaltyTemplate));
    if (lcRes.data) setLoyaltyCards(lcRes.data.map(rowToLoyaltyCard));
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

  // Persist the full user profile to localStorage whenever it changes, so
  // the next app load can hydrate synchronously before Supabase responds.
  // IMPORTANT: never cache demo data — it would leak into real accounts on reload.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDemo) return; // do not persist demo profile
    if (!user.name && !user.email && !user.accountType) return; // empty initial
    try {
      localStorage.setItem("user-profile-cache", JSON.stringify(user));
    } catch {}
  }, [user, isDemo]);

  // ── Supabase Auth: check session on mount ──────────────
  useEffect(() => {
    async function init() {
      // Demo accounts: kill on reload — NEVER persist
      if (typeof window !== "undefined" && localStorage.getItem("demo-mode") === "true") {
        localStorage.removeItem("demo-mode");
        localStorage.removeItem("account-type");
        localStorage.removeItem("user-profile-cache"); // prevent demo data from leaking
        setUser({ name: "", business: "", phone: "", email: "" });
        setHasOnboarded(false);
        setUserId(null);
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
              plan: (profile.subscription_plan as import("./types").PlanTier) || "essentiel",
              businessType: profile.business_type || undefined,
              setupCompleted: profile.setup_completed !== false,
              onboardingData: profile.onboarding_data || undefined,
            });
            setHasOnboarded(true);
            await loadUserData(uid);
          }
          // If profile doesn't exist or not onboarded, user stays on onboarding
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setInitError(true);
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

  // Dismiss splash: wait for BOTH hydration AND minimum animation time (2700ms)
  // Multi-layer reveal (kicker → logo → meta → footer) + exit — total ~2500ms
  const [splashMinDone, setSplashMinDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSplashMinDone(true), 2700); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (isHydrated && splashMinDone) {
      const timer = setTimeout(() => setShowSplash(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, splashMinDone]);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "loyalty_templates", filter: `user_id=eq.${userId}` },
        (p) => {
          if (p.eventType === "INSERT") setLoyaltyTemplates((prev) => prev.find((t) => t.id === p.new.id) ? prev : [...prev, rowToLoyaltyTemplate(p.new)]);
          if (p.eventType === "UPDATE") setLoyaltyTemplates((prev) => prev.map((t) => t.id === p.new.id ? rowToLoyaltyTemplate(p.new) : t));
          if (p.eventType === "DELETE") setLoyaltyTemplates((prev) => prev.filter((t) => t.id !== p.old.id));
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "loyalty_cards", filter: `user_id=eq.${userId}` },
        (p) => {
          if (p.eventType === "INSERT") setLoyaltyCards((prev) => prev.find((c) => c.id === p.new.id) ? prev : [rowToLoyaltyCard(p.new), ...prev]);
          if (p.eventType === "UPDATE") setLoyaltyCards((prev) => prev.map((c) => c.id === p.new.id ? rowToLoyaltyCard(p.new) : c));
          if (p.eventType === "DELETE") setLoyaltyCards((prev) => prev.filter((c) => c.id !== p.old.id));
        })
      // Live-sync the current user's own profile. Used so that when an admin
      // flips beta_status or subscription_plan from elsewhere, the pro's UI
      // updates without a manual reload.
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "user_profiles", filter: `id=eq.${userId}` },
        (p) => {
          const row = p.new as Record<string, unknown>;
          const nextBeta = (row.beta_status as import("./types").BetaStatus) ?? undefined;
          if (nextBeta && userId) {
            try { localStorage.setItem(`beta-status-cache:${userId}`, nextBeta); } catch {}
          }
          setUser((prev) => ({
            ...prev,
            name: (row.name as string) ?? prev.name,
            business: (row.business as string) ?? prev.business,
            phone: (row.phone as string) ?? prev.phone,
            email: (row.email as string) ?? prev.email,
            bookingSlug: (row.booking_slug as string) ?? prev.bookingSlug,
            plan: (row.subscription_plan as import("./types").PlanTier) ?? prev.plan,
            betaStatus: nextBeta ?? prev.betaStatus,
            chatEnabled: row.chat_enabled === undefined ? prev.chatEnabled : row.chat_enabled !== false,
          }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Profile refetch helper + focus fallback ───────────
  // Realtime is the primary sync path, but channels can drop (tab suspended,
  // network blip). On tab focus / visibility, also re-pull the profile so
  // any admin-driven state change (beta_status, plan, ...) is picked up.
  const refreshUserProfile = useCallback(async () => {
    if (!userId || isDemo) return;
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) return;
    const nextBeta = (data.beta_status as import("./types").BetaStatus) ?? undefined;
    if (nextBeta && userId) {
      try { localStorage.setItem(`beta-status-cache:${userId}`, nextBeta); } catch {}
    }
    setUser((prev) => ({
      ...prev,
      name: data.name ?? prev.name,
      business: data.business ?? prev.business,
      phone: data.phone ?? prev.phone,
      email: data.email ?? prev.email,
      bookingSlug: data.booking_slug ?? prev.bookingSlug,
      plan: (data.subscription_plan as import("./types").PlanTier) ?? prev.plan,
      betaStatus: nextBeta ?? prev.betaStatus,
      chatEnabled: data.chat_enabled === undefined ? prev.chatEnabled : data.chat_enabled !== false,
    }));
  }, [userId, isDemo]);

  useEffect(() => {
    if (!userId || isDemo) return;
    const handler = () => {
      if (document.visibilityState === "visible") void refreshUserProfile();
    };
    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [userId, isDemo, refreshUserProfile]);

  // ═══ AUTH ACTIONS ══════════════════════════════════════

  /** Called after successful signup/login. Loads profile + data, sets session. */
  const completeAuth = useCallback(async (uid: string, acctType: AccountType) => {
    // If the user was in demo mode, wipe demo state FIRST so Marie's data
    // doesn't linger while the real profile is being fetched.
    setIsDemo(false);
    clearAllData();
    try { localStorage.removeItem("demo-mode"); } catch {}

    setUserId(uid);
    localStorage.setItem("account-type", acctType);

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (profile) {
      const resolvedBetaStatus = (profile.beta_status as import("./types").BetaStatus) || "none";
      setUser({
        name: profile.name || "",
        business: profile.business || "",
        phone: profile.phone || "",
        email: profile.email || "",
        bookingSlug: profile.booking_slug || undefined,
        accountType: acctType,
        plan: (profile.subscription_plan as import("./types").PlanTier) || "essentiel",
        betaStatus: resolvedBetaStatus,
        chatEnabled: profile.chat_enabled === false ? false : true,
        businessType: profile.business_type || undefined,
        setupCompleted: profile.setup_completed !== false, // default true when column missing
        onboardingData: profile.onboarding_data || undefined,
      });

      // Cache beta status per-user so the profile page can render the
      // correct card (subscription vs beta access) on next app load
      // without waiting for the Supabase round-trip.
      try {
        localStorage.setItem(`beta-status-cache:${uid}`, resolvedBetaStatus);
      } catch {}
    }

    await loadUserData(uid);
    setHasOnboarded(true);
  }, [loadUserData, clearAllData]);

  /** Start a demo session — in-memory only, NEVER touches DB.
   *  Client demo gets realistic sample data so the app feels alive.
   *  Real accounts NEVER receive any of this data (it only runs here). */
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

    // ── Pro demo: rich realistic dataset so the value is instant ──
    if (acctType === "pro") {
      const pastDate = (daysAgo: number) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split("T")[0];
      };
      const futureDate = (daysAhead: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split("T")[0];
      };
      const todayStr = new Date().toISOString().split("T")[0];

      // Clients
      const demoClients: Client[] = [
        { id: "dc1", firstName: "Sophie", lastName: "Martin", phone: "+33 6 12 34 56 78", email: "sophie.martin@demo.com", notes: "Cliente reguliere, prefere les matinees", createdAt: pastDate(120), avatar: "#8B5CF6" },
        { id: "dc2", firstName: "Lucas", lastName: "Bernard", phone: "+33 6 23 45 67 89", email: "lucas.bernard@demo.com", notes: "A recommande deux amis", createdAt: pastDate(95), avatar: "#3B82F6" },
        { id: "dc3", firstName: "Emma", lastName: "Dubois", phone: "+33 6 34 56 78 90", email: "emma.dubois@demo.com", notes: "Allergie parfums", createdAt: pastDate(82), avatar: "#EC4899" },
        { id: "dc4", firstName: "Hugo", lastName: "Moreau", phone: "+33 6 45 67 89 01", email: "hugo.moreau@demo.com", notes: "", createdAt: pastDate(60), avatar: "#10B981" },
        { id: "dc5", firstName: "Chloe", lastName: "Laurent", phone: "+33 6 56 78 90 12", email: "chloe.laurent@demo.com", notes: "Anniversaire en mars", createdAt: pastDate(45), avatar: "#F59E0B" },
        { id: "dc6", firstName: "Thomas", lastName: "Petit", phone: "+33 6 67 89 01 23", email: "thomas.petit@demo.com", notes: "Nouveau", createdAt: pastDate(28), avatar: "#0EA5E9" },
        { id: "dc7", firstName: "Camille", lastName: "Robert", phone: "+33 6 78 90 12 34", email: "camille.robert@demo.com", notes: "Forfait trimestriel", createdAt: pastDate(15), avatar: "#A78BFA" },
        { id: "dc8", firstName: "Leo", lastName: "Garcia", phone: "+33 6 89 01 23 45", email: "leo.garcia@demo.com", notes: "", createdAt: pastDate(7), avatar: "#F472B6" },
      ];
      setClients(demoClients);

      // Services
      const demoServices: Service[] = [
        { id: "ds1", name: "Consultation decouverte", duration: 45, price: 55, description: "Premiere seance de diagnostic personnalise", active: true },
        { id: "ds2", name: "Seance complete", duration: 60, price: 75, description: "Seance standard sur mesure", active: true },
        { id: "ds3", name: "Seance approfondie", duration: 90, price: 110, description: "Suivi avance avec bilan", active: true },
        { id: "ds4", name: "Pack 5 seances", duration: 60, price: 340, description: "Forfait degressif", active: true },
      ];
      setServices(demoServices);

      // Products / stock
      const demoProducts: Product[] = [
        { id: "dp1", name: "Huile essentielle lavande", quantity: 12, minQuantity: 5, price: 18, category: "Soins", emoji: "🌿" },
        { id: "dp2", name: "Serum hydratant premium", quantity: 4, minQuantity: 5, price: 42, category: "Soins", emoji: "💧" },
        { id: "dp3", name: "Bougie parfumee", quantity: 22, minQuantity: 8, price: 24, category: "Boutique", emoji: "🕯️" },
        { id: "dp4", name: "Tisane detox (20 sachets)", quantity: 9, minQuantity: 6, price: 15, category: "Boutique", emoji: "🍵" },
      ];
      setProducts(demoProducts);

      // Appointments — mix of past done and upcoming confirmed
      const demoAppts: Appointment[] = [
        // Today
        { id: "da1", clientId: "dc1", title: "Seance complete", date: todayStr, time: "10:00", duration: 60, status: "confirmed", price: 75, notes: "" },
        { id: "da2", clientId: "dc3", title: "Consultation decouverte", date: todayStr, time: "14:30", duration: 45, status: "confirmed", price: 55, notes: "" },
        // Upcoming
        { id: "da3", clientId: "dc5", title: "Seance approfondie", date: futureDate(1), time: "11:00", duration: 90, status: "confirmed", price: 110, notes: "" },
        { id: "da4", clientId: "dc2", title: "Seance complete", date: futureDate(2), time: "15:00", duration: 60, status: "confirmed", price: 75, notes: "" },
        { id: "da5", clientId: "dc7", title: "Seance complete", date: futureDate(3), time: "09:30", duration: 60, status: "confirmed", price: 75, notes: "" },
        { id: "da6", clientId: "dc8", title: "Consultation decouverte", date: futureDate(5), time: "16:00", duration: 45, status: "confirmed", price: 55, notes: "" },
        // Past done (this month)
        { id: "da7", clientId: "dc1", title: "Seance complete", date: pastDate(2), time: "10:00", duration: 60, status: "done", price: 75, notes: "" },
        { id: "da8", clientId: "dc2", title: "Seance approfondie", date: pastDate(4), time: "14:00", duration: 90, status: "done", price: 110, notes: "" },
        { id: "da9", clientId: "dc4", title: "Seance complete", date: pastDate(5), time: "11:00", duration: 60, status: "done", price: 75, notes: "" },
        { id: "da10", clientId: "dc6", title: "Consultation decouverte", date: pastDate(6), time: "15:30", duration: 45, status: "done", price: 55, notes: "" },
        { id: "da11", clientId: "dc3", title: "Seance complete", date: pastDate(8), time: "09:00", duration: 60, status: "done", price: 75, notes: "" },
        { id: "da12", clientId: "dc5", title: "Pack 5 seances", date: pastDate(10), time: "13:00", duration: 60, status: "done", price: 340, notes: "1/5" },
        { id: "da13", clientId: "dc7", title: "Seance complete", date: pastDate(12), time: "16:00", duration: 60, status: "done", price: 75, notes: "" },
        { id: "da14", clientId: "dc2", title: "Seance complete", date: pastDate(14), time: "10:30", duration: 60, status: "done", price: 75, notes: "" },
        { id: "da15", clientId: "dc4", title: "Seance approfondie", date: pastDate(17), time: "14:00", duration: 90, status: "done", price: 110, notes: "" },
        { id: "da16", clientId: "dc1", title: "Seance complete", date: pastDate(20), time: "11:00", duration: 60, status: "done", price: 75, notes: "" },
        { id: "da17", clientId: "dc6", title: "Seance complete", date: pastDate(22), time: "15:00", duration: 60, status: "done", price: 75, notes: "" },
        { id: "da18", clientId: "dc3", title: "Consultation decouverte", date: pastDate(25), time: "09:30", duration: 45, status: "done", price: 55, notes: "" },
      ];
      setAppointments(demoAppts);

      // Invoices — paid for done appointments + a couple pending + one expense
      const demoInvoices: Invoice[] = [
        { id: "di1", clientId: "dc1", appointmentId: "da7", amount: 75, status: "paid", date: pastDate(2), description: "Seance complete" },
        { id: "di2", clientId: "dc2", appointmentId: "da8", amount: 110, status: "paid", date: pastDate(4), description: "Seance approfondie" },
        { id: "di3", clientId: "dc4", appointmentId: "da9", amount: 75, status: "paid", date: pastDate(5), description: "Seance complete" },
        { id: "di4", clientId: "dc6", appointmentId: "da10", amount: 55, status: "paid", date: pastDate(6), description: "Consultation decouverte" },
        { id: "di5", clientId: "dc3", appointmentId: "da11", amount: 75, status: "paid", date: pastDate(8), description: "Seance complete" },
        { id: "di6", clientId: "dc5", appointmentId: "da12", amount: 340, status: "paid", date: pastDate(10), description: "Pack 5 seances" },
        { id: "di7", clientId: "dc7", appointmentId: "da13", amount: 75, status: "paid", date: pastDate(12), description: "Seance complete" },
        { id: "di8", clientId: "dc2", appointmentId: "da14", amount: 75, status: "paid", date: pastDate(14), description: "Seance complete" },
        { id: "di9", clientId: "dc4", appointmentId: "da15", amount: 110, status: "paid", date: pastDate(17), description: "Seance approfondie" },
        { id: "di10", clientId: "dc1", appointmentId: "da16", amount: 75, status: "paid", date: pastDate(20), description: "Seance complete" },
        { id: "di11", clientId: "dc6", appointmentId: "da17", amount: 75, status: "paid", date: pastDate(22), description: "Seance complete" },
        { id: "di12", clientId: "dc3", appointmentId: "da18", amount: 55, status: "paid", date: pastDate(25), description: "Consultation decouverte" },
        // Pending
        { id: "di13", clientId: "dc8", amount: 55, status: "pending", date: pastDate(1), description: "Consultation decouverte" },
        { id: "di14", clientId: "dc7", amount: 75, status: "pending", date: pastDate(3), description: "Seance complete" },
        // Expense
        { id: "di15", clientId: "__expense__", amount: 120, status: "paid", date: pastDate(9), description: "Fournitures cabinet" },
      ];
      setInvoices(demoInvoices);

      // Loyalty — one active program with a few cards
      const demoTpl: LoyaltyTemplate = {
        id: "dlt1",
        name: "Fidelite Seances",
        color: "#8B5CF6",
        emoji: "💎",
        mode: "visits",
        goal: 10,
        reward: "1 seance offerte",
        message: "Merci pour votre fidelite !",
      };
      setLoyaltyTemplates([demoTpl]);
      setLoyaltyCards([
        { id: "dlc1", templateId: "dlt1", clientId: "dc1", code: "SOPH-8X4K", progress: 7, createdAt: pastDate(60) },
        { id: "dlc2", templateId: "dlt1", clientId: "dc2", code: "LUCA-3M9P", progress: 4, createdAt: pastDate(40) },
        { id: "dlc3", templateId: "dlt1", clientId: "dc5", code: "CHLO-7N2Q", progress: 9, createdAt: pastDate(30) },
      ]);
    }

    // ── Client demo: seed realistic sample data ─────────
    if (acctType === "client") {
      const pastDate = (daysAgo: number) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split("T")[0];
      };

      // 1 loyalty template + 1 card with partial progress (6/10 visits)
      const demoTemplate: LoyaltyTemplate = {
        id: "lt_demo_cafe",
        name: "Cafe Lumiere",
        color: "#8B5CF6",
        emoji: "☕",
        mode: "visits",
        goal: 10,
        reward: "1 boisson offerte",
        message: "Merci de votre fidelite !",
      };
      setLoyaltyTemplates([demoTemplate]);

      const demoCard: LoyaltyCard = {
        id: "lc_demo_cafe",
        templateId: "lt_demo_cafe",
        clientId: "demo_client_01",
        code: "CAFE-DEMO01",
        progress: 6,
        createdAt: pastDate(45),
      };
      setLoyaltyCards([demoCard]);

      // Helper for future dates
      const futureDate = (daysAhead: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split("T")[0];
      };

      // 1 upcoming + 2 past appointments (+ matching paid invoices for past ones)
      const demoAppointments: Appointment[] = [
        {
          id: "appt_demo_future",
          clientId: "demo_client_01",
          title: "Consultation bien-etre",
          date: futureDate(5),
          time: "11:00",
          duration: 60,
          status: "confirmed",
          price: 70,
          notes: "avec Marie Dupont",
        },
        {
          id: "appt_demo_01",
          clientId: "demo_client_01",
          title: "Massage relaxant",
          date: pastDate(12),
          time: "14:00",
          duration: 60,
          status: "done",
          price: 65,
          notes: "avec Marie Dupont",
        },
        {
          id: "appt_demo_02",
          clientId: "demo_client_01",
          title: "Coupe & Coloration",
          date: pastDate(28),
          time: "10:30",
          duration: 90,
          status: "done",
          price: 85,
          notes: "avec Sophie Laurent",
        },
      ];
      setAppointments(demoAppointments);

      const demoInvoices: Invoice[] = [
        {
          id: "inv_demo_01",
          clientId: "demo_client_01",
          appointmentId: "appt_demo_01",
          amount: 65,
          status: "paid",
          date: pastDate(12),
          description: "Massage relaxant",
        },
        {
          id: "inv_demo_02",
          clientId: "demo_client_01",
          appointmentId: "appt_demo_02",
          amount: 85,
          status: "paid",
          date: pastDate(28),
          description: "Coupe & Coloration",
        },
      ];
      setInvoices(demoInvoices);
    }

    setHasOnboarded(true);
  }, []);

  /** Full logout — clears everything, calls Supabase signOut */
  const logout = useCallback(() => {
    setHasOnboarded(false);
    setUser({ name: "", business: "", phone: "", email: "" });
    clearAllData();
    setIsDemo(false);
    setUserId(null);

    // Clear ALL per-user localStorage keys (not just the 3 most obvious).
    // Without this, a second user on the same device would see the previous
    // user's milestone markers, group messages history, etc.
    const perUserKeys = [
      "account-type", "demo-mode", "user-profile-cache",
      "automated_messages", "chat_index", "group_messages_history",
      "invoice_config", "lumiere-session", "notif_admin",
      "profile_visibility_config", "review_request_sent",
      "setup-banner-dismissed", "weekly_recap_last",
      "milestones_seen", "availability_exceptions", "booking_rules",
      "external-payment-link", "push_preferences",
    ];
    for (const k of perUserKeys) {
      try { localStorage.removeItem(k); } catch {}
    }
    // Also purge any prefix-keyed entries (services meta, beta-status cache)
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith("services_meta_") || k.startsWith("beta-status-cache:")) {
          localStorage.removeItem(k);
        }
      }
    } catch {}

    // Clear Supabase settings cache so the next login fetches fresh data
    try {
      import("./user-settings").then((m) => m.clearSettingsCache?.());
    } catch {}

    // Sign out from Supabase Auth (async, fire-and-forget)
    supabase.auth.signOut().catch(() => {});
  }, [clearAllData]);

  // ═══ USER PROFILE ═════════════════════════════════════

  const updateUser = useCallback(
    (u: Partial<UserProfile>) => {
      setUser((prev) => ({ ...prev, ...u }));
      if (!userId || isDemo) return;

      // SAFETY: split writes. Core profile fields are known to exist and
      // are written together. Optional `plan` is written in a SEPARATE
      // request so a missing `subscription_plan` column cannot invalidate
      // name/email/phone updates (atomic UPDATE is all-or-nothing).
      const coreFields: Record<string, unknown> = {};
      if (u.name !== undefined) coreFields.name = u.name;
      if (u.business !== undefined) coreFields.business = u.business;
      if (u.phone !== undefined) coreFields.phone = u.phone;
      if (u.email !== undefined) coreFields.email = u.email;
      if (u.bookingSlug !== undefined) coreFields.booking_slug = u.bookingSlug;

      if (Object.keys(coreFields).length > 0) {
        supabase
          .from("user_profiles")
          .update(coreFields)
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.error("[updateUser] core update error:", error);
          });
      }

      if (u.plan !== undefined) {
        supabase
          .from("user_profiles")
          .update({ subscription_plan: u.plan })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.error("[updateUser] plan update error (column may not exist):", error);
          });
      }

      if (u.betaStatus !== undefined) {
        supabase
          .from("user_profiles")
          .update({ beta_status: u.betaStatus })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.warn("[updateUser] beta_status update error (column may not exist):", error);
          });
      }

      if (u.chatEnabled !== undefined) {
        supabase
          .from("user_profiles")
          .update({ chat_enabled: u.chatEnabled })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.warn("[updateUser] chat_enabled update error (column may not exist):", error);
          });
      }
    },
    [userId, isDemo]
  );

  // ═══ ONBOARDING ════════════════════════════════════════
  // Persist a partial onboarding snapshot. Safe-guards each column behind
  // its own update so a missing column (pre-migration) can't kill the
  // rest of the writes. Local state is always updated immediately.
  const saveOnboardingStep = useCallback(
    (data: Partial<import("./types").OnboardingData>, opts?: { completed?: boolean; businessType?: string; phone?: string }) => {
      setUser((prev) => {
        const merged: import("./types").OnboardingData = { ...(prev.onboardingData || {}), ...data };
        return {
          ...prev,
          onboardingData: merged,
          setupCompleted: opts?.completed ?? prev.setupCompleted,
          businessType: opts?.businessType ?? prev.businessType,
          phone: opts?.phone ?? prev.phone,
        };
      });

      // Mirror to localStorage so reload preserves progress even
      // if the DB columns aren't present yet.
      try {
        const key = `onboarding-progress-${userId || "anon"}`;
        const existing = JSON.parse(localStorage.getItem(key) || "{}");
        localStorage.setItem(
          key,
          JSON.stringify({
            ...existing,
            ...data,
            ...(opts?.completed !== undefined ? { setupCompleted: opts.completed } : {}),
          })
        );
      } catch {}

      if (!userId || isDemo) return;

      // Each column is written separately so a missing column never
      // rolls back the others. All failures are warnings only.
      supabase
        .from("user_profiles")
        .update({ onboarding_data: { ...(user.onboardingData || {}), ...data } })
        .eq("id", userId)
        .then(({ error }) => {
          if (error) console.warn("[onboarding] onboarding_data update skipped:", error.message);
        });

      if (opts?.completed !== undefined) {
        supabase
          .from("user_profiles")
          .update({ setup_completed: opts.completed })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.warn("[onboarding] setup_completed update skipped:", error.message);
          });
      }
      if (opts?.businessType !== undefined) {
        supabase
          .from("user_profiles")
          .update({ business_type: opts.businessType })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.warn("[onboarding] business_type update skipped:", error.message);
          });
      }
      if (opts?.phone !== undefined) {
        supabase
          .from("user_profiles")
          .update({ phone: opts.phone })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.warn("[onboarding] phone update error:", error.message);
          });
      }
    },
    [userId, isDemo, user]
  );

  // ═══ CLIENTS ══════════════════════════════════════════

  const addClient = useCallback(
    async (c: Omit<Client, "id" | "createdAt" | "avatar">) => {
      if (!userId) return;
      // Use functional update to get current length without adding it to deps
      let avatarColor = avatarColors[0];
      setClients((prev) => { avatarColor = avatarColors[prev.length % avatarColors.length]; return prev; });
      const { data } = await supabase.from("clients")
        .insert({ user_id: userId, first_name: c.firstName, last_name: c.lastName, phone: c.phone, email: c.email, notes: c.notes, avatar: avatarColor })
        .select().single();
      if (data) setClients((prev) => [rowToClient(data), ...prev]);
    }, [userId]
  );

  const updateClient = useCallback((id: string, c: Partial<Client>) => {
    let snapshot: Client[] = [];
    setClients((prev) => { snapshot = prev; return prev.map((x) => (x.id === id ? { ...x, ...c } : x)); });
    const dbFields: Record<string, unknown> = {};
    if (c.firstName !== undefined) dbFields.first_name = c.firstName;
    if (c.lastName !== undefined) dbFields.last_name = c.lastName;
    if (c.phone !== undefined) dbFields.phone = c.phone;
    if (c.email !== undefined) dbFields.email = c.email;
    if (c.notes !== undefined) dbFields.notes = c.notes;
    if (c.avatar !== undefined) dbFields.avatar = c.avatar;
    supabase.from("clients").update(dbFields).eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] clients.update failed:", res.error.message); setClients(snapshot); }
    });
  }, []);

  const deleteClient = useCallback((id: string) => {
    let snapshot: Client[] = [];
    setClients((prev) => { snapshot = prev; return prev.filter((x) => x.id !== id); });
    supabase.from("clients").delete().eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] clients.delete failed:", res.error.message); setClients(snapshot); }
    });
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
    let snapshot: Appointment[] = [];
    setAppointments((prev) => { snapshot = prev; return prev.map((x) => (x.id === id ? { ...x, ...a } : x)); });
    const f: Record<string, unknown> = {};
    if (a.clientId !== undefined) f.client_id = a.clientId || null;
    if (a.title !== undefined) f.title = a.title;
    if (a.date !== undefined) f.date = a.date;
    if (a.time !== undefined) f.time = a.time;
    if (a.duration !== undefined) f.duration = a.duration;
    if (a.status !== undefined) f.status = a.status;
    if (a.price !== undefined) f.price = a.price;
    if (a.notes !== undefined) f.notes = a.notes;
    supabase.from("appointments").update(f).eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] appointments.update failed:", res.error.message); setAppointments(snapshot); }
    });
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    let snapshot: Appointment[] = [];
    setAppointments((prev) => { snapshot = prev; return prev.filter((x) => x.id !== id); });
    supabase.from("appointments").delete().eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] appointments.delete failed:", res.error.message); setAppointments(snapshot); }
    });
  }, []);

  const setAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    let snapshot: Appointment[] = [];
    let previous: Appointment | undefined;
    setAppointments((prev) => {
      snapshot = prev;
      previous = prev.find((x) => x.id === id);
      return prev.map((x) => (x.id === id ? { ...x, status } : x));
    });
    supabase.from("appointments").update({ status }).eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] appointments.setStatus failed:", res.error.message); setAppointments(snapshot); }
    });

    // Haptic feedback on status change
    try {
      if (status === "done") navigator?.vibrate?.([8, 50, 8]);
      else if (status === "canceled") navigator?.vibrate?.([20, 40, 20, 40, 20]);
      else navigator?.vibrate?.(8);
    } catch { /* ignore */ }

    // ── Auto review request on transition to "done" ──────
    if (status === "done" && previous && previous.status !== "done") {
      void fireReviewRequestEmail(id, previous, clients, user);
    }

    // ── Auto cancellation email on transition to "canceled" ──
    if (status === "canceled" && previous && previous.status !== "canceled") {
      void fireCancellationEmail(previous, clients, user);
    }
  }, [clients, user]);

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

    // Generate sequential invoice number (FA-YYYY-NNNN).
    // Read current counter, compute next, then persist atomically.
    let invoiceNumber: string | undefined;
    try {
      const { data: counterRow } = await supabase
        .from("user_profiles")
        .select("invoice_counter")
        .eq("id", userId)
        .single();
      const current = (counterRow?.invoice_counter as number) || 0;
      const next = current + 1;
      const year = new Date(i.date).getFullYear();
      invoiceNumber = `FA-${year}-${String(next).padStart(4, "0")}`;
      void supabase.from("user_profiles").update({ invoice_counter: next }).eq("id", userId);
    } catch {
      console.warn("[invoice] numbering failed, creating without number");
    }

    const row: Record<string, unknown> = {
      user_id: userId, client_id: i.clientId || null, appointment_id: i.appointmentId || null,
      amount: i.amount, status: i.status, date: i.date, description: i.description, items: i.items || [],
    };
    if (invoiceNumber) row.invoice_number = invoiceNumber;

    const { data } = await supabase.from("invoices").insert(row).select().single();
    if (data) setInvoices((prev) => [rowToInvoice(data), ...prev]);
  }, [userId]);

  const setInvoiceStatus = useCallback((id: string, status: PaymentStatus) => {
    let snapshot: Invoice[] = [];
    setInvoices((prev) => { snapshot = prev; return prev.map((x) => (x.id === id ? { ...x, status } : x)); });
    supabase.from("invoices").update({ status }).eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] invoices.setStatus failed:", res.error.message); setInvoices(snapshot); }
    });
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
    let snapshot: Product[] = [];
    setProducts((prev) => { snapshot = prev; return prev.map((x) => (x.id === id ? { ...x, ...p } : x)); });
    const f: Record<string, unknown> = {};
    if (p.name !== undefined) f.name = p.name;
    if (p.quantity !== undefined) f.quantity = p.quantity;
    if (p.minQuantity !== undefined) f.min_quantity = p.minQuantity;
    if (p.price !== undefined) f.price = p.price;
    if (p.category !== undefined) f.category = p.category;
    if (p.emoji !== undefined) f.emoji = p.emoji;
    supabase.from("products").update(f).eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] products.update failed:", res.error.message); setProducts(snapshot); }
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    let snapshot: Product[] = [];
    setProducts((prev) => { snapshot = prev; return prev.filter((x) => x.id !== id); });
    supabase.from("products").delete().eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] products.delete failed:", res.error.message); setProducts(snapshot); }
    });
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
    let snapshot: Service[] = [];
    setServices((prev) => { snapshot = prev; return prev.map((x) => (x.id === id ? { ...x, ...s } : x)); });
    const f: Record<string, unknown> = {};
    if (s.name !== undefined) f.name = s.name;
    if (s.duration !== undefined) f.duration = s.duration;
    if (s.price !== undefined) f.price = s.price;
    if (s.description !== undefined) f.description = s.description;
    if (s.active !== undefined) f.active = s.active;
    supabase.from("services").update(f).eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] services.update failed:", res.error.message); setServices(snapshot); }
    });
  }, []);

  const deleteService = useCallback((id: string) => {
    let snapshot: Service[] = [];
    setServices((prev) => { snapshot = prev; return prev.filter((x) => x.id !== id); });
    supabase.from("services").delete().eq("id", id).then((res) => {
      if (res.error) { console.error("[supabase] services.delete failed:", res.error.message); setServices(snapshot); }
    });
  }, []);

  // ═══ LOYALTY (Supabase-backed) ═════════════════════════

  const addLoyaltyTemplate = useCallback(async (t: Omit<LoyaltyTemplate, "id">) => {
    if (!userId) return;
    const { data, error } = await supabase.from("loyalty_templates")
      .insert({ user_id: userId, name: t.name, color: t.color, emoji: t.emoji, mode: t.mode, goal: t.goal, reward: t.reward, message: t.message })
      .select().single();
    if (error) { console.error("[supabase] loyalty_templates.insert failed:", error.message); return; }
    if (data) setLoyaltyTemplates((prev) => [...prev, rowToLoyaltyTemplate(data)]);
  }, [userId]);

  const deleteLoyaltyTemplate = useCallback((id: string) => {
    const snapshot = loyaltyTemplates;
    setLoyaltyTemplates((prev) => prev.filter((x) => x.id !== id));
    supabase.from("loyalty_templates").delete().eq("id", id).then((res) => {
      if (res.error) {
        console.error("[supabase] loyalty_templates.delete failed:", res.error.message);
        setLoyaltyTemplates(snapshot);
      }
    });
  }, [loyaltyTemplates]);

  const addLoyaltyCard = useCallback(async (c: Omit<LoyaltyCard, "id" | "createdAt">) => {
    if (!userId) return;
    const { data, error } = await supabase.from("loyalty_cards")
      .insert({ user_id: userId, template_id: c.templateId, client_id: c.clientId || null, code: c.code, progress: c.progress })
      .select().single();
    if (error) { console.error("[supabase] loyalty_cards.insert failed:", error.message); return; }
    if (data) setLoyaltyCards((prev) => [rowToLoyaltyCard(data), ...prev]);
  }, [userId]);

  const updateLoyaltyCard = useCallback((id: string, c: Partial<LoyaltyCard>) => {
    const snapshot = loyaltyCards;
    setLoyaltyCards((prev) => prev.map((x) => x.id === id ? { ...x, ...c } : x));
    const f: Record<string, unknown> = {};
    if (c.templateId !== undefined) f.template_id = c.templateId;
    if (c.clientId !== undefined) f.client_id = c.clientId || null;
    if (c.code !== undefined) f.code = c.code;
    if (c.progress !== undefined) f.progress = c.progress;
    supabase.from("loyalty_cards").update(f).eq("id", id).then((res) => {
      if (res.error) {
        console.error("[supabase] loyalty_cards.update failed:", res.error.message);
        setLoyaltyCards(snapshot);
      }
    });
  }, [loyaltyCards]);

  const deleteLoyaltyCard = useCallback((id: string) => {
    const snapshot = loyaltyCards;
    setLoyaltyCards((prev) => prev.filter((x) => x.id !== id));
    supabase.from("loyalty_cards").delete().eq("id", id).then((res) => {
      if (res.error) {
        console.error("[supabase] loyalty_cards.delete failed:", res.error.message);
        setLoyaltyCards(snapshot);
      }
    });
  }, [loyaltyCards]);

  const getLoyaltyCardByCode = useCallback((code: string) => loyaltyCards.find((c) => c.code === code), [loyaltyCards]);

  // ═══ MEMOIZED CONTEXT VALUE ════════════════════════════
  // Prevents ALL useApp() consumers from re-rendering when
  // the AppProvider re-renders for unrelated reasons.
  const contextValue = useMemo<AppState>(() => ({
    hasOnboarded, isHydrated, isDemo, userId, user, updateUser, refreshUserProfile, saveOnboardingStep,
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
  }), [
    hasOnboarded, isHydrated, isDemo, userId, user, updateUser, refreshUserProfile, saveOnboardingStep,
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
  ]);

  if (showSplash) return <SplashScreen />;

  // Network error screen with retry
  if (initError) {
    return (
      <div className="h-full h-[100dvh] flex flex-col items-center justify-center bg-background px-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-danger-soft flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-danger">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-foreground mb-1">Connexion impossible</h2>
        <p className="text-[13px] text-muted mb-6 leading-relaxed">Impossible de se connecter au serveur. Verifiez votre connexion internet.</p>
        <button onClick={() => { setInitError(false); setIsHydrated(false); window.location.reload(); }}
          className="bg-accent text-white px-6 py-3 rounded-2xl text-[14px] font-bold">
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
