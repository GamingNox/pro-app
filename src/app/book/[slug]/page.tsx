"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Clock, CalendarDays, Check, User, Mail,
  Phone, Shield, Sparkles, CheckCircle2, MapPin, CreditCard, Zap,
  Lock, Eye, EyeOff, UserPlus, LogIn, AlertTriangle, Briefcase,
} from "lucide-react";

interface PublicService { id: string; name: string; duration: number; price: number; description: string; }
interface ProProfile { id: string; name: string; business: string; }
interface BookingRulesConfig {
  cancelLimit?: string;
  cancelMessage?: string;
  minDelay?: string;
  maxDays?: string;
  requirePhone?: boolean;
  requireEmail?: boolean;
  customInstructions?: string;
}

interface AvailabilityException {
  id: string;
  startDate: string;
  endDate?: string;
  label: string;
  message: string;
}

// Step 0 = auth choice, 1-4 = booking flow, 5 = confirmation
type Step = 0 | 1 | 2 | 3 | 4 | 5;
type BookingMode = "auth" | "guest" | null;

const DAYS_SHORT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [step, setStep] = useState<Step>(0);
  const [mode, setMode] = useState<BookingMode>(null);
  const [booking, setBooking] = useState(false);
  const [bookingRules, setBookingRules] = useState<BookingRulesConfig>({});
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);

  // Auth form state
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Booking form state
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [takenTimes, setTakenTimes] = useState<string[]>([]);
  const [clientFirst, setClientFirst] = useState("");
  const [clientLast, setClientLast] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNote, setClientNote] = useState("");

  // Waiting list state
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistSending, setWaitlistSending] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

  // Post-booking conversion
  const [showConvert, setShowConvert] = useState(false);
  const [convertName, setConvertName] = useState("");
  const [convertEmail, setConvertEmail] = useState("");
  const [convertPassword, setConvertPassword] = useState("");
  const [converted, setConverted] = useState(false);

  useEffect(() => {
    async function load() {
      // Use SECURITY DEFINER RPC so the anon booking page can fetch
      // the pro profile + active services without open RLS on user_profiles.
      const { data, error: rpcError } = await supabase.rpc("public_get_booking_page", { p_slug: slug });
      if (rpcError || !data || (data as { error?: string }).error) {
        setError(true); setLoading(false); return;
      }
      const payload = data as { profile: { id: string; name: string; business: string }; services: PublicService[] };
      setProfile(payload.profile);
      setServices(payload.services || []);

      // Fetch booking config (rules + exceptions) via public RPC
      try {
        const { data: cfgData } = await supabase.rpc("public_get_booking_config", { p_slug: slug });
        if (cfgData) {
          const cfg = cfgData as { booking_rules?: BookingRulesConfig; availability_exceptions?: AvailabilityException[] };
          if (cfg.booking_rules) setBookingRules(cfg.booking_rules);
          if (Array.isArray(cfg.availability_exceptions)) setExceptions(cfg.availability_exceptions);
        }
      } catch { /* ignore — booking still works without rules */ }

      setLoading(false);

      // Check if user is already logged in as a client
      const session = localStorage.getItem("lumiere-session");
      const acctType = localStorage.getItem("account-type");
      if (session && acctType === "client") {
        try {
          const s = JSON.parse(session);
          if (s.name && s.email) {
            setIsAuthenticated(true);
            setClientFirst(s.name.split(" ")[0] || s.name);
            setClientLast(s.name.split(" ").slice(1).join(" "));
            setClientEmail(s.email);
            setMode("auth");
            setStep(1);
          }
        } catch { /* ignore */ }
      }
    }
    load();
  }, [slug]);

  // Fetch taken slots whenever the selected date changes
  useEffect(() => {
    if (!selectedDate) {
      setTakenTimes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("public_get_taken_slots", {
        p_slug: slug,
        p_date: selectedDate,
      });
      if (cancelled) return;
      if (Array.isArray(data)) {
        setTakenTimes(data as string[]);
      } else {
        setTakenTimes([]);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, selectedDate]);

  // Reset selectedTime if it became unavailable after taken slots reloaded
  useEffect(() => {
    if (selectedTime && takenTimes.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [takenTimes, selectedTime]);

  const service = services.find((s) => s.id === selectedService);
  const totalSteps = mode === "guest" ? 5 : 4;
  const progress = step === 0 ? 0 : (step / totalSteps) * 100;

  // Generate dates (next 14 days)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return d;
  });

  const morningSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  const afternoonSlots = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

  // ── Handle login for booking ───────────────────────────
  function handleAuthLogin() {
    if (!authEmail.trim()) return;
    // Simulate auth — store session and pre-fill
    const name = authName.trim() || authEmail.split("@")[0];
    localStorage.setItem("lumiere-session", JSON.stringify({ accountType: "client", name, email: authEmail.trim() }));
    localStorage.setItem("account-type", "client");
    setIsAuthenticated(true);
    setClientFirst(name.split(" ")[0] || name);
    setClientLast(name.split(" ").slice(1).join(" "));
    setClientEmail(authEmail.trim());
    setMode("auth");
    setStep(1);
  }

  function handleAuthSignup() {
    if (!authEmail.trim() || !authName.trim()) return;
    localStorage.setItem("lumiere-session", JSON.stringify({ accountType: "client", name: authName.trim(), email: authEmail.trim() }));
    localStorage.setItem("account-type", "client");
    setIsAuthenticated(true);
    setClientFirst(authName.trim().split(" ")[0]);
    setClientLast(authName.trim().split(" ").slice(1).join(" "));
    setClientEmail(authEmail.trim());
    setMode("auth");
    setStep(1);
  }

  function chooseGuest() {
    setMode("guest");
    setStep(1);
  }

  // ── Join waiting list ─────────────────────────────────
  async function handleJoinWaitlist() {
    if (!profile || !clientFirst.trim()) return;
    if (!clientEmail.trim() && !clientPhone.trim()) return;
    setWaitlistSending(true);
    const { data, error } = await supabase.rpc("public_join_waitlist", {
      p_pro_id: profile.id,
      p_service_id: selectedService || null,
      p_preferred_date: selectedDate || null,
      p_first_name: clientFirst.trim(),
      p_last_name: clientLast.trim() || null,
      p_email: clientEmail.trim() || null,
      p_phone: clientPhone.trim() || null,
      p_note: clientNote.trim() || null,
    });
    if (error || (data as { error?: string })?.error) {
      console.error("[waitlist] failed:", error || data);
      setWaitlistSending(false);
      alert("Inscription à la liste d'attente impossible. Réessayez.");
      return;
    }

    // Non-blocking push to the pro so they know there's demand.
    try {
      const clientName = `${clientFirst.trim()} ${clientLast.trim() || ""}`.trim();
      const svcName = services.find((s) => s.id === selectedService)?.name;
      void fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          title: `🔔 Liste d'attente`,
          body: `${clientName} attend un créneau${svcName ? ` pour ${svcName}` : ""}`,
          url: "/waitlist",
          tag: "waitlist",
        }),
      });
    } catch { /* ignore */ }

    setWaitlistSending(false);
    setWaitlistDone(true);
  }

  // ── Create booking ─────────────────────────────────────
  async function handleBook() {
    if (!selectedService || !selectedDate || !selectedTime || !clientFirst.trim() || !profile || !service) {
      alert("Merci de remplir au moins votre prénom, la date et l'heure.");
      return;
    }

    // Validate email format if provided (optional field)
    if (clientEmail.trim()) {
      const { validateEmailRequired } = await import("@/lib/validate");
      const err = validateEmailRequired(clientEmail);
      if (err) { alert(err); return; }
    }

    // Validate French phone format if provided (optional field)
    if (clientPhone.trim()) {
      const { validatePhoneFR } = await import("@/lib/validate");
      const err = validatePhoneFR(clientPhone);
      if (err) { alert(err); return; }
    }

    setBooking(true);

    const isGuest = mode === "guest";

    // One atomic SECURITY DEFINER RPC that:
    //   - verifies the service exists and belongs to the pro
    //   - finds-or-creates a client row (dedupe by email)
    //   - creates the appointment with is_guest flag
    // Runs as table owner so strict RLS on clients/appointments stays enforced
    // for every other path.
    //
    // NOTE: last_name is coerced to empty string (never null) because the
    // clients.last_name column is NOT NULL. The RPC itself does not guard
    // this — the caller must.
    const { data, error: rpcError } = await supabase.rpc("public_create_guest_booking", {
      p_pro_id: profile.id,
      p_service_id: selectedService,
      p_date: selectedDate,
      p_time: selectedTime,
      p_first_name: clientFirst.trim(),
      p_last_name: clientLast.trim() || "",
      p_email: clientEmail.trim() || null,
      p_phone: clientPhone.trim() || null,
      p_note: clientNote.trim() || null,
      p_is_guest: isGuest,
    });

    const payload = data as { error?: string; sqlstate?: string; detail?: string } | null;
    const rpcMessage = payload?.error;
    if (rpcError || rpcMessage) {
      console.error("[booking] RPC failed:", { rpcError, data });
      setBooking(false);
      const humanMessage =
        rpcMessage === "missing_first_name" ? "Merci de renseigner votre prénom." :
        rpcMessage === "missing_date_or_time" ? "Sélectionnez une date et un horaire." :
        rpcMessage === "invalid_service" ? "Le service sélectionné n'est plus disponible. Choisissez-en un autre." :
        rpcMessage === "not_found" ? "Ce lien de réservation n'existe plus." :
        rpcMessage === "db_error" ? `Erreur base de données (${payload?.sqlstate || ""}) : ${payload?.detail || ""}` :
        rpcError?.message ||
        null;
      if (humanMessage) {
        alert(`Réservation impossible : ${humanMessage}`);
      } else {
        alert(
          "Réservation impossible. Vérifiez votre connexion et réessayez.\n" +
          "Si le problème persiste, signalez ce message :\n" +
          JSON.stringify(rpcError || data).slice(0, 300)
        );
      }
      return;
    }

    // ── Fire push notification to the pro (best-effort, non-blocking) ──
    try {
      const dateLabel = new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
      const clientName = `${clientFirst.trim()} ${clientLast.trim() || ""}`.trim();
      void fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          title: `📅 Nouvelle réservation !`,
          body: `${clientName} a réservé ${service.name}\n🗓 ${dateLabel} à ${selectedTime}`,
          url: "/appointments",
          tag: "new-booking",
        }),
      });
    } catch { /* ignore */ }

    // ── Fire confirmation email (best-effort, non-blocking) ──
    if (clientEmail.trim()) {
      try {
        const { buildConfirmationEmail, sendEmail } = await import("@/lib/email");
        const dateFr = new Date(selectedDate).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        // Look up custom template if the pro has one saved locally
        let customTpl: string | undefined;
        try {
          const raw = localStorage.getItem("automated_messages");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.confirmation?.enabled && parsed?.confirmation?.template) {
              customTpl = parsed.confirmation.template;
            }
          }
        } catch { /* ignore */ }
        const { subject, html, text } = buildConfirmationEmail({
          clientName: clientFirst.trim(),
          businessName: profile.business || profile.name || "Client Base",
          serviceName: service.name,
          dateFr,
          timeFr: selectedTime,
          template: customTpl,
        });
        // Fire and forget
        void sendEmail({
          to: clientEmail.trim(),
          subject,
          html,
          text,
          fromName: profile.business || profile.name || "Client Base",
        });
      } catch (e) {
        console.warn("[booking] confirmation email failed:", e);
      }
    }

    setBooking(false);
    setStep(5);
  }

  // ── Post-booking: convert guest to user ────────────────
  async function handleConvert() {
    if (!convertName.trim() || !convertEmail.trim()) return;
    // Save session
    localStorage.setItem("lumiere-session", JSON.stringify({
      accountType: "client",
      name: convertName.trim(),
      email: convertEmail.trim(),
    }));
    localStorage.setItem("account-type", "client");
    setConverted(true);
    setShowConvert(false);
  }

  function goBack() {
    if (step === 1) { setStep(0); setMode(null); }
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  }

  // ── Loading / Error states ─────────────────────────────
  if (loading) return (
    <div className="h-[100dvh] bg-background flex items-center justify-center">
      <div className="text-center"><div className="skeleton w-12 h-12 rounded-2xl mx-auto mb-3" /><div className="skeleton w-32 h-4 mx-auto" /></div>
    </div>
  );

  if (error || !profile) return (
    <div className="h-[100dvh] bg-background flex items-center justify-center px-6">
      <div className="text-center"><p className="text-[16px] font-bold text-foreground mb-2">Page introuvable</p><p className="text-[13px] text-muted">Ce lien de réservation n&apos;existe pas.</p></div>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Header */}
      {step > 0 && step < 5 && (
        <div className="flex-shrink-0 px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <motion.button whileTap={{ scale: 0.96 }} onClick={goBack} className="w-9 h-9 rounded-xl bg-white shadow-sm-apple flex items-center justify-center">
              <ArrowLeft size={17} className="text-foreground" />
            </motion.button>
            <span className="text-[15px] font-bold text-foreground">Réservation</span>
            <div className="w-9" />
          </div>
          {/* Progress */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Étape {step} sur {totalSteps}</p>
            <p className="text-[10px] text-muted font-medium">{Math.round(progress)}%</p>
          </div>
          <div className="w-full h-[3px] bg-border-light rounded-full overflow-hidden">
            <motion.div className="h-full bg-accent rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <AnimatePresence mode="wait">

          {/* ═══ STEP 0: Auth or Guest Choice ═══ */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Pro header */}
              <div className="flex flex-col items-center text-center pt-6 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)", border: "1px solid #E4E4E7" }}>
                  <Briefcase size={28} style={{ color: "#5B4FE9" }} />
                </div>
                <h1 className="text-[22px] font-bold text-foreground tracking-tight">{profile.name}</h1>
                <p className="text-[13px] text-muted">{profile.business}</p>
              </div>

              {bookingRules.customInstructions && (
                <div className="rounded-2xl p-4 mb-4"
                  style={{ background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)", border: "1px solid #E4E4E7" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#5B4FE9" }}>
                    À lire avant de réserver
                  </p>
                  <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap">
                    {bookingRules.customInstructions}
                  </p>
                </div>
              )}

              <h2 className="text-[20px] font-bold text-foreground tracking-tight text-center mb-1">Comment souhaitez-vous réserver ?</h2>
              <p className="text-[13px] text-muted text-center mb-6">Connectez-vous pour profiter de tous les avantages.</p>

              {/* Option A: Auth (recommended) */}
              <motion.div whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl p-5 shadow-card-premium mb-3 relative overflow-hidden cursor-pointer"
                onClick={() => { setMode("auth"); setAuthMode("login"); }}>
                <div className="absolute top-0 right-0 text-white text-[8px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider"
                  style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)" }}>Recommandé</div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#EEF0FF" }}>
                    <LogIn size={22} style={{ color: "#5B4FE9" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-bold text-foreground">Se connecter / Créer un compte</p>
                    <p className="text-[11px] text-muted mt-1 leading-relaxed">Historique, fidélité, réservation rapide.</p>
                  </div>
                </div>
              </motion.div>

              {/* Auth form (inline expand) */}
              <AnimatePresence>
                {mode === "auth" && !isAuthenticated && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-3">
                      {/* Login / Signup toggle */}
                      <div className="flex rounded-xl bg-border-light p-0.5 mb-4">
                        <button onClick={() => setAuthMode("login")}
                          className={`flex-1 text-[13px] font-bold py-2.5 rounded-lg transition-all ${authMode === "login" ? "bg-white shadow-sm text-foreground" : "text-muted"}`}>
                          Connexion
                        </button>
                        <button onClick={() => setAuthMode("signup")}
                          className={`flex-1 text-[13px] font-bold py-2.5 rounded-lg transition-all ${authMode === "signup" ? "bg-white shadow-sm text-foreground" : "text-muted"}`}>
                          Inscription
                        </button>
                      </div>

                      <div className="space-y-3">
                        {authMode === "signup" && (
                          <div className="bg-border-light rounded-xl px-4 py-3 flex items-center gap-3">
                            <User size={15} className="text-subtle" />
                            <input value={authName} onChange={(e) => setAuthName(e.target.value)}
                              placeholder="Nom complet" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
                          </div>
                        )}
                        <div className="bg-border-light rounded-xl px-4 py-3 flex items-center gap-3">
                          <Mail size={15} className="text-subtle" />
                          <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                            type="email" placeholder="Email" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
                        </div>
                        <div className="bg-border-light rounded-xl px-4 py-3 flex items-center gap-3">
                          <Lock size={15} className="text-subtle" />
                          <input value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                            type={showPw ? "text" : "password"} placeholder="Mot de passe" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
                          <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={14} className="text-subtle" /> : <Eye size={14} className="text-subtle" />}</button>
                        </div>
                      </div>

                      <motion.button whileTap={{ scale: 0.98 }}
                        onClick={authMode === "login" ? handleAuthLogin : handleAuthSignup}
                        className="w-full text-white py-3.5 rounded-xl text-[14px] font-bold mt-4" style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 10px 24px rgba(91,79,233,0.32)" }}>
                        {authMode === "login" ? "Se connecter et réserver" : "Créer mon compte et réserver"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border-light" />
                <span className="text-[11px] text-muted font-semibold">ou</span>
                <div className="flex-1 h-px bg-border-light" />
              </div>

              {/* Option B: Guest */}
              <motion.button whileTap={{ scale: 0.98 }} onClick={chooseGuest}
                className="w-full bg-border-light rounded-2xl p-4 text-left flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-foreground">Continuer en tant qu&apos;invité</p>
                  <p className="text-[11px] text-muted mt-1 leading-relaxed">Réservez sans créer de compte.</p>
                </div>
                <ArrowRight size={16} className="text-muted mt-3" />
              </motion.button>

              {/* Guest warning */}
              <div className="mt-3 bg-warning-soft rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-foreground leading-relaxed">
                  En continuant en tant qu&apos;invité, vous ne bénéficierez pas du programme de fidélité, de l&apos;historique de réservation ni du suivi personnalisé.
                </p>
              </div>

              {/* Trust */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="flex items-center gap-1"><Shield size={10} className="text-muted" /><span className="text-[9px] text-muted">RGPD</span></div>
                <div className="flex items-center gap-1"><CheckCircle2 size={10} className="text-muted" /><span className="text-[9px] text-muted">SSL</span></div>
                <div className="flex items-center gap-1"><Lock size={10} className="text-muted" /><span className="text-[9px] text-muted">Sécurisé</span></div>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 1: Service ═══ */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              {/* Mode badge */}
              {mode === "auth" && isAuthenticated && (
                <div className="bg-accent-soft rounded-xl px-3 py-2 flex items-center gap-2 mb-4 mt-2">
                  <CheckCircle2 size={14} className="text-accent" />
                  <span className="text-[12px] font-bold text-accent">Connecté en tant que {clientFirst}</span>
                </div>
              )}
              {mode === "guest" && (
                <div className="bg-border-light rounded-xl px-3 py-2 flex items-center gap-2 mb-4 mt-2">
                  <User size={14} className="text-muted" />
                  <span className="text-[12px] font-semibold text-muted">Mode invité</span>
                </div>
              )}

              <h2 className="text-[26px] font-bold text-foreground tracking-tight">Sélectionnez votre service</h2>
              <p className="text-[13px] text-muted mt-1.5 flex items-center gap-1.5"><Zap size={13} className="text-accent" /> Moins de 30 secondes</p>

              <div className="space-y-3 mt-6">
                {services.map((svc, i) => (
                  <motion.button key={svc.id} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                    onClick={() => { setSelectedService(svc.id); setStep(2); }}
                    className="w-full bg-white rounded-2xl p-5 shadow-card-premium text-left"
                    style={selectedService === svc.id ? { boxShadow: "0 0 0 2px #5B4FE9, 0 8px 24px rgba(91,79,233,0.18)" } : undefined}>
                    <p className="text-[17px] font-bold text-foreground">{svc.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[12px] text-muted flex items-center gap-1"><Clock size={12} /> {svc.duration >= 60 ? `${Math.floor(svc.duration / 60)}h${svc.duration % 60 > 0 ? ` ${svc.duration % 60}m` : ""}` : `${svc.duration}m`}</span>
                      <span className="text-[12px] text-muted flex items-center gap-1"><CreditCard size={12} /> {svc.price}€</span>
                    </div>
                    {svc.description && (
                      <p className="text-[11px] text-muted mt-2 leading-relaxed line-clamp-2">{svc.description}</p>
                    )}
                    <div className="flex items-center justify-end mt-3">
                      <div className="text-white text-[12px] font-bold px-4 py-2 rounded-xl"
                        style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)" }}>
                        Réserver
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="bg-border-light rounded-2xl p-4 mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0"><Sparkles size={18} className="text-accent" /></div>
                <div className="flex-1"><p className="text-[13px] font-bold text-foreground">Besoin d&apos;aide ?</p><p className="text-[11px] text-muted">Contactez-nous pour une offre sur-mesure.</p></div>
                <ArrowRight size={16} className="text-muted" />
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: Date & Time ═══ */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mt-3">Choisissez un créneau</h2>
              <p className="text-[13px] text-muted mt-1.5">Les horaires sont affichés dans votre fuseau local.</p>

              {/* Date strip */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mt-5 pb-2">
                {dates.slice(0, 7).map((d) => {
                  const ds = d.toISOString().split("T")[0];
                  const isSelected = selectedDate === ds;
                  const dayIdx = (d.getDay() + 6) % 7;
                  const exception = exceptions.find((ex) => {
                    const start = ex.startDate;
                    const end = ex.endDate || ex.startDate;
                    return ds >= start && ds <= end;
                  });
                  return (
                    <motion.button
                      key={ds}
                      whileTap={!exception ? { scale: 0.96 } : undefined}
                      onClick={() => !exception && setSelectedDate(ds)}
                      disabled={!!exception}
                      className="flex-shrink-0 w-[56px] py-3 rounded-xl text-center transition-all bg-white shadow-sm-apple disabled:opacity-40 relative"
                      style={
                        isSelected
                          ? { background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", color: "white" }
                          : exception
                            ? { backgroundColor: "#FEF2F2" }
                            : undefined
                      }
                    >
                      <p className={`text-[9px] font-bold ${isSelected ? "text-white/70" : "text-muted"}`}>{DAYS_SHORT[dayIdx]}</p>
                      <p className="text-[18px] font-bold mt-0.5">{d.getDate()}</p>
                      {exception && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Active exception banner */}
              {selectedDate && (() => {
                const ex = exceptions.find((e) => {
                  const start = e.startDate;
                  const end = e.endDate || e.startDate;
                  return selectedDate >= start && selectedDate <= end;
                });
                if (!ex) return null;
                return (
                  <div className="rounded-2xl p-4 mt-4"
                    style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#B91C1C" }}>
                      {ex.label || "Fermeture exceptionnelle"}
                    </p>
                    <p className="text-[12px] text-foreground leading-relaxed">{ex.message}</p>
                  </div>
                );
              })()}

              {selectedDate && (
                <>
                  <p className="text-[12px] text-muted font-semibold mt-5 mb-2.5 flex items-center gap-1.5">☀️ Créneaux du matin</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {morningSlots.map((t) => {
                      const isSel = selectedTime === t;
                      const isTaken = takenTimes.includes(t);
                      return (
                        <motion.button
                          key={t}
                          whileTap={!isTaken ? { scale: 0.95 } : undefined}
                          onClick={() => !isTaken && setSelectedTime(t)}
                          disabled={isTaken}
                          className="py-4 rounded-2xl text-left px-4 relative bg-white shadow-sm-apple disabled:cursor-not-allowed"
                          style={
                            isSel
                              ? { boxShadow: "0 0 0 2px #5B4FE9, 0 4px 12px rgba(91,79,233,0.15)" }
                              : isTaken
                                ? { backgroundColor: "#F3F4F6", opacity: 0.6 }
                                : undefined
                          }
                        >
                          <p
                            className="text-[18px] font-bold"
                            style={{
                              color: isSel ? "#5B4FE9" : isTaken ? "#9CA3AF" : "var(--color-foreground)",
                              textDecoration: isTaken ? "line-through" : undefined,
                            }}
                          >
                            {t}
                          </p>
                          {isTaken && (
                            <p className="text-[9px] font-semibold text-muted mt-0.5">Réservé</p>
                          )}
                          {isSel && <CheckCircle2 size={18} className="absolute top-3 right-3" style={{ color: "#5B4FE9" }} />}
                        </motion.button>
                      );
                    })}
                  </div>

                  <p className="text-[12px] text-muted font-semibold mt-5 mb-2.5 flex items-center gap-1.5">🌤️ Après-midi</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {afternoonSlots.map((t) => {
                      const isSel = selectedTime === t;
                      const isTaken = takenTimes.includes(t);
                      return (
                        <motion.button
                          key={t}
                          whileTap={!isTaken ? { scale: 0.95 } : undefined}
                          onClick={() => !isTaken && setSelectedTime(t)}
                          disabled={isTaken}
                          className="py-4 rounded-2xl text-left px-4 relative bg-white shadow-sm-apple disabled:cursor-not-allowed"
                          style={
                            isSel
                              ? { boxShadow: "0 0 0 2px #5B4FE9, 0 4px 12px rgba(91,79,233,0.15)" }
                              : isTaken
                                ? { backgroundColor: "#F3F4F6", opacity: 0.6 }
                                : undefined
                          }
                        >
                          <p
                            className="text-[18px] font-bold"
                            style={{
                              color: isSel ? "#5B4FE9" : isTaken ? "#9CA3AF" : "var(--color-foreground)",
                              textDecoration: isTaken ? "line-through" : undefined,
                            }}
                          >
                            {t}
                          </p>
                          {isTaken && (
                            <p className="text-[9px] font-semibold text-muted mt-0.5">Réservé</p>
                          )}
                          {isSel && <CheckCircle2 size={18} className="absolute top-3 right-3" style={{ color: "#5B4FE9" }} />}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedDate && selectedTime && (
                <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(mode === "auth" && isAuthenticated ? 4 : 3)}
                  className="w-full text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 mt-6"
                  style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 12px 28px rgba(91,79,233,0.35)" }}>
                  {mode === "auth" && isAuthenticated ? "Vérifier les détails" : "Suivant : Vos informations"} <ArrowRight size={18} />
                </motion.button>
              )}

              {/* ── Waiting list CTA — visible at all times once step 2 is open ── */}
              <div className="mt-6 pt-5 border-t border-border-light">
                <p className="text-[11px] text-muted text-center mb-2.5">
                  Aucun créneau ne vous convient&nbsp;?
                </p>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowWaitlist(true)}
                  className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "var(--color-primary-soft)",
                    color: "var(--color-primary-deep)",
                    border: "1px solid color-mix(in srgb, var(--color-primary) 25%, white)",
                  }}
                >
                  <Clock size={14} strokeWidth={2.5} />
                  Être prévenu si un créneau se libère
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: Client Info (guest + new auth users) ═══ */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mt-3">Vos informations</h2>
              <p className="text-[13px] text-muted mt-1.5">Renseignez vos coordonnées pour confirmer la réservation.</p>

              <div className="space-y-4 mt-6">
                <div><label className="text-[12px] text-foreground font-semibold mb-1.5 block">Prénom <span className="text-danger">*</span></label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3"><User size={16} className="text-subtle" /><input value={clientFirst} onChange={(e) => setClientFirst(e.target.value)} placeholder="Entrez votre prénom" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" /></div></div>

                <div><label className="text-[12px] text-foreground font-semibold mb-1.5 block">Nom</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5"><input value={clientLast} onChange={(e) => setClientLast(e.target.value)} placeholder="Entrez votre nom" className="w-full bg-transparent text-[14px] outline-none placeholder:text-subtle" /></div></div>

                <div><label className="text-[12px] text-foreground font-semibold mb-1.5 block">Email <span className="text-danger">*</span></label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3"><Mail size={16} className="text-subtle" /><input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" placeholder="nom@exemple.com" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" /></div></div>

                <div><label className="text-[12px] text-foreground font-semibold mb-1.5 block">Téléphone</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3"><Phone size={16} className="text-subtle" /><input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} type="tel" placeholder="+33 6 00 00 00 00" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" /></div></div>

                <div><div className="flex items-center justify-between mb-1.5"><label className="text-[12px] text-foreground font-semibold">Note</label><span className="text-[10px] text-muted uppercase">Optionnel</span></div>
                  <textarea value={clientNote} onChange={(e) => setClientNote(e.target.value)} placeholder="Demandes ou détails particuliers ?" rows={3} className="w-full bg-border-light rounded-2xl px-4 py-3.5 text-[14px] outline-none resize-none placeholder:text-subtle" /></div>
              </div>

              <div className="bg-border-light rounded-2xl p-4 mt-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0"><Shield size={16} className="text-accent" /></div>
                <div><p className="text-[13px] font-bold text-foreground">Réservation sécurisée</p><p className="text-[11px] text-muted mt-0.5 leading-relaxed">Vos données sont chiffrées. Nous ne partageons jamais vos informations.</p></div>
              </div>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(4)}
                disabled={!clientFirst.trim() || !clientEmail.trim()}
                className="w-full py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 mt-5 disabled:opacity-50"
                style={
                  clientFirst.trim() && clientEmail.trim()
                    ? { background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", color: "white", boxShadow: "0 12px 28px rgba(91,79,233,0.35)" }
                    : { backgroundColor: "var(--color-border-light)", color: "var(--color-muted)" }
                }>
                Vérifier les détails <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* ═══ STEP 4: Review ═══ */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mt-3">Récapitulatif</h2>
              <p className="text-[13px] text-muted mt-1.5">Vérifiez les détails avant de confirmer.</p>

              <div className="space-y-3 mt-6">
                {/* Service */}
                <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <div className="flex items-center justify-between">
                    <div><p className="text-[9px] text-accent font-bold uppercase tracking-wider">Service</p><p className="text-[16px] font-bold text-foreground mt-1">{service?.name}</p></div>
                    <CheckCircle2 size={22} className="text-accent" />
                  </div>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-light">
                    <div className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center"><User size={16} className="text-muted" /></div>
                    <div><p className="text-[13px] font-bold text-foreground">{profile.name}</p><p className="text-[10px] text-muted">{profile.business}</p></div>
                  </div>
                </div>

                {/* Appointment */}
                <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <p className="text-[9px] text-accent font-bold uppercase tracking-wider flex items-center gap-1"><CalendarDays size={10} /> Rendez-vous</p>
                  <p className="text-[16px] font-bold text-foreground mt-1">
                    {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-[14px] text-accent font-semibold mt-0.5">{selectedTime} — {(() => {
                    const [h, m] = selectedTime.split(":").map(Number);
                    const end = new Date(0, 0, 0, h, m + (service?.duration || 60));
                    return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
                  })()}</p>
                </div>

                {/* Client */}
                <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <p className="text-[9px] text-accent font-bold uppercase tracking-wider flex items-center gap-1">
                    <User size={10} /> {mode === "guest" ? "Invité" : "Client"}
                  </p>
                  <p className="text-[16px] font-bold text-foreground mt-1">{clientFirst} {clientLast}</p>
                  {clientEmail && <p className="text-[12px] text-muted mt-0.5">{clientEmail}</p>}
                  {mode === "guest" && (
                    <span className="text-[9px] font-bold text-warning bg-warning-soft px-2 py-0.5 rounded-md mt-1.5 inline-block">Mode invité</span>
                  )}
                </div>

                {/* Price */}
                <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <div className="flex justify-between text-[13px] mb-1"><span className="text-muted">Service</span><span className="font-semibold">{service?.price?.toFixed(2)} €</span></div>
                  <div className="border-t border-border-light pt-2 mt-2 flex items-end justify-between">
                    <div><p className="text-[9px] text-accent font-bold uppercase tracking-wider">Total</p><p className="text-[24px] font-bold text-foreground">{service?.price?.toFixed(2)} €</p></div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                      style={{ backgroundColor: "#EEF0FF", color: "#5B4FE9" }}>
                      <Zap size={9} /> Instantané
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted text-center mt-4 flex items-center justify-center gap-1"><Shield size={10} /> Sécurisé & instantané</p>

              <motion.button whileTap={{ scale: 0.98 }} onClick={handleBook} disabled={booking}
                className="w-full text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 14px 32px rgba(91,79,233,0.4)" }}>
                {booking ? "Confirmation en cours..." : "Confirmer la réservation"} {!booking && <ArrowRight size={18} />}
              </motion.button>
            </motion.div>
          )}

          {/* ═══ STEP 5: Confirmation ═══ */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center pt-8 mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)", boxShadow: "0 12px 32px rgba(91,79,233,0.22)" }}>
                  <CheckCircle2 size={36} style={{ color: "#5B4FE9" }} />
                </motion.div>
                <h2 className="text-[26px] font-bold text-foreground tracking-tight">Réservation confirmée !</h2>
                <p className="text-[14px] text-muted mt-2 max-w-[280px] mx-auto leading-relaxed">
                  Votre séance chez {profile.name} est confirmée.
                </p>
              </div>

              {clientEmail.trim() && (
                <div className="rounded-2xl p-4 mb-4 flex items-start gap-2.5"
                  style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <Mail size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#2563EB" }} />
                  <div>
                    <p className="text-[12px] font-bold text-foreground">Email de confirmation envoyé</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                      Un récapitulatif a été envoyé à <strong>{clientEmail.trim()}</strong>. Pensez à vérifier vos spams si vous ne le voyez pas dans les prochaines minutes.
                    </p>
                  </div>
                </div>
              )}

              {bookingRules.cancelMessage && (
                <div className="rounded-2xl p-4 mb-4 flex items-start gap-2.5"
                  style={{ background: "#FFFBEB", border: "1px solid #FEF3C7" }}>
                  <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-bold text-foreground">Politique d&apos;annulation</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{bookingRules.cancelMessage}</p>
                  </div>
                </div>
              )}

              {/* Summary card */}
              <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
                <div className="flex items-start justify-between">
                  <div><p className="text-[9px] text-accent font-bold uppercase tracking-wider">Service</p><p className="text-[16px] font-bold text-foreground mt-1">{service?.name}</p></div>
                  <div className="text-right"><p className="text-[9px] text-muted font-bold uppercase tracking-wider">Horaire</p><p className="text-[14px] font-bold text-foreground mt-1">{selectedTime}</p></div>
                </div>
                <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-border-light">
                  <MapPin size={14} className="text-muted" />
                  <div><p className="text-[13px] font-semibold text-foreground">{profile.name}</p><p className="text-[11px] text-muted">{profile.business}</p></div>
                </div>
              </div>

              {/* ═══ GUEST CONVERSION PROMPT ═══ */}
              {mode === "guest" && !converted && !showConvert && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="rounded-2xl p-5 text-white mb-4"
                  style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 14px 32px rgba(91,79,233,0.35)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <UserPlus size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold">Créez votre compte gratuitement</p>
                      <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                        Profitez de tous les avantages : historique, fidélité, réservation rapide.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2"><CheckCircle2 size={13} className="text-white/80" /><span className="text-[11px]">Historique de vos rendez-vous</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={13} className="text-white/80" /><span className="text-[11px]">Programme de fidélité et récompenses</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={13} className="text-white/80" /><span className="text-[11px]">Réservation en 1 clic</span></div>
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }}
                    onClick={() => { setConvertName(`${clientFirst} ${clientLast}`.trim()); setConvertEmail(clientEmail); setShowConvert(true); }}
                    className="w-full bg-white py-3.5 rounded-xl text-[14px] font-bold mt-4 flex items-center justify-center gap-2"
                    style={{ color: "#3B30B5" }}>
                    <UserPlus size={16} /> Créer mon compte
                  </motion.button>
                </motion.div>
              )}

              {/* Conversion form */}
              <AnimatePresence>
                {showConvert && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
                      <h3 className="text-[16px] font-bold text-foreground mb-3">Créer votre compte</h3>
                      <div className="space-y-3">
                        <div className="bg-border-light rounded-xl px-4 py-3 flex items-center gap-3">
                          <User size={15} className="text-subtle" />
                          <input value={convertName} onChange={(e) => setConvertName(e.target.value)}
                            placeholder="Nom complet" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
                        </div>
                        <div className="bg-border-light rounded-xl px-4 py-3 flex items-center gap-3">
                          <Mail size={15} className="text-subtle" />
                          <input value={convertEmail} onChange={(e) => setConvertEmail(e.target.value)}
                            type="email" placeholder="Email" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
                        </div>
                        <div className="bg-border-light rounded-xl px-4 py-3 flex items-center gap-3">
                          <Lock size={15} className="text-subtle" />
                          <input value={convertPassword} onChange={(e) => setConvertPassword(e.target.value)}
                            type="password" placeholder="Mot de passe" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
                        </div>
                      </div>
                      <motion.button whileTap={{ scale: 0.98 }} onClick={handleConvert}
                        disabled={!convertName.trim() || !convertEmail.trim()}
                        className="w-full text-white py-3.5 rounded-xl text-[14px] font-bold mt-4" style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 10px 24px rgba(91,79,233,0.32)" }}>
                        Créer mon compte
                      </motion.button>
                      <button onClick={() => setShowConvert(false)} className="w-full text-[12px] text-muted font-semibold mt-2 py-2">
                        Non merci
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Converted success */}
              {converted && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-accent-soft rounded-2xl p-4 mb-4 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-accent" />
                  <div>
                    <p className="text-[14px] font-bold text-foreground">Compte créé avec succès !</p>
                    <p className="text-[11px] text-muted">Votre réservation est maintenant liée à votre compte.</p>
                  </div>
                </motion.div>
              )}

              {/* Loyalty card (auth users only) */}
              {mode === "auth" && (
                <div className="bg-foreground rounded-2xl p-5 text-white mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="text-[15px] font-bold">Client Base Loyalty</p><p className="text-[9px] text-white/50 uppercase tracking-wider">Membre fidelite</p></div>
                    <CreditCard size={20} className="text-white/40" />
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-[28px] font-bold">1<span className="text-[14px] text-white/40">/5</span></p>
                    <p className="text-[10px] text-white/50 text-right max-w-[140px]">4 RDV avant la récompense</p>
                  </div>
                  <div className="flex gap-1.5 mt-3">{[1,2,3,4,5].map((i) => (<div key={i} className={`flex-1 h-1.5 rounded-full ${i <= 1 ? "bg-accent" : "bg-white/20"}`} />))}</div>
                </div>
              )}

              <motion.button whileTap={{ scale: 0.98 }}
                className="w-full text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 mb-3"
                style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 12px 28px rgba(91,79,233,0.35)" }}>
                <CalendarDays size={18} /> Ajouter au calendrier
              </motion.button>

              {mode === "auth" || converted ? (
                <button onClick={() => router.push("/client-home")} className="w-full bg-border-light text-foreground py-3.5 rounded-2xl text-[14px] font-bold text-center">
                  Accéder à mon espace
                </button>
              ) : (
                <button onClick={() => window.location.href = "/"} className="w-full bg-border-light text-foreground py-3.5 rounded-2xl text-[14px] font-bold text-center">
                  Retour à l&apos;accueil
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ LEGAL FOOTER ═══ */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-center gap-3 text-[10px] text-subtle">
        <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Mentions legales</a>
        <span>·</span>
        <a href="/cgu" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">CGU</a>
        <span>·</span>
        <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Confidentialite</a>
      </div>

      {/* ═══ WAITING LIST MODAL ═══ */}
      <AnimatePresence>
        {showWaitlist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !waitlistSending && setShowWaitlist(false)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
            >
              {waitlistDone ? (
                <div className="text-center py-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "var(--color-primary-soft)" }}
                  >
                    <Check size={26} style={{ color: "var(--color-primary)" }} strokeWidth={2.6} />
                  </div>
                  <h3 className="text-[20px] font-bold text-foreground tracking-tight">Vous êtes inscrit</h3>
                  <p className="text-[13px] text-muted mt-2 leading-relaxed max-w-[280px] mx-auto">
                    Nous vous contactons dès qu&apos;un créneau se libère. Aucune obligation de votre part.
                  </p>
                  <button
                    onClick={() => { setShowWaitlist(false); setWaitlistDone(false); }}
                    className="mt-5 w-full py-3 rounded-xl text-[13px] font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                    }}
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--color-primary-soft)" }}
                    >
                      <Clock size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[18px] font-bold text-foreground tracking-tight">Liste d&apos;attente</h3>
                      <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
                        Laissez vos coordonnées — nous vous prévenons dès qu&apos;un créneau se libère.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-foreground font-semibold mb-1 block">
                        Prénom <span className="text-danger">*</span>
                      </label>
                      <input
                        value={clientFirst}
                        onChange={(e) => setClientFirst(e.target.value)}
                        placeholder="Votre prénom"
                        className="w-full bg-border-light rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-subtle"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground font-semibold mb-1 block">
                        Email ou téléphone <span className="text-danger">*</span>
                      </label>
                      <input
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        type="email"
                        className="w-full bg-border-light rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-subtle mb-2"
                      />
                      <input
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+33 6 00 00 00 00"
                        type="tel"
                        className="w-full bg-border-light rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-subtle"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground font-semibold mb-1 block">
                        Note <span className="text-subtle font-normal">(optionnel)</span>
                      </label>
                      <textarea
                        value={clientNote}
                        onChange={(e) => setClientNote(e.target.value)}
                        placeholder="Date souhaitée, contraintes, etc."
                        rows={2}
                        className="w-full bg-border-light rounded-xl px-4 py-3 text-[13px] outline-none resize-none placeholder:text-subtle"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => setShowWaitlist(false)}
                      disabled={waitlistSending}
                      className="flex-1 py-3 rounded-xl text-[13px] font-bold text-muted bg-border-light disabled:opacity-60"
                    >
                      Annuler
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleJoinWaitlist}
                      disabled={
                        waitlistSending ||
                        !clientFirst.trim() ||
                        (!clientEmail.trim() && !clientPhone.trim())
                      }
                      className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                      }}
                    >
                      {waitlistSending ? "Inscription…" : "M'inscrire"}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
