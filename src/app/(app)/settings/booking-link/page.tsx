"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Copy, Check, QrCode, Code, ExternalLink, Share2, Globe, CalendarDays, Info } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";
import Link from "next/link";

export default function SettingsBookingLinkPage() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [calCopied, setCalCopied] = useState(false);

  const calUrl = user.bookingSlug
    ? `${typeof window !== "undefined" ? window.location.origin : "https://clientbase.fr"}/api/ics/${user.bookingSlug}`
    : null;

  function copyCalUrl() {
    if (!calUrl) return;
    navigator.clipboard.writeText(calUrl);
    setCalCopied(true);
    setTimeout(() => setCalCopied(false), 2000);
  }

  const bUrl = user.bookingSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${user.bookingSlug}`
    : null;
  const snippet = `<script src="https://clientbase.fr/widget.js" data-slug="${user.bookingSlug || ""}"></script>`;

  function copyLink() {
    if (!bUrl) return;
    navigator.clipboard.writeText(bUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copySnippet() {
    navigator.clipboard.writeText(snippet);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
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

  // Empty state
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
          <p className="text-[12px] text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
            Complétez votre profil pour activer votre lien de réservation unique.
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
      {/* ═══ SECTION 1 — APERÇU CLIENT ═══ */}
      {/* Gives the pro an immediate sense of what their clients will see. */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Aperçu pour vos clients</p>
        </div>

        <div
          className="rounded-[22px] p-6 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
            boxShadow: "0 14px 40px color-mix(in srgb, var(--color-primary) 35%, transparent)",
          }}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-12 w-28 h-28 rounded-full bg-white/10" />

          <div className="relative z-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <ExternalLink size={22} className="text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-[20px] font-bold tracking-tight leading-tight">{user.business || user.name}</h2>
            <p className="text-[10px] text-white/70 uppercase tracking-[0.14em] mt-1">Réservation en ligne</p>

            <Link href={bUrl} target="_blank">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="mt-5 w-full bg-white py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2"
                style={{ color: "var(--color-primary-deep)" }}
              >
                <ExternalLink size={15} strokeWidth={2.5} />
                Ouvrir en nouvel onglet
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2 — URL & CONFIGURATION ═══ */}
      <SettingsSection title="Votre URL" description="Le lien à copier et à partager avec vos clients.">
        <div
          className="rounded-xl p-4 mb-3 flex items-center gap-3"
          style={{
            backgroundColor: "var(--color-primary-soft)",
            border: "1px solid color-mix(in srgb, var(--color-primary) 20%, white)",
          }}
        >
          <Globe size={16} className="flex-shrink-0" style={{ color: "var(--color-primary)" }} />
          <p className="flex-1 text-[13px] font-semibold text-foreground truncate">{displayUrl}</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={copyLink}
          className={`w-full py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 ${
            copied ? "bg-success text-white" : "text-white"
          }`}
          style={
            !copied
              ? {
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                  boxShadow: "0 8px 20px color-mix(in srgb, var(--color-primary) 25%, transparent)",
                }
              : undefined
          }
        >
          {copied ? (
            <>
              <Check size={16} strokeWidth={2.8} /> Copié !
            </>
          ) : (
            <>
              <Copy size={16} strokeWidth={2.5} /> Copier le lien
            </>
          )}
        </motion.button>

        <p className="text-[11px] text-muted mt-3 leading-relaxed">
          Cette adresse est unique et permanente. Partagez-la sur vos réseaux, votre signature email ou en vitrine.
        </p>
      </SettingsSection>

      {/* ═══ SECTION 3 — PARTAGE ═══ */}
      <SettingsSection title="Partager et intégrer">
        <div className="space-y-3">
          {/* Quick share */}
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={shareLink}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-3.5 text-left card-hover"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <Share2 size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">Partage rapide</p>
              <p className="text-[11px] text-muted mt-0.5">WhatsApp, SMS, email, réseaux sociaux</p>
            </div>
          </motion.button>

          {/* QR code */}
          <div
            className="bg-white rounded-2xl p-4 flex items-start gap-3.5"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <QrCode size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">QR code</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Pour vos flyers, cartes de visite ou vitrine.
              </p>
              <button
                className="text-[12px] font-bold mt-2"
                style={{ color: "var(--color-primary)" }}
              >
                Télécharger →
              </button>
            </div>
          </div>

          {/* Web widget */}
          <div
            className="bg-white rounded-2xl p-4"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-start gap-3.5 mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary-soft)" }}
              >
                <Code size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">Bouton pour votre site</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Collez ce code sur votre site pour y ajouter un bouton &quot;Réserver&quot;.
                </p>
              </div>
            </div>

            <div className="bg-border-light rounded-lg px-3 py-2.5 text-[10px] font-mono text-muted break-all leading-relaxed">
              {snippet}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={copySnippet}
              className="mt-2.5 text-[12px] font-bold flex items-center gap-1.5"
              style={{ color: "var(--color-primary)" }}
            >
              {snippetCopied ? (
                <>
                  <Check size={12} strokeWidth={2.8} /> Code copié
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2.5} /> Copier le code
                </>
              )}
            </motion.button>
          </div>
        </div>
      </SettingsSection>
      {/* ── Calendar sync ────────────────────────── */}
      <SettingsSection title="Synchronisation calendrier" description="Vos rendez-vous Clientbase dans Google Calendar, Apple Calendar ou Outlook.">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary-soft)" }}>
            <CalendarDays size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground">Flux iCalendar (.ics)</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              Copiez ce lien et ajoutez-le dans votre application de calendrier. Vos rendez-vous se synchronisent automatiquement.
            </p>
          </div>
        </div>

        {calUrl ? (
          <>
            <div className="bg-border-light rounded-xl px-3.5 py-3 text-[11px] text-muted break-all font-mono leading-relaxed mb-3">
              {calUrl}
            </div>

            <div className="flex gap-2 mb-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={copyCalUrl}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
                style={{
                  background: calCopied ? "#D1FAE5" : "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                  color: calCopied ? "#047857" : "white",
                  boxShadow: calCopied ? "none" : "0 8px 20px color-mix(in srgb, var(--color-primary) 25%, transparent)",
                }}
              >
                {calCopied ? <><Check size={13} strokeWidth={2.8} /> Copié !</> : <><Copy size={13} strokeWidth={2.5} /> Copier le lien iCal</>}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => window.open(calUrl, "_blank")}
                className="px-4 py-2.5 rounded-xl text-[12px] font-bold bg-border-light text-foreground flex items-center gap-1.5"
              >
                <ExternalLink size={13} strokeWidth={2.5} /> Tester
              </motion.button>
            </div>

            <div className="bg-accent-soft rounded-xl p-3.5">
              <div className="flex items-start gap-2.5">
                <Info size={13} className="text-accent mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-muted leading-relaxed space-y-1.5">
                  <p><strong className="text-foreground">Google Calendar</strong> : Paramètres → Ajouter un agenda → À partir d&apos;une URL → Collez le lien</p>
                  <p><strong className="text-foreground">Apple Calendar</strong> : Fichier → Nouvel abonnement → Collez le lien</p>
                  <p><strong className="text-foreground">Outlook</strong> : Ajouter un calendrier → S&apos;abonner depuis le web → Collez le lien</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[12px] text-muted text-center py-4">
            Complétez votre profil pour obtenir votre flux calendrier.
          </p>
        )}
      </SettingsSection>
    </SettingsPage>
  );
}
