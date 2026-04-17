"use client";

import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect, useMemo } from "react";
import {
  User, Bell, Shield, LogOut, ChevronRight, Edit3, Headphones,
  CalendarDays, Gift, Tag, Sparkles, Rocket, Clock,
} from "lucide-react";
import SupportChat, { UnreadBadge } from "@/components/SupportChat";
import { CATEGORIES } from "@/lib/categories";

const PHOTO_STORAGE_KEY = "client-avatar";

export default function ClientAccountPage() {
  const { user, logout, appointments, userId } = useApp();

  // Unread chat messages — small badge on the "Prochain rendez-vous" hero
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    import("@/lib/chat").then(({ countUnread }) => {
      countUnread(userId).then((n) => { if (!cancelled) setUnreadMessages(n); });
    });
    return () => { cancelled = true; };
  }, [userId]);

  // Next upcoming confirmed appointment for the hero card
  const nextAppt = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return appointments
      .filter((a) => a.date >= todayStr && a.status !== "canceled")
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))[0];
  }, [appointments]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Load persisted avatar on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PHOTO_STORAGE_KEY);
      if (saved) setPhoto(saved);
    } catch {}
  }, []);

  // Scroll restoration: when returning from a sub-page, scroll the last
  // clicked item into view (centered) instead of jumping to top.
  useEffect(() => {
    try {
      const target = sessionStorage.getItem("client-account-scroll-target");
      if (!target) return;
      sessionStorage.removeItem("client-account-scroll-target");
      const id = requestAnimationFrame(() => {
        const el = document.getElementById(`account-item-${target}`);
        if (el) el.scrollIntoView({ behavior: "auto", block: "center" });
      });
      return () => cancelAnimationFrame(id);
    } catch {}
  }, []);

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
        c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(i, 0, 0, w, h);
        const dataUrl = c.toDataURL("image/jpeg", 0.8);
        setPhoto(dataUrl);
        try { localStorage.setItem(PHOTO_STORAGE_KEY, dataUrl); } catch {}
      };
      i.src = s;
    };
    r.readAsDataURL(f);
    e.target.value = "";
  }

  // Scope: client account uses clients blue as primary
  const scopeStyle = {
    ["--color-accent" as string]: CATEGORIES.clients.color,
    ["--color-accent-soft" as string]: CATEGORIES.clients.soft,
    ["--color-accent-deep" as string]: CATEGORIES.clients.deep,
  } as React.CSSProperties;

  // All menu items — every one links to a real functional page
  const compteItems = [
    { icon: User, t: "Informations personnelles", s: "Nom, email, telephone", href: "/account/info" },
  ];
  const activiteItems = [
    { icon: CalendarDays, t: "Mes reservations", s: "Historique et a venir", href: "/reservations" },
    { icon: Gift, t: "Fidelite", s: "Mes cartes et recompenses", href: "/loyalty" },
    { icon: Tag, t: "Offres", s: "Promotions et cartes cadeaux", href: "/offers" },
  ];
  const systemeItems = [
    { icon: Bell, t: "Notifications", s: "Rappels, emails et push", href: "/account/notifications" },
    { icon: Rocket, t: "Mises à jour", s: "Nouveautés et améliorations", href: "/account/updates" },
    { icon: Shield, t: "Mentions legales", s: "Confidentialite et conditions", href: "/account/legal" },
  ];

  const sections: { key: keyof typeof CATEGORIES; label: string; helper: string; items: typeof compteItems }[] = [
    { key: "clients", label: "Compte",   helper: "Vos informations personnelles et de contact.", items: compteItems },
    { key: "bookings", label: "Activité", helper: "Vos réservations, votre fidélité, vos offres.", items: activiteItems },
    { key: "system",  label: "Système",  helper: "Notifications, nouveautés et légal.", items: systemeItems },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background" style={scopeStyle}>
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Profil</h1>
        <p className="text-[12px] text-muted mt-0.5">Votre compte et vos réglages.</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center pt-2 pb-6">
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
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                <Edit3 size={14} className="text-white" />
              </motion.button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
            <h2 className="text-[24px] font-bold text-foreground tracking-tight">{user.name || "Client"}</h2>
            {user.email && <p className="text-[13px] text-muted mt-1">{user.email}</p>}
            <Link href="/account/info">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="mt-3 text-white text-[12px] font-bold px-5 py-2 rounded-xl inline-block"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                Modifier
              </motion.div>
            </Link>
          </div>

          {/* ── Next appointment hero card ── */}
          {nextAppt ? (
            <Link href={`/reservations/${nextAppt.id}`}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="rounded-[22px] p-5 text-white relative overflow-hidden mb-5"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
                  boxShadow: "0 14px 36px color-mix(in srgb, var(--color-accent) 35%, transparent)",
                }}
              >
                <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10" />
                <div className="absolute -left-6 -bottom-10 w-28 h-28 rounded-full bg-white/10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Prochain rendez-vous</p>
                  </div>
                  <p className="text-[18px] font-bold leading-tight tracking-tight">{nextAppt.title}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20 text-[11px] text-white/85 font-medium">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      {new Date(nextAppt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {nextAppt.time}
                    </span>
                  </div>
                  <div className="mt-4 bg-white rounded-xl py-2.5 px-4 flex items-center justify-between">
                    <span className="text-[12px] font-bold" style={{ color: "var(--color-accent-deep)" }}>Voir les détails</span>
                    <div className="flex items-center gap-2">
                      {unreadMessages > 0 && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, #EF4444, #BE123C)" }}>
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                      <ChevronRight size={14} style={{ color: "var(--color-accent-deep)" }} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ) : (
            <Link href="/reservations">
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl p-4 mb-5 flex items-center gap-3"
                style={{
                  background: "color-mix(in srgb, var(--color-accent) 6%, white)",
                  border: "1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)",
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))" }}>
                  <CalendarDays size={16} className="text-white" strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-accent-deep)" }}>Réservations</p>
                  <p className="text-[13px] font-bold text-foreground mt-0.5">Aucun rendez-vous à venir</p>
                </div>
                <ChevronRight size={14} className="text-accent flex-shrink-0" />
              </motion.div>
            </Link>
          )}

          {/* Settings by category */}
          {sections.map((sec) => {
            const meta = CATEGORIES[sec.key];
            return (
              <div key={sec.key} className="mb-6">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: meta.color }}>
                    {sec.label}
                  </p>
                </div>
                <p className="text-[11px] text-muted px-1 mb-2.5 leading-relaxed">{sec.helper}</p>
                <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden">
                  {sec.items.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        id={`account-item-${item.href}`}
                        href={item.href}
                        onClick={() => { try { sessionStorage.setItem("client-account-scroll-target", item.href); } catch {} }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i < sec.items.length - 1 ? "border-b border-border-light" : ""}`}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.soft }}>
                          <Icon size={17} style={{ color: meta.color }} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-foreground">{item.t}</p>
                          <p className="text-[11px] text-muted mt-0.5 truncate">{item.s}</p>
                        </div>
                        <ChevronRight size={15} className="text-border flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Support — working */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowChat(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5 text-left mb-3"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: CATEGORIES.clients.soft }}>
              <Headphones size={17} style={{ color: CATEGORIES.clients.color }} strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-foreground">Contacter le support</p>
              <p className="text-[11px] text-muted mt-0.5">Envoyez un message a notre equipe</p>
            </div>
            <UnreadBadge userId={user.email || "client-user"} />
            <ChevronRight size={15} className="text-border" />
          </motion.button>

          {/* Logout with confirmation */}
          {!showLogoutConfirm ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-danger-soft rounded-2xl py-4 flex items-center justify-center gap-2 mb-5 mt-3"
            >
              <LogOut size={17} className="text-danger" />
              <span className="text-[15px] font-bold text-danger">Se deconnecter</span>
            </motion.button>
          ) : (
            <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5 text-center mt-3">
              <p className="text-[14px] font-bold text-foreground mb-1">Se deconnecter ?</p>
              <p className="text-[12px] text-muted mb-4">Vous devrez vous reconnecter pour acceder a votre compte.</p>
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

          <div className="text-center pb-4">
            <p className="text-[10px] text-subtle">&copy; {new Date().getFullYear()} Client Base &middot; v1.0</p>
          </div>
        </div>
      </div>

      <SupportChat
        open={showChat}
        onClose={() => setShowChat(false)}
        userId={user.email || "client-user"}
        userName={user.name || "Client"}
      />
    </div>
  );
}
