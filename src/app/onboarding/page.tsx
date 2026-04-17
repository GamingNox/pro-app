"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/notify";
import { saveSetting } from "@/lib/user-settings";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Sparkles, CalendarDays, BarChart3,
  Briefcase, User, Mail, Lock, Eye, EyeOff, Star, Shield, CheckCircle2, Play, Crown, Loader2,
  LayoutGrid, Heart, Rocket, TrendingUp, Check, Gift, Zap, Settings, Bell, Clock, Plus, Trash2,
  Scissors, Stethoscope, GraduationCap, Palette, Dumbbell, Wrench, MoreHorizontal,
} from "lucide-react";

type Phase = "slides" | "landing" | "accountType" | "signup" | "login" | "demo";
type AcctType = "pro" | "client";
type SignupMode = "quick" | "complete";

// Predefined pro business types — lets users self-categorize without
// guessing a free-text "activité". Keeps it simple, max 6 categories.
const BUSINESS_TYPES = [
  { key: "beaute", label: "Beauté & bien-être", icon: Scissors, gradient: "linear-gradient(135deg, #F472B6, #EC4899)" },
  { key: "sante", label: "Santé & thérapies", icon: Stethoscope, gradient: "linear-gradient(135deg, #34D399, #10B981)" },
  { key: "conseil", label: "Conseil & formation", icon: GraduationCap, gradient: "linear-gradient(135deg, #60A5FA, #3B82F6)" },
  { key: "creatif", label: "Créatif & art", icon: Palette, gradient: "linear-gradient(135deg, #F59E0B, #D97706)" },
  { key: "sport", label: "Sport & coaching", icon: Dumbbell, gradient: "linear-gradient(135deg, #A78BFA, #7C3AED)" },
  { key: "artisanat", label: "Artisanat & services", icon: Wrench, gradient: "linear-gradient(135deg, #FB7185, #E11D48)" },
] as const;

const WEEKDAYS = [
  { key: "mon", short: "L", full: "Lundi" },
  { key: "tue", short: "M", full: "Mardi" },
  { key: "wed", short: "M", full: "Mercredi" },
  { key: "thu", short: "J", full: "Jeudi" },
  { key: "fri", short: "V", full: "Vendredi" },
  { key: "sat", short: "S", full: "Samedi" },
  { key: "sun", short: "D", full: "Dimanche" },
] as const;

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pro";
}

type Slide = {
  category: string;
  titleStart: string;
  titleEnd: string;
  desc: string;
};

const SLIDES: Slide[] = [
  {
    category: "VOTRE OUTIL",
    titleStart: "Votre metier,",
    titleEnd: "simplifie",
    desc: "Un seul outil pour vos clients, rendez-vous, factures et paiements. Concentrez-vous sur votre metier, on gere le reste.",
  },
  {
    category: "ORGANISATION",
    titleStart: "Centralisez vos",
    titleEnd: "rendez-vous",
    desc: "Un calendrier intelligent qui travaille pour vous, 24h/24. Gagnez du temps en automatisant vos reservations et rappels.",
  },
  {
    category: "CROISSANCE",
    titleStart: "Fidelisez vos",
    titleEnd: "clients",
    desc: "Programme de fidelite, promotions ciblees et relances automatiques. Transformez vos visiteurs en habitues.",
  },
  {
    category: "PRET ?",
    titleStart: "Lancez-vous",
    titleEnd: "des aujourd'hui",
    desc: "Creez votre compte en 60 secondes. Aucune carte bancaire requise. Accedez a votre espace immediatement.",
  },
];

export default function OnboardingPage() {
  const [phase, setPhase] = useState<Phase>("slides");
  const [slide, setSlide] = useState(0);
  const [acctType, setAcctType] = useState<AcctType>("pro");
  const [showPw, setShowPw] = useState(false);
  const [loginMode, setLoginMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    password: "",
    referralCode: "",
    // Step 2 — business details
    businessType: "",
    phone: "",
    // Step 3 — services (pre-populated into `services` table on completion)
    services: [] as { name: string; price: string; duration: string }[],
    // Step 4 — availability
    workDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false } as Record<string, boolean>,
    workStart: "09:00",
    workEnd: "18:00",
    // Step 5 — preferences + booking rules
    notifications: true,
    cancelLimit: "24",  // default cancellation delay
    minDelay: "1",      // default min delay before booking
    rgpdConsent: false,
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [signupStep, setSignupStep] = useState(0); // 0..4 for pro complete mode; always 0 for client/quick
  const [signupMode, setSignupMode] = useState<SignupMode>("complete");
  const [createdUid, setCreatedUid] = useState<string | null>(null);
  // Accumulates onboarding_data JSONB snapshot across steps so each DB write
  // merges with previous values (rather than overwriting the column).
  const [onboardingSnapshot, setOnboardingSnapshot] = useState<import("@/lib/types").OnboardingData>({});

  const { completeAuth, startDemo, saveOnboardingStep, user, userId, hasOnboarded, isDemo } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeMode = searchParams?.get("resume") === "1";

  // If the user already has a valid session and has onboarded, kick them
  // straight to their dashboard — no reason to let them go through onboarding again.
  // Exception: resume mode (user explicitly clicked "Terminer la configuration").
  useEffect(() => {
    if (resumeMode) return;
    if (isDemo) return;
    if (hasOnboarded && user.accountType) {
      router.replace(user.accountType === "client" ? "/client-home" : "/");
    }
  }, [hasOnboarded, user.accountType, isDemo, resumeMode, router]);

  // Slides REPLAY by default: every fresh load (app launch, logout,
  // new tab) shows the 4 onboarding slides again.
  // ONE exception: explicit "Retour" from admin login or demo session sets
  // a per-tab sessionStorage flag that lands the user directly on the
  // assistant (landing) page — skipping only that specific back navigation.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("skip-onboarding-slides") === "1") {
        sessionStorage.removeItem("skip-onboarding-slides");
        setPhase("landing");
      }
    } catch {}
  }, []);

  // Demo session navigation — fires AFTER React commits isDemo + user.accountType
  // + hasOnboarded from startDemo. Prevents a race where router.replace runs
  // before AppLayout can read the updated hasOnboarded flag.
  useEffect(() => {
    if (!isDemo || !hasOnboarded || !user.accountType) return;
    router.replace(user.accountType === "client" ? "/client-home" : "/");
  }, [isDemo, hasOnboarded, user.accountType, router]);

  // Resume flow — authenticated user clicks "Terminer la configuration"
  // from the dashboard banner. Runs exactly once per mount so subsequent
  // user-state updates don't snap the user back to an earlier step.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    if (!resumeMode || !hasOnboarded || !userId) return;
    resumedRef.current = true;
    setAcctType("pro");
    setSignupMode("complete");
    setCreatedUid(userId);
    setPhase("signup");
    setOnboardingSnapshot(user.onboardingData || {});
    setFormData((prev) => ({
      ...prev,
      name: user.name || prev.name,
      email: user.email || prev.email,
      business: user.business || "",
      businessType: user.businessType || "",
      phone: user.phone || "",
      // services stay empty on resume — existing services remain in DB,
      // the form lets the user add NEW ones without risking duplicates.
      services: [],
      workDays: user.onboardingData?.workDays || prev.workDays,
      workStart: user.onboardingData?.workStart || prev.workStart,
      workEnd: user.onboardingData?.workEnd || prev.workEnd,
      notifications: user.onboardingData?.notifications ?? prev.notifications,
      referralCode: user.onboardingData?.referralCode || "",
    }));
    // Jump to the first incomplete step.
    const step1Done = Boolean(user.businessType || user.business);
    const step2Done = (user.onboardingData?.services?.length ?? 0) > 0;
    const step3Done = Boolean(user.onboardingData?.workDays);
    const step4Done = user.onboardingData?.notifications !== undefined;
    let nextStep = 1;
    if (step1Done) nextStep = 2;
    if (step1Done && step2Done) nextStep = 3;
    if (step1Done && step2Done && step3Done) nextStep = 4;
    if (step1Done && step2Done && step3Done && step4Done) nextStep = 4; // stay on final
    setSignupStep(nextStep);
  }, [resumeMode, hasOnboarded, userId, user]);

  function nextSlide() {
    if (slide < SLIDES.length - 1) setSlide((s) => s + 1);
    else setPhase("landing");
  }
  function prevSlide() { if (slide > 0) setSlide((s) => s - 1); }

  // ── Helper: best-effort per-field profile update. Each field goes
  //   in its own request so a missing column (pre-migration) never rolls
  //   back the rest of the writes.
  async function writeProfileFields(uid: string, fields: Record<string, unknown>) {
    await Promise.all(
      Object.entries(fields).map(([k, v]) =>
        supabase
          .from("user_profiles")
          .update({ [k]: v })
          .eq("id", uid)
          .then(({ error }) => {
            if (error) console.warn(`[onboarding] ${k} update skipped:`, error.message);
          })
      )
    );
  }

  // ── Step 0: create Supabase Auth user + minimal profile row ─────
  // After success, quick mode → redirect; complete mode → advance to step 1.
  async function handleStep0Submit() {
    if (!formData.name.trim()) { setAuthError("Veuillez entrer votre nom."); return; }
    if (!formData.email.trim()) { setAuthError("Veuillez entrer votre adresse e-mail."); return; }
    if (!formData.password.trim()) { setAuthError("Veuillez entrer un mot de passe."); return; }
    if (formData.password.trim().length < 6) { setAuthError("Le mot de passe doit contenir au moins 6 caractères."); return; }

    setAuthLoading(true);
    setAuthError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      if (error) throw error;
      if (!data.user) throw new Error("Erreur lors de la création du compte.");

      const uid = data.user.id;
      const slug = generateSlug(formData.name.trim()) + "-" + uid.substring(0, 6);

      // Insert ONLY columns guaranteed to exist (pre-v3 schema). The new
      // setup_completed column is set in a follow-up update below so a
      // missing column can't kill the primary insert.
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: uid,
        name: formData.name.trim(),
        business: "",
        phone: "",
        email: formData.email.trim(),
        has_onboarded: true,
        booking_slug: slug,
      });
      if (profileError) throw profileError;

      setCreatedUid(uid);

      // Best-effort: mark setup_completed depending on signup path.
      const initialSetupCompleted = acctType === "client" || signupMode === "quick";
      void writeProfileFields(uid, { setup_completed: initialSetupCompleted });

      // Fire-and-forget: notify admin
      notifyAdmin({
        type: "signup",
        userName: formData.name.trim(),
        userEmail: formData.email.trim(),
        message: acctType === "pro"
          ? `Nouveau compte professionnel (${signupMode === "quick" ? "quick" : "complete"})`
          : "Nouveau compte client",
        metadata: { account_type: acctType, booking_slug: slug, mode: signupMode },
      });

      // Client + quick pro → straight into the app (completeAuth syncs store).
      if (acctType === "client" || signupMode === "quick") {
        await completeAuth(uid, acctType);
        router.replace(acctType === "client" ? "/client-home" : "/");
        return;
      }

      // Complete pro signup → advance to business info step.
      setSignupStep(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
      if (msg.includes("already registered")) setAuthError("Cet email est déjà utilisé. Essayez de vous connecter.");
      else if (msg.includes("valid email")) setAuthError("Veuillez entrer une adresse email valide.");
      else if (msg.includes("password")) setAuthError("Le mot de passe doit contenir au moins 6 caractères.");
      else setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Step 1: business info → write to DB directly with createdUid ──
  async function handleStep1Submit() {
    if (!createdUid) return;
    if (!formData.businessType) { setAuthError("Choisissez une catégorie."); return; }
    setAuthError("");

    const nextSnapshot: import("@/lib/types").OnboardingData = {
      ...onboardingSnapshot,
      businessType: formData.businessType,
      phone: formData.phone.trim(),
      stepsCompleted: 1,
    };
    setOnboardingSnapshot(nextSnapshot);
    saveOnboardingStep(nextSnapshot); // local-state mirror

    await writeProfileFields(createdUid, {
      business: formData.business.trim(),
      business_type: formData.businessType,
      phone: formData.phone.trim(),
      onboarding_data: nextSnapshot,
    });

    setSignupStep(2);
  }

  // ── Step 2: services → insert valid rows into `services` table. ──
  async function handleStep2Submit() {
    if (!createdUid) return;
    const validServices = formData.services
      .filter((s) => s.name.trim())
      .map((s) => ({
        user_id: createdUid,
        name: s.name.trim(),
        price: parseFloat(s.price) || 0,
        duration: parseInt(s.duration) || 60,
        description: "",
        active: true,
      }));

    if (validServices.length > 0) {
      const { error } = await supabase.from("services").insert(validServices);
      if (error) console.warn("[onboarding] services insert failed:", error.message);
    }

    // Append to existing snapshot services so resume sessions don't
    // wipe services added during the initial signup.
    const newServices = validServices.map((s) => ({ name: s.name, price: s.price, duration: s.duration }));
    const mergedServices = [...(onboardingSnapshot.services || []), ...newServices];

    const nextSnapshot: import("@/lib/types").OnboardingData = {
      ...onboardingSnapshot,
      services: mergedServices,
      stepsCompleted: Math.max(onboardingSnapshot.stepsCompleted || 0, 2),
    };
    setOnboardingSnapshot(nextSnapshot);
    saveOnboardingStep(nextSnapshot);
    void writeProfileFields(createdUid, { onboarding_data: nextSnapshot });

    setSignupStep(3);
  }

  // ── Step 3: availability → onboarding_data JSONB only. ───────────
  async function handleStep3Submit() {
    if (!createdUid) return;
    const nextSnapshot: import("@/lib/types").OnboardingData = {
      ...onboardingSnapshot,
      workDays: formData.workDays,
      workStart: formData.workStart,
      workEnd: formData.workEnd,
      stepsCompleted: 3,
    };
    setOnboardingSnapshot(nextSnapshot);
    saveOnboardingStep(nextSnapshot);
    void writeProfileFields(createdUid, { onboarding_data: nextSnapshot });
    setSignupStep(4);
  }

  // ── Step 4: preferences + finalize setup. ────────────────────────
  async function handleStep4Submit() {
    if (!createdUid) return;
    setAuthLoading(true);

    const nextSnapshot: import("@/lib/types").OnboardingData = {
      ...onboardingSnapshot,
      notifications: formData.notifications,
      referralCode: formData.referralCode.trim() || undefined,
      stepsCompleted: 4,
    };
    setOnboardingSnapshot(nextSnapshot);
    saveOnboardingStep(nextSnapshot, { completed: true });

    // Persist initial booking rules so the settings page is pre-configured.
    // Saves all DEFAULTS keys so the full form on the settings page stays valid.
    void saveSetting("booking_rules", {
      cancelLimit: formData.cancelLimit,
      cancelMessage:
        formData.cancelLimit === "none"
          ? "Les annulations sont acceptées jusqu'au dernier moment."
          : `Toute annulation doit être effectuée au moins ${formData.cancelLimit}h avant le rendez-vous.`,
      minDelay: formData.minDelay,
      maxAdvanceDays: "60",
      requirePhone: true,
      requireEmail: true,
      customInstructions: "",
    });

    await writeProfileFields(createdUid, {
      onboarding_data: nextSnapshot,
      setup_completed: true,
      ...(formData.referralCode.trim() ? { referred_by: formData.referralCode.trim().toUpperCase() } : {}),
    });

    // Hydrate the store now so the dashboard shows the fresh profile
    // (business, services, progress) immediately on arrival.
    try {
      await completeAuth(createdUid, "pro");
    } catch (e) {
      console.warn("[onboarding] completeAuth after finalize failed:", e);
    }

    router.replace("/");
  }

  // ── Real Supabase Auth Login ──────────────────────────
  async function handleLogin() {
    if (!formData.email.trim()) { setAuthError("Veuillez entrer votre adresse e-mail."); return; }
    if (!formData.password.trim()) { setAuthError("Veuillez entrer votre mot de passe."); return; }
    setAuthLoading(true);
    setAuthError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      if (error) throw error;
      if (!data.user) throw new Error("Erreur de connexion.");

      await completeAuth(data.user.id, acctType);
      router.replace(acctType === "client" ? "/client-home" : "/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Identifiants incorrects.";
      if (msg.includes("Invalid login")) setAuthError("Email ou mot de passe incorrect.");
      else setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto bg-background">
      <AnimatePresence mode="wait">

        {/* ═══ SLIDES (4 distinct hero layouts) ═══ */}
        {phase === "slides" && (() => {
          const s = SLIDES[slide];
          const isLast = slide === SLIDES.length - 1;
          return (
            <motion.div key="slides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -8 }}
              className="flex-1 flex flex-col">
              {/* ── Top header: brand mark + skip ── */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-mark.svg"
                  alt="Clientbase"
                  className="w-[32px] h-[32px] select-none"
                  draggable={false}
                />
                {!isLast && (
                  <button onClick={() => setPhase("landing")} className="text-[13px] text-muted font-semibold">
                    Passer
                  </button>
                )}
              </div>

              {/* ── Hero illustration area (distinct per slide) ── */}
              <div className="flex-1 flex items-center justify-center px-6 min-h-0">
                <div className="relative w-full h-[300px] rounded-[28px] overflow-hidden"
                  style={{ background: "linear-gradient(180deg, #EEF0FF 0%, #F5F6FC 50%, #FAFAF9 100%)" }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute inset-0 px-5 py-5"
                    >
                      {/* ══ SLIDE 0 — DASHBOARD ══ */}
                      {slide === 0 && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute left-1/2 top-6 -translate-x-1/2 w-[220px] bg-white rounded-2xl p-4"
                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)" }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#A1A1AA" }}>CA DU MOIS</p>
                              <div className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: "#10B981" }}>
                                <TrendingUp size={9} /> +12%
                              </div>
                            </div>
                            <p className="text-[22px] font-bold text-foreground leading-none">2 470 EUR</p>
                            {/* Mini bar chart */}
                            <div className="flex items-end gap-[3px] mt-3 h-[32px]">
                              {[30, 55, 40, 70, 50, 85, 95].map((h, i) => (
                                <motion.div
                                  key={i}
                                  className="flex-1 rounded-[2px]"
                                  style={{ backgroundColor: i === 6 ? "#5B4FE9" : "rgba(91,79,233,0.18)" }}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${h}%` }}
                                  transition={{ duration: 0.4, delay: 0.15 + i * 0.03, ease: [0.4, 0, 0.2, 1] }}
                                />
                              ))}
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute left-1/2 bottom-6 -translate-x-1/2 w-[220px] grid grid-cols-3 gap-2"
                          >
                            {[
                              { label: "RDV", value: "14", color: "#5B4FE9" },
                              { label: "NVX", value: "3", color: "#10B981" },
                              { label: "TAUX", value: "78%", color: "#F59E0B" },
                            ].map((stat) => (
                              <div key={stat.label} className="bg-white rounded-xl px-2 py-2.5 text-center"
                                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                                <p className="text-[13px] font-bold leading-none" style={{ color: stat.color }}>{stat.value}</p>
                                <p className="text-[7px] font-bold uppercase tracking-wider mt-1" style={{ color: "#A1A1AA" }}>{stat.label}</p>
                              </div>
                            ))}
                          </motion.div>
                        </>
                      )}

                      {/* ══ SLIDE 1 — CALENDAR ══ */}
                      {slide === 1 && (
                        <>
                          {/* Day headers row */}
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.08 }}
                            className="absolute left-1/2 top-6 -translate-x-1/2 flex gap-1.5"
                          >
                            {[
                              { d: "LUN", n: 12 }, { d: "MAR", n: 13 }, { d: "MER", n: 14 },
                              { d: "JEU", n: 15, active: true }, { d: "VEN", n: 16 }, { d: "SAM", n: 17 },
                            ].map((day) => (
                              <div key={day.d} className="w-[34px] bg-white rounded-xl py-1.5 text-center"
                                style={{
                                  boxShadow: day.active ? "0 6px 16px rgba(91,79,233,0.25)" : "0 2px 6px rgba(0,0,0,0.05)",
                                  backgroundColor: day.active ? "#5B4FE9" : "#FFFFFF",
                                }}
                              >
                                <p className="text-[7px] font-bold" style={{ color: day.active ? "rgba(255,255,255,0.7)" : "#A1A1AA" }}>{day.d}</p>
                                <p className="text-[13px] font-bold leading-none mt-0.5" style={{ color: day.active ? "white" : "#18181B" }}>{day.n}</p>
                              </div>
                            ))}
                          </motion.div>

                          {/* Appointment slots */}
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: 0.18 }}
                            className="absolute left-5 right-5 top-[110px] bg-white rounded-2xl p-3"
                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-bold" style={{ color: "#A1A1AA" }}>11:00</span>
                              <div className="flex-1 h-[2px] bg-border-light" />
                            </div>
                            <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                              style={{ backgroundColor: "#EEF0FF", borderLeft: "3px solid #5B4FE9" }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "#5B4FE9" }}>
                                <span className="text-[9px] font-bold text-white">ML</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-foreground leading-tight">Marie L. - Consultation</p>
                                <p className="text-[9px] text-muted leading-tight mt-0.5">11:00 - 12:00</p>
                              </div>
                              <CheckCircle2 size={13} style={{ color: "#10B981" }} />
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: 0.28 }}
                            className="absolute left-5 right-5 bottom-6 bg-white rounded-2xl p-3"
                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-bold" style={{ color: "#A1A1AA" }}>14:30</span>
                              <div className="flex-1 h-[2px] bg-border-light" />
                            </div>
                            <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                              style={{ backgroundColor: "#F0FDF4", borderLeft: "3px solid #16A34A" }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "#16A34A" }}>
                                <span className="text-[9px] font-bold text-white">SD</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-foreground leading-tight">Sophie D. - Massage</p>
                                <p className="text-[9px] text-muted leading-tight mt-0.5">14:30 - 15:30</p>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}

                      {/* ══ SLIDE 2 — LOYALTY CARD ══ */}
                      {slide === 2 && (
                        <>
                          {/* Large loyalty card */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute left-1/2 top-[30px] -translate-x-1/2 w-[250px] rounded-[20px] p-4 relative overflow-hidden"
                            style={{
                              background: "linear-gradient(135deg, #5B4FE9 0%, #3B30B5 100%)",
                              boxShadow: "0 12px 32px rgba(91,79,233,0.28), 0 4px 12px rgba(91,79,233,0.18)",
                            }}
                          >
                            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10" />
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5">
                                  <Heart size={11} className="text-white" fill="white" />
                                  <p className="text-[8px] font-bold text-white/80 uppercase tracking-wider">FIDELITE</p>
                                </div>
                                <p className="text-[8px] font-bold text-white/60">CAFE LUMIERE</p>
                              </div>
                              <div className="flex items-end gap-2 mb-2">
                                <p className="text-[26px] font-bold text-white leading-none">6</p>
                                <p className="text-[12px] text-white/60 mb-0.5">/ 10 visites</p>
                              </div>
                              {/* Progress dots */}
                              <div className="flex gap-1 mt-2">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2, delay: 0.25 + i * 0.025 }}
                                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
                                    style={{
                                      backgroundColor: i < 6 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)",
                                    }}
                                  >
                                    {i < 6 && <Check size={10} style={{ color: "#5B4FE9" }} strokeWidth={3} />}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>

                          {/* Retention stat card */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.3 }}
                            className="absolute left-1/2 -translate-x-1/2 bottom-5 bg-white rounded-2xl px-4 py-2.5 flex items-center gap-2.5"
                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                          >
                            <div className="w-7 h-7 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: "#F0FDF4" }}>
                              <TrendingUp size={13} style={{ color: "#16A34A" }} strokeWidth={2.5} />
                            </div>
                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#A1A1AA" }}>TAUX DE RETOUR</p>
                              <p className="text-[13px] font-bold text-foreground leading-tight">78% des clients</p>
                            </div>
                          </motion.div>
                        </>
                      )}

                      {/* ══ SLIDE 3 — STACKED PREVIEW CARDS ══ */}
                      {slide === 3 && (
                        <>
                          {/* Card 3: Revenue (back, bottom right) */}
                          <motion.div
                            initial={{ opacity: 0, y: 12, rotate: 4 }}
                            animate={{ opacity: 1, y: 0, rotate: 6 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="absolute right-[22%] top-[58px] w-[170px] bg-white rounded-2xl p-3"
                            style={{ boxShadow: "0 10px 28px rgba(0,0,0,0.1)", transformOrigin: "center" }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: "#A1A1AA" }}>REVENU</p>
                              <TrendingUp size={10} style={{ color: "#16A34A" }} />
                            </div>
                            <p className="text-[17px] font-bold text-foreground leading-none">+2 470 EUR</p>
                            <p className="text-[9px] mt-1" style={{ color: "#16A34A" }}>+12% ce mois</p>
                          </motion.div>

                          {/* Card 2: Appointment (middle) */}
                          <motion.div
                            initial={{ opacity: 0, y: 10, rotate: -3 }}
                            animate={{ opacity: 1, y: 0, rotate: -2 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                            className="absolute left-1/2 top-[90px] -translate-x-1/2 w-[180px] bg-white rounded-2xl p-3"
                            style={{ boxShadow: "0 12px 30px rgba(91,79,233,0.12), 0 4px 12px rgba(0,0,0,0.08)", transformOrigin: "center" }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: "#EEF0FF" }}>
                                <CalendarDays size={16} style={{ color: "#5B4FE9" }} />
                              </div>
                              <div className="flex-1">
                                <p className="text-[11px] font-bold text-foreground leading-tight">Consultation</p>
                                <p className="text-[9px] text-muted leading-tight mt-0.5">Demain 14:30</p>
                              </div>
                            </div>
                          </motion.div>

                          {/* Card 1: Client avatar (front, top-left) */}
                          <motion.div
                            initial={{ opacity: 0, y: 8, rotate: 2 }}
                            animate={{ opacity: 1, y: 0, rotate: -4 }}
                            transition={{ duration: 0.4, delay: 0.25 }}
                            className="absolute left-5 top-[30px] w-[155px] bg-white rounded-2xl p-3"
                            style={{ boxShadow: "0 14px 36px rgba(91,79,233,0.18), 0 4px 14px rgba(0,0,0,0.08)", transformOrigin: "center" }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                                <span className="text-[11px] font-bold text-white">SM</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: "#A1A1AA" }}>CLIENT</p>
                                <p className="text-[11px] font-bold text-foreground leading-tight truncate">Sophie M.</p>
                              </div>
                            </div>
                          </motion.div>

                          {/* Ready badge */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.38, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute left-1/2 bottom-5 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                            style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 6px 20px rgba(91,79,233,0.35)" }}
                          >
                            <Check size={11} className="text-white" strokeWidth={3} />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Tout est pret</span>
                          </motion.div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* ── Bottom content: category, title, desc, CTA, dots ── */}
              <div className="px-8 pt-5 pb-8 flex-shrink-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <span className="inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-accent bg-accent-soft px-3 py-1 rounded-full mb-3">
                      {s.category}
                    </span>
                    <h1 className="text-[34px] font-bold text-foreground tracking-tight leading-[1.05]">
                      {s.titleStart}<br />
                      <span className="text-accent">{s.titleEnd}</span>
                    </h1>
                    <p className="text-[13px] text-muted leading-relaxed mt-3 max-w-[320px]">
                      {s.desc}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* CTA buttons */}
                <div className="flex gap-3 mt-6">
                  {slide > 0 && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={prevSlide}
                      className="w-14 h-[52px] rounded-2xl bg-border-light flex items-center justify-center flex-shrink-0">
                      <ArrowLeft size={18} className="text-muted" />
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.98 }} onClick={nextSlide}
                    className="flex-1 bg-accent text-white h-[52px] rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow">
                    {isLast ? "Commencer" : "Suivant"} <ArrowRight size={18} />
                  </motion.button>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 mt-5">
                  {SLIDES.map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-[5px] rounded-full"
                      animate={{
                        width: i === slide ? 22 : 5,
                        backgroundColor: i === slide ? "#5B4FE9" : "#E4E4E7",
                      }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ═══ LANDING ═══ */}
        {phase === "landing" && (
          <motion.div key="landing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-8">
            <div className="flex justify-end pt-4">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push("/admin-login")}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle/40 hover:text-muted transition-colors">
                <Crown size={16} />
              </motion.button>
            </div>
            <div className="flex-1 min-h-[60px]" />

            {/* ── Simple, direct welcome ── */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-[22px] flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 14px 32px rgba(91,79,233,0.35)" }}>
                <Sparkles size={32} className="text-white" strokeWidth={2} />
              </div>
              <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">
                Bienvenue sur<br/>Client Base
              </h1>
              <p className="text-[14px] text-muted mt-3 leading-relaxed max-w-[280px]">
                L&apos;outil simple pour gérer vos clients, vos rendez-vous et vos factures.
              </p>
            </div>

            {/* ── 2 large, clear actions ── */}
            <div className="w-full mt-10 space-y-3">
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setLoginMode(false); setPhase("accountType"); }}
                className="w-full text-white py-5 rounded-2xl text-[16px] font-bold"
                style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 14px 32px rgba(91,79,233,0.35)" }}
              >
                Créer mon compte
              </motion.button>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setLoginMode(true); setPhase("accountType"); }}
                className="w-full py-5 rounded-2xl text-[16px] font-bold bg-white"
                style={{ color: "var(--color-primary)", border: "1.5px solid var(--color-border)" }}
              >
                J&apos;ai déjà un compte
              </motion.button>
            </div>

            {/* ── Discrete demo link ── */}
            <div className="mt-5 text-center">
              <button onClick={() => setPhase("demo")} className="text-[13px] text-muted underline">
                Tester la démo sans s&apos;inscrire
              </button>
            </div>

            <div className="flex-1 min-h-[40px]" />
            <div className="pb-5 text-center">
              <p className="text-[10px] text-subtle">&copy; {new Date().getFullYear()} Client Base</p>
            </div>
          </motion.div>
        )}

        {/* ═══ DEMO — hero split-panels (matches account-type style) ═══ */}
        {phase === "demo" && (
          <motion.div key="demo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col">
            <div className="px-6 pt-5">
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setPhase("landing")}
                className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center mb-4">
                <ArrowLeft size={18} className="text-foreground" />
              </motion.button>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight leading-tight">
                Choisissez votre démo
              </h2>
              <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
                Explorez l&apos;application avec des données fictives — aucun compte requis.
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-3 px-5 pt-5 pb-4 min-h-0">
              {/* PRO DEMO — deep violet hero */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => { startDemo("pro"); /* nav handled by useEffect */ }}
                className="flex-1 min-h-[160px] rounded-[28px] relative overflow-hidden text-left"
                style={{
                  background: "linear-gradient(135deg, #7B6DFF 0%, #5B4FE9 45%, #3B30B5 100%)",
                  boxShadow: "0 20px 50px -16px rgba(91,79,233,0.55), 0 6px 18px rgba(59,48,181,0.22)",
                }}
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full bg-white/8" />
                <div className="absolute left-6 bottom-6 w-3 h-3 rounded-full bg-white/40" />

                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur">
                    <Briefcase size={26} className="text-white" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-[22px] font-bold text-white leading-tight tracking-tight">Démo professionnel</p>
                    <p className="text-[12px] text-white/80 mt-1 leading-relaxed max-w-[260px]">
                      Dashboard, rendez-vous, clients, factures et stock pré-remplis.
                    </p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <div className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur flex items-center gap-1">
                        <Play size={10} className="text-white" fill="white" />
                        <span className="text-[10px] font-bold text-white">Entrer en démo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* CLIENT DEMO — light violet hero */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => { startDemo("client"); /* nav handled by useEffect */ }}
                className="flex-1 min-h-[140px] rounded-[28px] relative overflow-hidden text-left"
                style={{
                  background: "linear-gradient(135deg, #F5F3FF 0%, #EEF0FF 45%, #E0E7FF 100%)",
                  border: "1.5px solid rgba(91, 79, 233, 0.22)",
                  boxShadow: "0 14px 36px -12px rgba(91,79,233,0.28)",
                }}
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/60" />
                <div className="absolute right-20 bottom-4 w-14 h-14 rounded-full bg-white/40" />

                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #7B6DFF 0%, #5B4FE9 100%)",
                      boxShadow: "0 8px 22px -6px rgba(91,79,233,0.5)",
                    }}
                  >
                    <User size={26} className="text-white" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-[22px] font-bold text-foreground leading-tight tracking-tight">Démo client</p>
                    <p className="text-[12px] text-muted mt-1 leading-relaxed max-w-[260px]">
                      Réservations, fidélité, offres et cartes cadeaux.
                    </p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <div className="px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: "rgba(91, 79, 233, 0.12)" }}>
                        <Play size={10} className="text-accent" fill="currentColor" />
                        <span className="text-[10px] font-bold text-accent">Entrer en démo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>
            <div className="pb-5 text-center">
              <p className="text-[11px] text-muted">Session temporaire — disparaît au prochain chargement.</p>
            </div>
          </motion.div>
        )}

        {/* ═══ ACCOUNT TYPE — hero split-panels ═══ */}
        {phase === "accountType" && (
          <motion.div key="acctType" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col">
            <div className="px-6 pt-5">
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => { setLoginMode(false); setPhase("landing"); setAuthError(""); }}
                className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center mb-4">
                <ArrowLeft size={18} className="text-foreground" />
              </motion.button>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight leading-tight">
                {loginMode ? "Quel type de compte ?" : "Choisissez votre profil"}
              </h2>
              <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
                {loginMode ? "Sélectionnez votre type de compte." : "Touchez la zone qui vous correspond."}
              </p>
            </div>

            {/* Two stacked hero panels — fill the remaining height */}
            <div className="flex-1 flex flex-col gap-3 px-5 pt-5 pb-6 min-h-0">
              {/* PRO — deep violet gradient hero */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => { setAcctType("pro"); setPhase(loginMode ? "login" : "signup"); setSignupStep(0); setAuthError(""); }}
                className="flex-1 min-h-[160px] rounded-[28px] relative overflow-hidden text-left"
                style={{
                  background: "linear-gradient(135deg, #7B6DFF 0%, #5B4FE9 45%, #3B30B5 100%)",
                  boxShadow: "0 20px 50px -16px rgba(91,79,233,0.55), 0 6px 18px rgba(59,48,181,0.22)",
                }}
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full bg-white/8" />
                <div className="absolute left-6 bottom-6 w-3 h-3 rounded-full bg-white/40" />

                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur">
                    <Briefcase size={26} className="text-white" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-[22px] font-bold text-white leading-tight tracking-tight">Je suis professionnel</p>
                    <p className="text-[12px] text-white/80 mt-1 leading-relaxed max-w-[260px]">
                      Gérer mes clients, rendez-vous, factures, stock et statistiques.
                    </p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <div className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur flex items-center gap-1">
                        <span className="text-[10px] font-bold text-white">{loginMode ? "Se connecter" : "Créer mon espace"}</span>
                        <ArrowRight size={11} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* CLIENT — light violet gradient hero (same design system) */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => { setAcctType("client"); setPhase(loginMode ? "login" : "signup"); setSignupStep(0); setAuthError(""); }}
                className="flex-1 min-h-[140px] rounded-[28px] relative overflow-hidden text-left"
                style={{
                  background: "linear-gradient(135deg, #F5F3FF 0%, #EEF0FF 45%, #E0E7FF 100%)",
                  border: "1.5px solid rgba(91, 79, 233, 0.22)",
                  boxShadow: "0 14px 36px -12px rgba(91,79,233,0.28)",
                }}
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/60" />
                <div className="absolute right-20 bottom-4 w-14 h-14 rounded-full bg-white/40" />

                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #7B6DFF 0%, #5B4FE9 100%)",
                      boxShadow: "0 8px 22px -6px rgba(91,79,233,0.5)",
                    }}
                  >
                    <User size={26} className="text-white" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-[22px] font-bold text-foreground leading-tight tracking-tight">Je suis client</p>
                    <p className="text-[12px] text-muted mt-1 leading-relaxed max-w-[260px]">
                      Réserver en ligne, suivre mes rendez-vous, gagner des points fidélité.
                    </p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <div className="px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: "rgba(91, 79, 233, 0.12)" }}>
                        <span className="text-[10px] font-bold text-accent">
                          {loginMode ? "Se connecter" : "Créer mon compte"}
                        </span>
                        <ArrowRight size={11} className="text-accent" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ SIGNUP — multi-step for Pro (5 steps), single-step for Client ═══ */}
        {phase === "signup" && (
          <motion.div key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-y-auto">
            <div className="px-8 pt-6 pb-8">
              <div className="flex items-center justify-between mb-5">
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (signupStep > 0) setSignupStep((s) => s - 1);
                    else { setPhase("accountType"); setAuthError(""); }
                  }}
                  className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center">
                  <ArrowLeft size={18} className="text-foreground" />
                </motion.button>
                {acctType === "pro" && signupMode === "complete" && createdUid && (
                  <span className="text-[11px] font-bold text-muted">Étape {signupStep + 1} / 5</span>
                )}
              </div>

              {/* Progress bar — pro complete mode only */}
              {acctType === "pro" && signupMode === "complete" && createdUid && (
                <div className="h-[3px] w-full rounded-full bg-border-light overflow-hidden mb-6">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #7B6DFF, #5B4FE9)" }}
                    animate={{ width: `${((signupStep + 1) / 5) * 100}%` }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              )}

              {/* ── STEP 0 — basic info + mode selector ─────────────── */}
              {signupStep === 0 && (
                <>
                  <h2 className="text-[24px] font-bold text-foreground tracking-tight">
                    {acctType === "pro" ? "Créer votre espace pro" : "Créer votre compte"}
                  </h2>
                  <p className="text-[14px] text-muted mt-2">
                    Commencez gratuitement. Aucune carte bancaire requise.
                  </p>

                  {/* Mode selector — Pro only */}
                  {acctType === "pro" && (
                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSignupMode("quick")}
                        className="rounded-2xl p-3 text-left transition-all"
                        style={{
                          background: signupMode === "quick" ? "linear-gradient(135deg, #F5F3FF, #EEF0FF)" : "#F4F4F5",
                          border: signupMode === "quick" ? "1.5px solid #5B4FE9" : "1.5px solid transparent",
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Zap size={13} className={signupMode === "quick" ? "text-accent" : "text-muted"} />
                          <span className={`text-[12px] font-bold ${signupMode === "quick" ? "text-accent" : "text-muted"}`}>Rapide</span>
                        </div>
                        <p className="text-[10px] text-muted leading-tight">60 secondes, finalisez plus tard</p>
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSignupMode("complete")}
                        className="rounded-2xl p-3 text-left transition-all"
                        style={{
                          background: signupMode === "complete" ? "linear-gradient(135deg, #F5F3FF, #EEF0FF)" : "#F4F4F5",
                          border: signupMode === "complete" ? "1.5px solid #5B4FE9" : "1.5px solid transparent",
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Settings size={13} className={signupMode === "complete" ? "text-accent" : "text-muted"} />
                          <span className={`text-[12px] font-bold ${signupMode === "complete" ? "text-accent" : "text-muted"}`}>Complète</span>
                        </div>
                        <p className="text-[10px] text-muted leading-tight">Configurez tout d&apos;un coup</p>
                      </motion.button>
                    </div>
                  )}

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom complet</label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <User size={16} className="text-subtle" />
                        <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Marie Dupont" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Adresse e-mail</label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <Mail size={16} className="text-subtle" />
                        <input value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setAuthError(""); }}
                          type="email" placeholder="nom@exemple.com" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Mot de passe</label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <Lock size={16} className="text-subtle" />
                        <input value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setAuthError(""); }}
                          type={showPw ? "text" : "password"} placeholder="6 caractères minimum" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                        <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} className="text-subtle" /> : <Eye size={16} className="text-subtle" />}</button>
                      </div>
                    </div>

                    {/* RGPD consent (Art. 7) */}
                    <div className="flex items-start gap-3 mt-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({ ...formData, rgpdConsent: !formData.rgpdConsent })}
                        className="w-5 h-5 mt-0.5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: formData.rgpdConsent ? "#5B4FE9" : "white",
                          border: formData.rgpdConsent ? "1.5px solid #5B4FE9" : "1.5px solid #D4D4D8",
                        }}
                      >
                        {formData.rgpdConsent && <Check size={12} className="text-white" strokeWidth={3} />}
                      </motion.button>
                      <p className="text-[11px] text-muted leading-relaxed">
                        J&apos;accepte les{" "}
                        <a href="/cgu" target="_blank" className="text-accent underline font-semibold">CGU</a>{" "}
                        et la{" "}
                        <a href="/confidentialite" target="_blank" className="text-accent underline font-semibold">Politique de confidentialité</a>.
                        Mes données seront traitées conformément au RGPD.
                      </p>
                    </div>

                    {authError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-danger-soft rounded-xl px-4 py-3 text-[12px] text-danger font-semibold">{authError}</motion.div>
                    )}

                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleStep0Submit} disabled={authLoading || !formData.rgpdConsent}
                      className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow mt-2">
                      {authLoading ? <Loader2 size={18} className="animate-spin" /> : (
                        acctType === "client"
                          ? <>Créer mon compte <ArrowRight size={18} /></>
                          : signupMode === "quick"
                            ? <>Créer et démarrer <ArrowRight size={18} /></>
                            : <>Continuer <ArrowRight size={18} /></>
                      )}
                    </motion.button>
                    <p className="text-[12px] text-muted text-center mt-3">
                      Déjà un compte ? <button onClick={() => { setPhase("login"); setAuthError(""); }} className="text-accent font-bold">Se connecter</button>
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-8">
                    <div className="flex items-center gap-1"><Shield size={12} className="text-muted" /><span className="text-[10px] text-muted">RGPD</span></div>
                    <div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-muted" /><span className="text-[10px] text-muted">SSL</span></div>
                  </div>
                </>
              )}

              {/* ── STEP 1 — business info ─────────────────────────── */}
              {signupStep === 1 && (
                <>
                  <h2 className="text-[24px] font-bold text-foreground tracking-tight">Votre activité</h2>
                  <p className="text-[14px] text-muted mt-2">Pour personnaliser votre espace.</p>

                  <div className="mt-5">
                    <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-2 block">Catégorie</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {BUSINESS_TYPES.map((t) => {
                        const Icon = t.icon;
                        const selected = formData.businessType === t.key;
                        return (
                          <motion.button key={t.key} whileTap={{ scale: 0.97 }}
                            onClick={() => setFormData({ ...formData, businessType: t.key })}
                            className="rounded-2xl p-3 text-left transition-all"
                            style={{
                              background: selected ? t.gradient : "#F4F4F5",
                              border: selected ? "1.5px solid rgba(255,255,255,0.4)" : "1.5px solid transparent",
                              boxShadow: selected ? "0 8px 20px -8px rgba(0,0,0,0.25)" : "none",
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5"
                              style={{ background: selected ? "rgba(255,255,255,0.25)" : "white" }}>
                              <Icon size={16} className={selected ? "text-white" : "text-muted"} />
                            </div>
                            <p className={`text-[11px] font-bold leading-tight ${selected ? "text-white" : "text-foreground"}`}>{t.label}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom de votre activité</label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <Briefcase size={16} className="text-subtle" />
                        <input value={formData.business} onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                          placeholder="Consultante, Salon Lumière..." className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Téléphone (optionnel)</label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <User size={16} className="text-subtle" />
                        <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          type="tel" placeholder="06 12 34 56 78" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                      </div>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleStep1Submit}
                    className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow mt-6">
                    Continuer <ArrowRight size={18} />
                  </motion.button>
                  <button onClick={() => { saveOnboardingStep({ stepsCompleted: 1 }, { completed: true }); router.replace("/"); }}
                    className="w-full text-[12px] text-muted mt-3 font-semibold">
                    Finaliser plus tard
                  </button>
                </>
              )}

              {/* ── STEP 2 — services ──────────────────────────────── */}
              {signupStep === 2 && (
                <>
                  <h2 className="text-[24px] font-bold text-foreground tracking-tight">Vos services</h2>
                  <p className="text-[14px] text-muted mt-2">Ajoutez 1 à 3 prestations pour démarrer (facultatif).</p>

                  <div className="mt-5 space-y-3">
                    {formData.services.map((s, idx) => (
                      <div key={idx} className="bg-white rounded-2xl p-4 shadow-card-premium">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Service {idx + 1}</p>
                          <button onClick={() => setFormData({ ...formData, services: formData.services.filter((_, i) => i !== idx) })}>
                            <Trash2 size={14} className="text-danger" />
                          </button>
                        </div>
                        <input
                          value={s.name}
                          onChange={(e) => {
                            const next = [...formData.services];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setFormData({ ...formData, services: next });
                          }}
                          placeholder="Nom du service"
                          className="w-full bg-border-light rounded-xl px-3 py-2.5 text-[13px] text-foreground placeholder:text-subtle outline-none mb-2"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-border-light rounded-xl px-3 py-2.5 flex items-center gap-2">
                            <span className="text-[11px] text-muted font-bold">€</span>
                            <input
                              value={s.price}
                              onChange={(e) => {
                                const next = [...formData.services];
                                next[idx] = { ...next[idx], price: e.target.value.replace(/[^0-9.]/g, "") };
                                setFormData({ ...formData, services: next });
                              }}
                              placeholder="Prix"
                              inputMode="decimal"
                              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-subtle outline-none"
                            />
                          </div>
                          <div className="bg-border-light rounded-xl px-3 py-2.5 flex items-center gap-2">
                            <Clock size={12} className="text-muted" />
                            <input
                              value={s.duration}
                              onChange={(e) => {
                                const next = [...formData.services];
                                next[idx] = { ...next[idx], duration: e.target.value.replace(/[^0-9]/g, "") };
                                setFormData({ ...formData, services: next });
                              }}
                              placeholder="Durée (min)"
                              inputMode="numeric"
                              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-subtle outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.services.length < 3 && (
                      <motion.button whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData({ ...formData, services: [...formData.services, { name: "", price: "", duration: "60" }] })}
                        className="w-full bg-border-light rounded-2xl py-3.5 flex items-center justify-center gap-2 text-[13px] font-bold text-muted">
                        <Plus size={16} /> Ajouter un service
                      </motion.button>
                    )}
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleStep2Submit}
                    className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow mt-6">
                    Continuer <ArrowRight size={18} />
                  </motion.button>
                  <button onClick={() => setSignupStep(3)}
                    className="w-full text-[12px] text-muted mt-3 font-semibold">
                    Passer cette étape
                  </button>
                </>
              )}

              {/* ── STEP 3 — availability ──────────────────────────── */}
              {signupStep === 3 && (
                <>
                  <h2 className="text-[24px] font-bold text-foreground tracking-tight">Vos disponibilités</h2>
                  <p className="text-[14px] text-muted mt-2">Vos jours et horaires de travail habituels.</p>

                  <div className="mt-5">
                    <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-2 block">Jours ouvrés</label>
                    <div className="flex gap-1.5">
                      {WEEKDAYS.map((d) => {
                        const active = formData.workDays[d.key];
                        return (
                          <motion.button key={d.key} whileTap={{ scale: 0.92 }}
                            onClick={() => setFormData({ ...formData, workDays: { ...formData.workDays, [d.key]: !active } })}
                            className="flex-1 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all"
                            style={{
                              background: active ? "linear-gradient(135deg, #7B6DFF, #5B4FE9)" : "#F4F4F5",
                              color: active ? "white" : "#A1A1AA",
                              boxShadow: active ? "0 6px 14px -4px rgba(91,79,233,0.4)" : "none",
                            }}
                          >
                            {d.short}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Début</label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <Clock size={14} className="text-subtle" />
                        <input value={formData.workStart} onChange={(e) => setFormData({ ...formData, workStart: e.target.value })}
                          type="time" className="flex-1 bg-transparent text-[14px] text-foreground outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Fin</label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <Clock size={14} className="text-subtle" />
                        <input value={formData.workEnd} onChange={(e) => setFormData({ ...formData, workEnd: e.target.value })}
                          type="time" className="flex-1 bg-transparent text-[14px] text-foreground outline-none" />
                      </div>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleStep3Submit}
                    className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow mt-6">
                    Continuer <ArrowRight size={18} />
                  </motion.button>
                </>
              )}

              {/* ── STEP 4 — preferences + finalize ────────────────── */}
              {signupStep === 4 && (
                <>
                  <h2 className="text-[24px] font-bold text-foreground tracking-tight">Dernières préférences</h2>
                  <p className="text-[14px] text-muted mt-2">Presque terminé !</p>

                  <motion.div whileTap={{ scale: 0.99 }}
                    onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}
                    className="mt-5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #F5F3FF, #EEF0FF)", border: "1px solid rgba(91,79,233,0.12)" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #7B6DFF, #5B4FE9)" }}>
                      <Bell size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-foreground">Notifications</p>
                      <p className="text-[11px] text-muted mt-0.5 leading-tight">Rappels de rendez-vous et nouveaux clients</p>
                    </div>
                    <div className="w-11 h-6 rounded-full transition-all" style={{ backgroundColor: formData.notifications ? "#5B4FE9" : "#E4E4E7" }}>
                      <motion.div className="w-5 h-5 rounded-full bg-white my-0.5 shadow"
                        animate={{ x: formData.notifications ? 22 : 2 }}
                        transition={{ duration: 0.2 }} />
                    </div>
                  </motion.div>

                  {/* ── Booking rules (2 essentials) ── */}
                  <div
                    className="mt-4 rounded-2xl p-4"
                    style={{ background: "linear-gradient(135deg, #F5F3FF, #EEF0FF)", border: "1px solid rgba(91,79,233,0.12)" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #7B6DFF, #5B4FE9)" }}
                      >
                        <Clock size={18} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-foreground">Règles de réservation</p>
                        <p className="text-[11px] text-muted mt-0.5 leading-tight">Personnalisez librement plus tard dans les paramètres.</p>
                      </div>
                    </div>

                    {/* Cancellation delay */}
                    <div className="mb-3">
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                        Annulation possible jusqu&apos;à
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { v: "none", l: "Libre" },
                          { v: "4", l: "4h" },
                          { v: "12", l: "12h" },
                          { v: "24", l: "24h" },
                          { v: "48", l: "48h" },
                          { v: "72", l: "72h" },
                        ].map((opt) => {
                          const active = formData.cancelLimit === opt.v;
                          return (
                            <motion.button
                              key={opt.v}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => setFormData({ ...formData, cancelLimit: opt.v })}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                              style={{
                                backgroundColor: active ? "#5B4FE9" : "white",
                                color: active ? "white" : "#71717A",
                                border: active ? "none" : "1px solid #E4E4E7",
                              }}
                            >
                              {opt.l}
                            </motion.button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted mt-1.5 leading-tight">
                        Délai avant lequel vos clients peuvent annuler sans pénalité.
                      </p>
                    </div>

                    {/* Min delay before booking */}
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                        Délai minimum avant de réserver
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { v: "0", l: "Immédiat" },
                          { v: "1", l: "1h" },
                          { v: "4", l: "4h" },
                          { v: "12", l: "12h" },
                          { v: "24", l: "24h" },
                        ].map((opt) => {
                          const active = formData.minDelay === opt.v;
                          return (
                            <motion.button
                              key={opt.v}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => setFormData({ ...formData, minDelay: opt.v })}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                              style={{
                                backgroundColor: active ? "#5B4FE9" : "white",
                                color: active ? "white" : "#71717A",
                                border: active ? "none" : "1px solid #E4E4E7",
                              }}
                            >
                              {opt.l}
                            </motion.button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted mt-1.5 leading-tight">
                        Évite les réservations de dernière minute.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                      Code de parrainage <span className="text-subtle font-semibold normal-case tracking-normal">(optionnel)</span>
                    </label>
                    <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                      style={{ background: "linear-gradient(135deg, #FDF2F8 0%, #FEF3C7 100%)", border: "1px solid rgba(236, 72, 153, 0.18)" }}>
                      <Gift size={16} style={{ color: "#EC4899" }} />
                      <input value={formData.referralCode}
                        onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                        placeholder="Ex : MARIE-2026"
                        className="flex-1 bg-transparent text-[14px] font-semibold tracking-wider text-foreground placeholder:text-subtle outline-none" />
                    </div>
                    <p className="text-[10px] text-muted mt-1.5 leading-relaxed">
                      Collègue pro qui vous a recommandé ? Débloquez <strong style={{ color: "#BE185D" }}>1 semaine Premium offerte</strong>.
                    </p>
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleStep4Submit}
                    className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow mt-6">
                    Accéder à mon espace <CheckCircle2 size={18} />
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ LOGIN (with Supabase Auth) ═══ */}
        {phase === "login" && (
          <motion.div key="login" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-y-auto">
            <div className="px-8 pt-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setPhase("accountType"); setAuthError(""); }}
                  className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center"><ArrowLeft size={18} className="text-foreground" /></motion.button>
                <button onClick={() => { setLoginMode(false); setPhase("accountType"); setAuthError(""); }} className="text-[13px] text-accent font-bold">S&apos;inscrire</button>
              </div>
              <div className="bg-white rounded-[28px] p-6 shadow-card-premium">
                <h2 className="text-[24px] font-bold text-foreground tracking-tight text-center">Connexion</h2>
                <p className="text-[13px] text-muted text-center mt-2 leading-relaxed">Accédez à votre espace.</p>
                <div className="flex items-center justify-center gap-2 mt-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${acctType === "pro" ? "bg-accent-soft" : "bg-border-light"}`}>
                    {acctType === "pro" ? <Briefcase size={14} className="text-accent" /> : <User size={14} className="text-muted" />}
                  </div>
                  <span className="text-[12px] font-bold text-muted">{acctType === "pro" ? "Professionnel" : "Client"}</span>
                </div>
                <div className="mt-4 space-y-4">
                  <div><label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Email</label>
                    <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3"><Mail size={16} className="text-subtle" />
                      <input value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setAuthError(""); }}
                        type="email" placeholder="nom@exemple.com" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" /></div></div>
                  <div><label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Mot de passe</label>
                    <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3"><Lock size={16} className="text-subtle" />
                      <input value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setAuthError(""); }}
                        type={showPw ? "text" : "password"} placeholder="••••••••" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                      <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} className="text-subtle" /> : <Eye size={16} className="text-subtle" />}</button></div></div>

                  {authError && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-danger-soft rounded-xl px-4 py-3 text-[12px] text-danger font-semibold">{authError}</motion.div>
                  )}

                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleLogin} disabled={authLoading}
                    className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow">
                    {authLoading ? <Loader2 size={18} className="animate-spin" /> : <>Se connecter <ArrowRight size={18} /></>}
                  </motion.button>
                  <p className="text-[12px] text-muted text-center mt-3">
                    Nouveau ? <button onClick={() => { setLoginMode(false); setPhase("accountType"); setAuthError(""); }} className="text-accent font-bold">Créer un compte</button>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
