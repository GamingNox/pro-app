"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Copy, Check, Eye, Zap, QrCode, Code, ExternalLink } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";
import Link from "next/link";

export default function SettingsBookingLinkPage() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const bUrl = user.bookingSlug ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${user.bookingSlug}` : null;

  function copyLink() {
    if (!bUrl) return;
    navigator.clipboard.writeText(bUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SettingsPage
      category="Configuration"
      title="Liens de Réservation"
      description="Personnalisez l'accès à votre studio. Partagez votre lien unique pour permettre à vos clients de réserver en quelques secondes."
    >
      {/* URL */}
      <SettingsSection title="Votre URL personnalisée">
        {bUrl ? (
          <>
            <div className="bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground font-medium mb-3 truncate">
              pro.com/<span className="font-bold">{user.bookingSlug}</span>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={copyLink}
              className={`w-full py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 ${copied ? "bg-success text-white" : "bg-accent text-white fab-shadow"}`}>
              {copied ? <><Check size={16} /> Copié</> : <><Copy size={16} /> Copier</>}
            </motion.button>
            <p className="text-[10px] text-muted mt-2">L&apos;URL doit être unique et ne peut pas contenir de caractères spéciaux.</p>
          </>
        ) : (
          <p className="text-[13px] text-muted text-center py-6">Complétez votre profil pour obtenir un lien de réservation.</p>
        )}
      </SettingsSection>

      {/* Status */}
      {bUrl && (
        <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
          <div className="flex items-center gap-3">
            <Zap size={22} className="text-white" />
            <div>
              <p className="text-[15px] font-bold">Lien Actif</p>
              <p className="text-[12px] text-white/70">Vos clients peuvent réserver via ce lien.</p>
            </div>
          </div>
        </div>
      )}

      {/* Sharing */}
      <SettingsSection title="Partage & Intégration">
        <div className="space-y-4">
          <div className="bg-border-light rounded-2xl p-4 flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              <QrCode size={28} className="text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-foreground">QR Code</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">Téléchargez votre code pour vos supports imprimés ou vitrines.</p>
              <button className="text-[12px] text-accent font-bold mt-2 flex items-center gap-1">Télécharger</button>
            </div>
          </div>

          <div className="bg-border-light rounded-2xl p-4">
            <p className="text-[14px] font-bold text-foreground mb-1">Bouton Web</p>
            <p className="text-[11px] text-muted leading-relaxed">Ajoutez un bouton &quot;Réserver&quot; à votre propre site internet.</p>
            <div className="bg-white rounded-xl px-3 py-2 mt-3 text-[10px] font-mono text-muted">
              {`<script src="pro.com/widget.js"></script>`}
            </div>
            <button className="text-[12px] text-accent font-bold mt-2 flex items-center gap-1"><Code size={12} /> Copier le code</button>
          </div>
        </div>
      </SettingsSection>

      {/* Preview */}
      {bUrl && (
        <div className="bg-accent-gradient rounded-2xl p-6 text-center text-white mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <ExternalLink size={20} className="text-white" />
          </div>
          <p className="text-[16px] font-bold">{user.business || user.name}</p>
          <p className="text-[11px] text-white/60 uppercase tracking-wider mt-0.5">Réservation en ligne</p>
          <Link href={bUrl} target="_blank">
            <motion.button whileTap={{ scale: 0.97 }}
              className="mt-4 bg-white text-accent py-3 rounded-xl text-[13px] font-bold w-full">
              Réserver une séance
            </motion.button>
          </Link>
          <p className="text-[10px] text-white/40 mt-2">Aperçu du lien client</p>
        </div>
      )}
    </SettingsPage>
  );
}
