"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { APP_NAME } from "@/lib/constants";
import Modal from "@/components/Modal";
import Link from "next/link";
import SupportChat from "@/components/SupportChat";
import {
  User, Save, ChevronRight, ChevronDown, LogOut, Camera, Shield, Sparkles, Gift, Lock,
  Briefcase, CalendarDays, CreditCard, Users, Globe, Send,
  SlidersHorizontal, Bell, HelpCircle, BookOpen, Rocket, BarChart3, Package,
  Receipt, FileText, Link2, Star, Percent, QrCode, MessageSquare,
} from "lucide-react";

type CategoryColor = { color: string; soft: string; deep: string };

// ── Category palette — 8 groups ──
const CAT_COLORS: Record<string, CategoryColor> = {
  etablissement: { color: "#0891B2", soft: "#ECFEFF", deep: "#164E63" }, // cyan
  reservations:  { color: "#8B5CF6", soft: "#F5F3FF", deep: "#6D28D9" }, // purple
  services:      { color: "#3B82F6", soft: "#EFF6FF", deep: "#1D4ED8" }, // blue
  messages:      { color: "#F59E0B", soft: "#FFFBEB", deep: "#B45309" }, // amber
  paiements:     { color: "#16A34A", soft: "#F0FDF4", deep: "#15803D" }, // green
  promotions:    { color: "#EC4899", soft: "#FDF2F8", deep: "#BE185D" }, // rose
  rapports:      { color: "#EF4444", soft: "#FEF2F2", deep: "#B91C1C" }, // red
  compte:        { color: "#71717A", soft: "#F4F4F5", deep: "#3F3F46" }, // zinc
};

interface SettingItem {
  icon: typeof User;
  t: string;
  s: string;
  href: string;
}

interface Section {
  key: keyof typeof CAT_COLORS;
  label: string;
  helper: string;
  items: SettingItem[];
}

export default function ProfilePage() {
  const { user, userId, updateUser, logout } = useApp();

  // Hydrate beta status from localStorage cache to avoid flicker
  const [cachedBetaStatus, setCachedBetaStatus] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    try {
      const v = localStorage.getItem(`beta-status-cache:${userId}`);
      if (v) setCachedBetaStatus(v);
    } catch {}
  }, [userId]);
  const effectiveBetaStatus: typeof user.betaStatus =
    user.betaStatus ?? (cachedBetaStatus ? (cachedBetaStatus as unknown as typeof user.betaStatus) : undefined);

  const [showEdit, setShowEdit] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [form, setForm] = useState({ name: user.name, business: user.business, phone: user.phone, email: user.email });
  const [photo, setPhoto] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Force violet accent on mount (removes any stale personalization)
  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent", "#5B4FE9");
    try { localStorage.removeItem("accent-color"); } catch {}
  }, []);

  // Scroll restoration when returning from a sub-page
  useEffect(() => {
    try {
      const target = sessionStorage.getItem("profile-scroll-target");
      if (!target) return;
      sessionStorage.removeItem("profile-scroll-target");
      const id = requestAnimationFrame(() => {
        const el = document.getElementById(`profile-item-${target}`);
        if (el) el.scrollIntoView({ behavior: "auto", block: "center" });
      });
      return () => cancelAnimationFrame(id);
    } catch {}
  }, []);

  function handleSave() {
    updateUser({
      name: form.name.trim(),
      business: form.business.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    });
    setShowEdit(false);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const s = ev.target?.result as string;
      if (!s) return;
      const i = new Image();
      i.onload = () => {
        const c = document.createElement("canvas");
        const m = 200;
        let w = i.width, h = i.height;
        if (w > h) { h = (h / w) * m; w = m; } else { w = (w / h) * m; h = m; }
        c.width = w;
        c.height = h;
        c.getContext("2d")!.drawImage(i, 0, 0, w, h);
        setPhoto(c.toDataURL("image/jpeg", 0.8));
      };
      i.src = s;
    };
    r.readAsDataURL(f);
    e.target.value = "";
  }

  // ── Sections — essentiels en haut, le reste en dessous ──
  const sections: Section[] = [
    {
      key: "reservations",
      label: "Mes rendez-vous",
      helper: "L'essentiel pour recevoir des réservations.",
      items: [
        { icon: Link2,        t: "Lien de réservation", s: "L'adresse à partager avec vos clients", href: "/settings/booking-link" },
        { icon: CalendarDays, t: "Mes horaires", s: "Jours travaillés, pauses, fermetures", href: "/settings/availability" },
        { icon: Shield,       t: "Règles", s: "Annulation, délai minimum", href: "/settings/booking-rules" },
      ],
    },
    {
      key: "services",
      label: "Mes services & stock",
      helper: "Ce que vous proposez et vos produits.",
      items: [
        { icon: Sparkles, t: "Mes services", s: "Prestations, durées, prix", href: "/settings/services" },
        { icon: Package,  t: "Stock",        s: "Produits en stock et alertes", href: "/settings/stock" },
      ],
    },
    {
      key: "etablissement",
      label: "Mon établissement",
      helper: "Votre identité et votre QR code.",
      items: [
        { icon: Briefcase, t: "Mes informations", s: "Nom, adresse, contacts", href: "/settings/info" },
        { icon: QrCode,    t: "Carte de visite QR", s: "Code à imprimer pour votre comptoir", href: "/settings/qr-code" },
      ],
    },
    {
      key: "messages",
      label: "Messages & notifications",
      helper: "Ce que reçoivent vos clients (et vous).",
      items: [
        { icon: Send, t: "Messages automatiques", s: "Confirmation, rappel, remerciement", href: "/settings/messages" },
        { icon: Bell, t: "Mes alertes",           s: "Notifications reçues sur votre téléphone", href: "/settings/notifications" },
      ],
    },
    {
      key: "paiements",
      label: "Paiements & facturation",
      helper: "Arrive prochainement.",
      items: [
        { icon: CreditCard, t: "Encaissement",       s: "Modes de paiement acceptés", href: "/settings/payments" },
        { icon: Receipt,    t: "Mes factures",       s: "Numérotation et mentions sur le PDF", href: "/settings/invoice" },
        { icon: FileText,   t: "Taxes",              s: "Régime de TVA et déclarations", href: "/settings/taxes" },
        { icon: Receipt,    t: "Exports comptables", s: "Rapports pour votre comptable", href: "/settings/accounting" },
      ],
    },
    {
      key: "promotions",
      label: "Promotions & parrainage",
      helper: "Outils marketing pour fidéliser.",
      items: [
        { icon: Percent,  t: "Promotions",       s: "Offres spéciales à envoyer", href: "/settings/promotions" },
        { icon: Gift,     t: "Carte de fidélité", s: "Récompenses pour vos habitués", href: "/loyalty-manage" },
        { icon: Users,    t: "Parrainage",       s: "Inviter des amis à rejoindre", href: "/settings/referral" },
      ],
    },
    {
      key: "rapports",
      label: "Rapports",
      helper: "Tableaux de bord et statistiques.",
      items: [
        { icon: BarChart3, t: "Statistiques", s: "Revenus, nombre de rendez-vous", href: "/settings/analytics" },
      ],
    },
    {
      key: "compte",
      label: "Mon compte",
      helper: "Préférences, aide et nouveautés.",
      items: [
        { icon: SlidersHorizontal, t: "Préférences", s: "Apparence, langue, données", href: "/settings/preferences" },
        { icon: HelpCircle,        t: "Besoin d'aide ?", s: "FAQ et nous contacter", href: "/settings/help" },
        { icon: BookOpen,          t: "Découvrir l'app", s: "Visite guidée en 2 minutes", href: "/guide" },
        { icon: Rocket,            t: "Nouveautés", s: "Ce qui a changé récemment", href: "/settings/updates" },
      ],
    },
  ];

  // Add Beta testeur dynamically in Outils
  const betaItem: SettingItem =
    effectiveBetaStatus === "approved"
      ? { icon: Sparkles, t: "Espace bêta", s: "Signalements, avis, suggestions", href: "/beta-space" }
      : effectiveBetaStatus === "pending"
        ? { icon: Sparkles, t: "Bêta testeur", s: "Demande en cours d'examen", href: "/settings/beta-tester" }
        : effectiveBetaStatus === "rejected"
          ? { icon: Sparkles, t: "Bêta testeur", s: "Refaire une demande", href: "/settings/beta-tester" }
          : { icon: Sparkles, t: "Devenir bêta testeur", s: "Accès anticipé + canal privé", href: "/settings/beta-tester" };
  sections[sections.length - 1].items.push(betaItem);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background">
      <div className="flex-shrink-0">
        <header className="px-6 pt-5 pb-3">
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Profil</h1>
          <p className="text-[12px] text-muted mt-0.5">Votre compte et tous vos réglages.</p>
        </header>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* ═══ Avatar + edit ═══ */}
          <div className="flex flex-col items-center text-center pt-2 pb-5">
            <div className="relative mb-4">
              <div className="w-[110px] h-[110px] rounded-full overflow-hidden shadow-apple-lg">
                {photo ? (
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-border-light flex items-center justify-center">
                    <User size={44} className="text-muted" />
                  </div>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => photoRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-sm border-[3px] border-background"
                style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)" }}
              >
                <Camera size={14} className="text-white" />
              </motion.button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
            <h2 className="text-[24px] font-bold text-foreground tracking-tight">{user.name || APP_NAME}</h2>
            {user.business && <p className="text-[14px] text-muted mt-1">{user.business}</p>}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setForm({ name: user.name, business: user.business, phone: user.phone, email: user.email });
                setShowEdit(true);
              }}
              className="mt-3 text-white text-[12px] font-bold px-5 py-2 rounded-xl"
              style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 8px 20px rgba(91,79,233,0.28)" }}
            >
              Modifier mon identité
            </motion.button>
          </div>

          {/* ═══ Subscription / Beta hero ═══ */}
          {effectiveBetaStatus === "approved" ? (
            <Link href="/beta-space">
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-[22px] p-5 text-left mb-4 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                  boxShadow: "0 14px 36px rgba(139, 92, 246, 0.42), 0 4px 12px rgba(139, 92, 246, 0.2)",
                }}
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -right-4 -bottom-12 w-28 h-28 rounded-full bg-white/10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <p className="text-[10px] text-white/85 font-bold uppercase tracking-[0.14em]">Accès exclusif</p>
                  </div>
                  <h3 className="text-[22px] font-bold text-white tracking-tight leading-tight">Espace bêta testeur</h3>
                  <p className="text-[12px] text-white/85 mt-2 leading-relaxed max-w-[280px]">
                    Signalez des bugs, partagez vos idées, découvrez les nouveautés avant tout le monde.
                  </p>
                  <div className="mt-4 bg-white rounded-xl py-3 px-4 flex items-center justify-between">
                    <span className="text-[13px] font-bold" style={{ color: "#6D28D9" }}>Accéder à l&apos;espace bêta</span>
                    <Sparkles size={14} style={{ color: "#6D28D9" }} strokeWidth={2.5} />
                  </div>
                </div>
              </motion.div>
            </Link>
          ) : (
            <Link href="/subscription">
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-[22px] p-5 text-left mb-4 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                  boxShadow: "0 14px 36px rgba(91,79,233,0.35)",
                }}
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
                <div className="relative z-10">
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-1">Abonnement</p>
                  <h3 className="text-[20px] font-bold text-white">
                    {(() => {
                      const names: Record<string, string> = { essentiel: "Essentiel", croissance: "Croissance", entreprise: "Entreprise" };
                      return names[user.plan || "essentiel"] || "Essentiel";
                    })()}
                  </h3>
                  <div className="flex items-end gap-1 mt-1 mb-3">
                    <p className="text-[28px] font-bold text-white leading-none">
                      {(() => {
                        const p: Record<string, string> = { essentiel: "0", croissance: "9,99", entreprise: "19,99" };
                        return p[user.plan || "essentiel"] ?? "0";
                      })()}€
                    </p>
                    <p className="text-[13px] text-white/70 mb-0.5">/ mois</p>
                  </div>
                  <div className="bg-white rounded-xl py-2.5 text-center">
                    <span className="text-[13px] font-bold" style={{ color: "#3B30B5" }}>Gérer l&apos;abonnement</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          )}

          {/* ═══ Referral hero ═══ */}
          <Link href="/settings/referral">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl p-5 mb-6 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #F3F0FF 0%, #EEF0FF 100%)",
                border: "1px solid #E0DCFF",
              }}
            >
              <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full" style={{ backgroundColor: "rgba(139, 92, 246, 0.08)" }} />
              <div className="relative z-10 flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", boxShadow: "0 6px 18px rgba(139, 92, 246, 0.35)" }}
                >
                  <Gift size={20} className="text-white" strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#8B5CF6" }} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6D28D9" }}>Parrainage pro</p>
                  </div>
                  <h3 className="text-[18px] font-bold text-foreground tracking-tight leading-tight">Parlez-en à vos collègues</h3>
                  <p className="text-[12px] text-muted mt-1.5 leading-relaxed max-w-[260px]">
                    1 pro invité = <strong style={{ color: "#6D28D9" }}>1 mois Premium offert</strong>. Votre ami reçoit 1 semaine gratuite.
                  </p>
                </div>
              </div>
              <div
                className="relative z-10 mt-4 flex items-center gap-2 text-white rounded-xl px-4 py-2.5"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)" }}
              >
                <span className="text-[13px] font-bold flex-1">Commencer à parrainer</span>
                <ChevronRight size={15} className="text-white" strokeWidth={2.5} />
              </div>
            </motion.div>
          </Link>

          {/* ═══ Categories — some collapsed, "Paiements" locked for non-beta ═══ */}
          {sections.map((sec) => {
            const palette = CAT_COLORS[sec.key];
            const isCollapsible = sec.key === "compte" || sec.key === "rapports";
            const isExpanded = !isCollapsible || showMore;
            // Lock the Paiements section for non-beta pros. The blur lifts
            // automatically for approved beta testers — they see the bypass
            // via the coming-soon pattern already in place elsewhere.
            const isLocked = sec.key === "paiements" && effectiveBetaStatus !== "approved";

            return (
              <div key={sec.key} className="mb-6">
                {isCollapsible ? (
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowMore((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 mb-2 px-1"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: palette.color }} />
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: palette.color }}>
                        {sec.label}
                      </p>
                    </div>
                    <ChevronDown
                      size={14}
                      className="text-muted transition-transform"
                      style={{ transform: showMore ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </motion.button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: palette.color }} />
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: palette.color }}>
                        {sec.label}
                      </p>
                    </div>
                    <p className="text-[12px] text-muted px-1 mb-2.5 leading-relaxed">{sec.helper}</p>
                  </>
                )}

                {isExpanded && (
                  <div className="relative">
                    <div
                      className={`bg-white rounded-2xl shadow-card-premium overflow-hidden ${isLocked ? "pointer-events-none select-none" : ""}`}
                      style={{
                        filter: isLocked ? "blur(3px)" : undefined,
                        opacity: isLocked ? 0.55 : 1,
                        transition: "filter 0.25s, opacity 0.25s",
                      }}
                      aria-hidden={isLocked}
                    >
                      {sec.items.map((s, i) => {
                        const Icon = s.icon;
                        const rowClass = `w-full flex items-center gap-3 px-4 py-3.5 text-left ${i < sec.items.length - 1 ? "border-b border-border-light" : ""}`;
                        const rowContent = (
                          <>
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: palette.soft }}
                            >
                              <Icon size={17} style={{ color: palette.color }} strokeWidth={2.2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-foreground">{s.t}</p>
                              <p className="text-[12px] text-muted mt-0.5 truncate">{s.s}</p>
                            </div>
                            <ChevronRight size={15} className="text-border flex-shrink-0" />
                          </>
                        );
                        // When locked, render as a non-interactive div (no Link at all).
                        // Prevents any chance of Next.js routing firing on click, keyboard
                        // Enter, or prefetch triggering a navigation attempt.
                        if (isLocked) {
                          return (
                            <div key={s.href} className={rowClass}>
                              {rowContent}
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={s.href}
                            id={`profile-item-${s.href}`}
                            href={s.href}
                            onClick={() => { try { sessionStorage.setItem("profile-scroll-target", s.href); } catch {} }}
                            className={rowClass}
                          >
                            {rowContent}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Overlay lock — "Arrive prochainement" */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto flex flex-col items-center gap-2 px-5 py-4 rounded-2xl bg-white"
                          style={{
                            boxShadow: "0 16px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(91,79,233,0.12)",
                            border: "1px solid color-mix(in srgb, var(--color-primary) 15%, white)",
                          }}
                        >
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)" }}
                          >
                            <Lock size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.2} />
                          </div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--color-primary)" }}>
                            Arrive prochainement
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Support chat */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowChat(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3 mb-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <MessageSquare size={17} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-foreground">Contacter le support</p>
              <p className="text-[11px] text-muted mt-0.5">Message direct à notre équipe</p>
            </div>
            <ChevronRight size={15} className="text-border" />
          </motion.button>

          {/* Legal */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLegal(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3 mb-3"
          >
            <Shield size={16} className="text-muted" />
            <span className="text-[13px] font-semibold text-foreground flex-1">Mentions légales</span>
            <ChevronRight size={15} className="text-border" />
          </motion.button>

          {/* Logout */}
          {!showLogoutConfirm ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-danger-soft rounded-2xl py-4 flex items-center justify-center gap-2 mb-5"
            >
              <LogOut size={17} className="text-danger" />
              <span className="text-[15px] font-bold text-danger">Se déconnecter</span>
            </motion.button>
          ) : (
            <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5 text-center">
              <p className="text-[14px] font-bold text-foreground mb-1">Se déconnecter ?</p>
              <p className="text-[12px] text-muted mb-4">Vous devrez vous reconnecter pour accéder à votre compte.</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-border-light py-3 rounded-xl text-[13px] font-bold text-foreground"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={logout}
                  className="flex-1 bg-danger text-white py-3 rounded-xl text-[13px] font-bold"
                >
                  Confirmer
                </motion.button>
              </div>
            </div>
          )}

          <div className="text-center pb-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-[10px] text-subtle">
              <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Mentions legales</a>
              <span>·</span>
              <a href="/cgu" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">CGU</a>
              <span>·</span>
              <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Confidentialite</a>
            </div>
            <p className="text-[10px] text-subtle">&copy; {new Date().getFullYear()} Client Base · v1.0</p>
          </div>
        </div>
      </div>

      {/* ═══ Edit profile modal ═══ */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier le profil">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-[80px] h-[80px] rounded-full overflow-hidden">
                {photo ? (
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-border-light flex items-center justify-center">
                    <User size={32} className="text-muted" />
                  </div>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => photoRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)" }}
              >
                <Camera size={11} className="text-white" />
              </motion.button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Nom</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Activité</label>
              <input value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Téléphone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" className="input-field" />
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="input-field" />
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 mt-4"
            style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 10px 24px rgba(91,79,233,0.32)" }}
          >
            <Save size={15} /> Enregistrer
          </motion.button>
        </div>
      </Modal>

      {/* ═══ Legal modal ═══ */}
      <Modal open={showLegal} onClose={() => setShowLegal(false)} title="Mentions légales" size="large">
        <div className="space-y-5">
          {[
            ["Mentions légales", "Client Base : app de gestion pour indépendants. Fournie en l'état."],
            ["Conditions générales", "Service réservé aux professionnels majeurs. Résiliation à tout moment."],
            ["Confidentialité", "Données chiffrées SSL. Conforme RGPD. Jamais partagées."],
          ].map(([t, d], i) => (
            <div key={i}>
              <h3 className="text-[14px] font-bold text-foreground mb-2">{t}</h3>
              <div className="bg-border-light rounded-2xl p-4">
                <p className="text-[12px] text-muted leading-relaxed">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Support chat */}
      <SupportChat
        open={showChat}
        onClose={() => setShowChat(false)}
        userId={user.email || "pro-user"}
        userName={user.name || "Professionnel"}
      />
    </div>
  );
}
