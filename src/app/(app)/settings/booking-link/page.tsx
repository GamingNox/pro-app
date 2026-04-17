"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Share2, Globe, CalendarDays, Info } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";
import Link from "next/link";

export default function SettingsBookingLinkPage() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [calCopied, setCalCopied] = useState(false);

  const bUrl = user.bookingSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${user.bookingSlug}`
    : null;

  const calUrl = user.bookingSlug
    ? `${typeof window !== "undefined" ? window.location.origin : "https://clientbase.fr"}/api/ics/${user.bookingSlug}`
    : null;

  function copyLink() {
    if (!bUrl) return;
    navigator.clipboard.writeText(bUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyCalUrl() {
    if (!calUrl) return;
    navigator.clipboard.writeText(calUrl);
    setCalCopied(true);
    setTimeout(() => setCalCopied(false), 2000);
  }

  async function shareLink() {
    if (!bUrl) return;
    const text = `Prenez rendez-vous avec ${user.business || user.name || "moi"}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: user.business || user.name || "Réservation", text, url: bUrl });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  }

  if (!bUrl) {
    return (
      <SettingsPage
        category="Réservations"
        title="Lien de réservation"
        description="Votre lien unique pour que vos clients réservent en ligne."
      >
        <div className="bg-white rounded-2xl p-8 text-center shadow-card-premium">
          <div className="w-14 h-14 rounded-2xl bg-border-light flex items-center justify-center mx-auto mb-4">
            <Globe size={26} className="text-muted" />
          </div>
          <p className="text-[15px] font-bold text-foreground">Lien pas encore disponible</p>
          <p className="text-[13px] text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
            Complétez votre profil pour activer votre lien de réservation.
          </p>
        </div>
      </SettingsPage>
    );
  }

  const displayUrl = bUrl.replace(/^https?:\/\//, "");

  return (
    <SettingsPage
      category="Réservations"
      title="Lien de réservation"
      description="Votre lien unique pour que vos clients réservent en ligne."
    >
      {/* ═══ Votre lien — en vedette ═══ */}
      <div
        className="rounded-[22px] p-5 mb-5 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
          boxShadow: "0 14px 40px color-mix(in srgb, var(--color-primary) 35%, transparent)",
        }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">Votre lien</p>
          <p className="text-[16px] font-bold text-white mt-1 leading-tight break-all">{displayUrl}</p>

          <div className="flex gap-2 mt-4">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={copyLink}
              className="flex-1 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 bg-white"
              style={{ color: "var(--color-primary-deep)" }}
            >
              {copied ? <><Check size={14} strokeWidth={2.8} /> Copié</> : <><Copy size={14} strokeWidth={2.5} /> Copier</>}
            </motion.button>
            <Link href={bUrl} target="_blank" className="flex-1">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 bg-white/15 backdrop-blur-sm text-white"
              >
                <ExternalLink size={14} strokeWidth={2.5} /> Voir
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ Synchronisation calendrier ═══ */}
      <SettingsSection
        title="Synchroniser avec votre calendrier"
        description="Recevez vos RDV Clientbase dans Google Calendar, Apple Calendar ou Outlook."
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary-soft)" }}>
            <CalendarDays size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground">Lien iCalendar</p>
            <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
              Copiez ce lien, ajoutez-le dans votre calendrier. Vos RDV s&apos;y ajoutent automatiquement.
            </p>
          </div>
        </div>

        {calUrl && (
          <>
            <div className="bg-border-light rounded-xl px-3.5 py-3 text-[11px] text-muted break-all font-mono leading-relaxed mb-3">
              {calUrl}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={copyCalUrl}
              className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5"
              style={{
                background: calCopied ? "#D1FAE5" : "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                color: calCopied ? "#047857" : "white",
                boxShadow: calCopied ? "none" : "0 8px 20px color-mix(in srgb, var(--color-primary) 25%, transparent)",
              }}
            >
              {calCopied ? <><Check size={14} strokeWidth={2.8} /> Copié</> : <><Copy size={14} strokeWidth={2.5} /> Copier le lien iCal</>}
            </motion.button>

            <div className="mt-3 rounded-xl p-3.5" style={{ background: "var(--color-primary-soft)" }}>
              <div className="flex items-start gap-2.5">
                <Info size={13} style={{ color: "var(--color-primary)" }} className="mt-0.5 flex-shrink-0" />
                <div className="text-[12px] text-muted leading-relaxed space-y-1.5">
                  <p><strong className="text-foreground">Google Calendar</strong> : Paramètres → Ajouter un agenda → À partir d&apos;une URL</p>
                  <p><strong className="text-foreground">Apple Calendar</strong> : Fichier → Nouvel abonnement</p>
                  <p><strong className="text-foreground">Outlook</strong> : Ajouter un calendrier → S&apos;abonner depuis le web</p>
                </div>
              </div>
            </div>
          </>
        )}
      </SettingsSection>

      {/* ═══ Partage intégré — en bas, discret ═══ */}
      <SettingsSection title="Partage intégré">
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={shareLink}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-3.5 text-left"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-primary-soft)" }}>
            <Share2 size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-foreground">Partage rapide</p>
            <p className="text-[12px] text-muted mt-0.5">WhatsApp, SMS, email, réseaux sociaux</p>
          </div>
        </motion.button>
      </SettingsSection>
    </SettingsPage>
  );
}
