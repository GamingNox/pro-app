"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Sparkles, CalendarDays, BarChart3, Users,
  Briefcase, User, Mail, Lock, Eye, EyeOff, Star, Shield, CheckCircle2, Play, Crown,
} from "lucide-react";

type Phase = "slides" | "landing" | "accountType" | "signup" | "login" | "demo";
type AcctType = "pro" | "client";

const SLIDES = [
  { title: "Bienvenue", desc: "On va t'aider à prendre en main ton activité avec une expérience fluide et sur mesure.", icon: Sparkles },
  { title: "Votre Tableau de Bord", desc: "Suivez votre CA, vos notifications et accédez à vos raccourcis en un clin d'œil.", icon: BarChart3 },
  { title: "Rendez-vous & Clients", desc: "Organisez votre planning et gérez vos clients en quelques secondes.", icon: CalendarDays },
  { title: "Gestion Complète", desc: "Factures, paiements, stock et analyse — tout au même endroit.", icon: Briefcase },
];

export default function OnboardingPage() {
  const [phase, setPhase] = useState<Phase>("slides");
  const [slide, setSlide] = useState(0);
  const [acctType, setAcctType] = useState<AcctType>("pro");
  const [showPw, setShowPw] = useState(false);
  const [loginMode, setLoginMode] = useState(false); // true when coming from "Me reconnecter"
  const [formData, setFormData] = useState({ name: "", business: "", company: "", email: "", password: "" });

  const { completeOnboarding, updateUser } = useApp();
  const router = useRouter();

  function nextSlide() {
    if (slide < SLIDES.length - 1) setSlide((s) => s + 1);
    else setPhase("landing");
  }
  function prevSlide() { if (slide > 0) setSlide((s) => s - 1); }

  function handleSignup() {
    if (!formData.name.trim() || !formData.email.trim()) return;
    // Clear any stale demo flags
    localStorage.removeItem("demo-mode");
    updateUser({
      name: formData.name.trim(),
      business: acctType === "pro" ? formData.business.trim() || formData.company.trim() : "",
      email: formData.email.trim(),
      accountType: acctType,
    });
    completeOnboarding();
    router.replace(acctType === "client" ? "/client-home" : "/");
  }

  function handleLogin() {
    if (!formData.email.trim()) return;
    // Clear any stale demo flags
    localStorage.removeItem("demo-mode");
    updateUser({
      name: formData.name.trim() || "Mon Activité",
      email: formData.email.trim(),
      accountType: acctType,
    });
    completeOnboarding();
    router.replace(acctType === "client" ? "/client-home" : "/");
  }

  function skip() {
    updateUser({ name: "Mon Activité", business: "" });
    completeOnboarding();
    router.replace("/");
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto bg-background">
      <AnimatePresence mode="wait">

        {/* ═══ SLIDES ═══ */}
        {phase === "slides" && (
          <motion.div key="slides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -60 }}
            className="flex-1 flex flex-col">
            <div className="flex justify-end px-6 pt-4">
              <button onClick={() => setPhase("landing")} className="text-[13px] text-accent font-bold">Passer</button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <AnimatePresence mode="wait">
                <motion.div key={slide} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.25 }} className="flex flex-col items-center text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                    className="w-24 h-24 rounded-[28px] bg-accent-soft flex items-center justify-center mb-8 shadow-apple">
                    {(() => { const Icon = SLIDES[slide].icon; return <Icon size={40} className="text-accent" />; })()}
                  </motion.div>
                  <h2 className="text-[26px] font-bold text-foreground tracking-tight">{SLIDES[slide].title}</h2>
                  <p className="text-[15px] text-muted leading-relaxed mt-3 max-w-[300px]">{SLIDES[slide].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-8 pb-8">
              <div className="flex items-center justify-center gap-2 mb-5">
                {SLIDES.map((_, i) => (
                  <motion.div key={i} className={`h-[4px] rounded-full ${i === slide ? "bg-accent" : "bg-border"}`}
                    animate={{ width: i === slide ? 24 : 6 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                ))}
              </div>
              <p className="text-[10px] text-muted text-center font-bold uppercase tracking-wider mb-4">Étape {slide + 1} sur {SLIDES.length}</p>
              <div className="flex gap-3">
                {slide > 0 && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={prevSlide}
                    className="w-14 h-14 rounded-2xl bg-border-light flex items-center justify-center">
                    <ArrowLeft size={20} className="text-muted" />
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.97 }} onClick={nextSlide}
                  className="flex-1 bg-accent text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2">
                  Suivant <ArrowRight size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ LANDING (auth choice) — vertically centered ═══ */}
        {phase === "landing" && (
          <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-8">

            {/* Admin access — top right crown icon */}
            <div className="flex justify-end pt-4">
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => router.push("/admin-login")}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle/40 hover:text-muted transition-colors">
                <Crown size={16} />
              </motion.button>
            </div>

            {/* Spacer top — pushes content to visual center */}
            <div className="flex-1 min-h-[40px]" />

            {/* Centered content block */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="w-24 h-24 rounded-full bg-accent-soft flex items-center justify-center shadow-apple-lg">
                  <Sparkles size={38} className="text-accent" />
                </div>
                <div className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-success border-2 border-background" />
              </div>

              <h1 className="text-[24px] font-bold text-foreground tracking-tight leading-tight">
                Bonjour, je suis votre<br/><span className="text-accent">assistant professionnel.</span>
              </h1>
              <p className="text-[13px] text-muted mt-2.5 leading-relaxed max-w-[280px]">
                Comment puis-je vous accompagner dans la gestion de votre activité ?
              </p>
            </div>

            {/* Buttons */}
            <div className="w-full mt-7 space-y-2.5">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase("accountType")}
                className="w-full bg-accent-gradient text-white py-4.5 rounded-2xl flex flex-col items-center gap-0.5 fab-shadow">
                <Sparkles size={18} className="text-white/80" />
                <span className="text-[15px] font-bold">Commencer l&apos;aventure</span>
                <span className="text-[11px] text-white/60">Créez votre compte gratuit</span>
              </motion.button>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setLoginMode(true); setPhase("accountType"); }}
                className="w-full bg-white py-4 rounded-2xl flex flex-col items-center gap-0.5 shadow-card-premium">
                <ArrowRight size={18} className="text-foreground" />
                <span className="text-[14px] font-bold text-foreground">Me reconnecter</span>
                <span className="text-[11px] text-muted">Accédez à votre espace</span>
              </motion.button>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase("demo")}
                className="w-full bg-border-light py-4 rounded-2xl flex flex-col items-center gap-0.5">
                <Play size={18} className="text-accent" />
                <span className="text-[14px] font-bold text-foreground">Voir la démo</span>
                <span className="text-[11px] text-muted">Explorez sans créer de compte</span>
              </motion.button>
            </div>

            {/* Social proof */}
            <div className="mt-6 flex flex-col items-center">
              <div className="flex -space-x-2">
                {["#7C3AED", "#3B82F6", "#10B981"].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: c }}>
                    {["A", "M", "S"][i]}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full bg-accent-soft border-2 border-background flex items-center justify-center text-accent text-[8px] font-bold">+2k</div>
              </div>
              <p className="text-[10px] text-muted mt-1.5 flex items-center gap-1"><Star size={9} className="text-warning" /> 2 000+ professionnels</p>
            </div>

            {/* Footer — flexible bottom */}
            <div className="flex-1 min-h-[40px]" />
            <div className="pb-5 text-center">
              <p className="text-[9px] text-subtle">© 2024 Lumière Pro</p>
              <div className="flex items-center justify-center gap-3 mt-1">
                {["Confidentialité", "Conditions", "Support"].map((l) => (
                  <span key={l} className="text-[9px] text-muted">{l}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ DEMO TYPE SELECTION ═══ */}
        {phase === "demo" && (
          <motion.div key="demo" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-8 pt-6">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPhase("landing")}
              className="self-start w-9 h-9 rounded-xl bg-border-light flex items-center justify-center mb-6">
              <ArrowLeft size={18} className="text-foreground" />
            </motion.button>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-5">
                <Play size={28} className="text-accent" />
              </div>
              <h2 className="text-[24px] font-bold text-foreground tracking-tight text-center">Choisissez votre démo</h2>
              <p className="text-[14px] text-muted mt-2 text-center leading-relaxed max-w-[280px]">
                Explorez l&apos;application avec des données fictives.
              </p>

              <div className="w-full mt-8 space-y-4">
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => {
                  localStorage.setItem("demo-mode", "true");
                  updateUser({ name: "Marie Dupont", business: "Consultante", email: "marie@demo.com", accountType: "pro" });
                  completeOnboarding();
                  router.replace("/");
                }}
                  className="w-full bg-white rounded-2xl p-5 shadow-card-premium text-left flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                    <Briefcase size={22} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-foreground">Démo Professionnel</p>
                    <p className="text-[12px] text-muted mt-1 leading-relaxed">Dashboard, rendez-vous, clients, factures et stock.</p>
                  </div>
                </motion.button>

                <motion.button whileTap={{ scale: 0.98 }} onClick={() => {
                  localStorage.setItem("demo-mode", "true");
                  updateUser({ name: "Julien Lefebvre", business: "", email: "julien@demo.com", accountType: "client" });
                  completeOnboarding();
                  router.replace("/client-home");
                }}
                  className="w-full bg-white rounded-2xl p-5 shadow-card-premium text-left flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-border-light flex items-center justify-center flex-shrink-0">
                    <User size={22} className="text-muted" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-foreground">Démo Client</p>
                    <p className="text-[12px] text-muted mt-1 leading-relaxed">Réservations, fidélité, offres et cartes cadeaux.</p>
                  </div>
                </motion.button>
              </div>
            </div>

            <div className="pb-8 text-center">
              <p className="text-[11px] text-muted">Aucun compte nécessaire. Données fictives.</p>
            </div>
          </motion.div>
        )}

        {/* ═══ ACCOUNT TYPE SELECTION ═══ */}
        {phase === "accountType" && (
          <motion.div key="acctType" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-8 pt-6">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setLoginMode(false); setPhase("landing"); }}
              className="self-start w-9 h-9 rounded-xl bg-border-light flex items-center justify-center mb-6">
              <ArrowLeft size={18} className="text-foreground" />
            </motion.button>

            <h2 className="text-[24px] font-bold text-foreground tracking-tight">
              {loginMode ? "Quel type de compte ?" : "Choisissez votre profil"}
            </h2>
            <p className="text-[14px] text-muted mt-2 leading-relaxed">
              {loginMode ? "Sélectionnez votre type de compte pour continuer." : "Comment allez-vous utiliser Lumière Pro ?"}
            </p>

            <div className="mt-8 space-y-4">
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setAcctType("pro"); setPhase(loginMode ? "login" : "signup"); }}
                className="w-full bg-white rounded-2xl p-5 shadow-card-premium text-left flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                  <Briefcase size={22} className="text-accent" />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-foreground">Compte professionnel</p>
                  <p className="text-[12px] text-muted mt-1 leading-relaxed">Gérez vos clients, rendez-vous, factures et stock.</p>
                </div>
              </motion.button>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setAcctType("client"); setPhase(loginMode ? "login" : "signup"); }}
                className="w-full bg-white rounded-2xl p-5 shadow-card-premium text-left flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-border-light flex items-center justify-center flex-shrink-0">
                  <User size={22} className="text-muted" />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-foreground">Compte client</p>
                  <p className="text-[12px] text-muted mt-1 leading-relaxed">Réservez en ligne et suivez vos rendez-vous.</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ SIGNUP ═══ */}
        {phase === "signup" && (
          <motion.div key="signup" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-y-auto">
            <div className="px-8 pt-6 pb-8">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPhase("accountType")}
                className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center mb-6">
                <ArrowLeft size={18} className="text-foreground" />
              </motion.button>

              <h2 className="text-[24px] font-bold text-foreground tracking-tight">
                {acctType === "pro" ? "Créer votre espace pro" : "Créer votre compte"}
              </h2>
              <p className="text-[14px] text-muted mt-2">Commencez gratuitement en quelques secondes.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom complet</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                    <User size={16} className="text-subtle" />
                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Marie Dupont" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                  </div>
                </div>

                {acctType === "pro" && (
                  <>
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Activité</label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <Briefcase size={16} className="text-subtle" />
                        <input value={formData.business} onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                          placeholder="Consultante, coiffeuse..." className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Entreprise <span className="text-subtle font-normal">(optionnel)</span></label>
                      <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                        <Briefcase size={16} className="text-subtle" />
                        <input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Nom de l'entreprise" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Adresse e-mail</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                    <Mail size={16} className="text-subtle" />
                    <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      type="email" placeholder="nom@exemple.com" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Mot de passe</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                    <Lock size={16} className="text-subtle" />
                    <input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      type={showPw ? "text" : "password"} placeholder="••••••••" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                    <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} className="text-subtle" /> : <Eye size={16} className="text-subtle" />}</button>
                  </div>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSignup}
                  className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow mt-2">
                  Créer mon compte <ArrowRight size={18} />
                </motion.button>

                <p className="text-[12px] text-muted text-center mt-3">
                  Déjà un compte ? <button onClick={() => setPhase("login")} className="text-accent font-bold">Se connecter</button>
                </p>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <div className="flex items-center gap-1"><Shield size={12} className="text-muted" /><span className="text-[10px] text-muted">RGPD</span></div>
                <div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-muted" /><span className="text-[10px] text-muted">SSL</span></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ LOGIN ═══ */}
        {phase === "login" && (
          <motion.div key="login" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-y-auto">
            <div className="px-8 pt-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPhase("accountType")}
                  className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center">
                  <ArrowLeft size={18} className="text-foreground" />
                </motion.button>
                <button onClick={() => { setLoginMode(false); setPhase("accountType"); }} className="text-[13px] text-accent font-bold">S&apos;inscrire</button>
              </div>

              <div className="bg-white rounded-[28px] p-6 shadow-card-premium">
                <h2 className="text-[24px] font-bold text-foreground tracking-tight text-center">Gérez votre activité simplement</h2>
                <p className="text-[13px] text-muted text-center mt-2 leading-relaxed">Accédez à votre espace et pilotez votre activité.</p>

                {/* Account type indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${acctType === "pro" ? "bg-accent-soft" : "bg-border-light"}`}>
                    {acctType === "pro" ? <Briefcase size={14} className="text-accent" /> : <User size={14} className="text-muted" />}
                  </div>
                  <span className="text-[12px] font-bold text-muted">
                    {acctType === "pro" ? "Compte professionnel" : "Compte client"}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Adresse e-mail</label>
                    <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                      <Mail size={16} className="text-subtle" />
                      <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        type="email" placeholder="nom@exemple.com" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] text-muted font-bold uppercase tracking-wider">Mot de passe</label>
                      <button className="text-[11px] text-accent font-bold">Oublié ?</button>
                    </div>
                    <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                      <Lock size={16} className="text-subtle" />
                      <input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        type={showPw ? "text" : "password"} placeholder="••••••••" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
                      <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} className="text-subtle" /> : <Eye size={16} className="text-subtle" />}</button>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogin}
                    className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow">
                    Se connecter <ArrowRight size={18} />
                  </motion.button>

                  <p className="text-[12px] text-muted text-center mt-3">
                    Nouveau ? <button onClick={() => { setLoginMode(false); setPhase("accountType"); }} className="text-accent font-bold">Créer un compte</button>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="flex items-center gap-1"><Shield size={12} className="text-muted" /><span className="text-[10px] text-muted">RGPD</span></div>
                <div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-muted" /><span className="text-[10px] text-muted">SSL</span></div>
              </div>

              {/* Admin access moved to crown icon on landing page */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
