"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { FileText, Download, Send, BarChart3, CheckCircle2 } from "lucide-react";
import SettingsPage, { SettingsSection, SaveButton } from "@/components/SettingsPage";

export default function SettingsAccountingPage() {
  const { invoices } = useApp();
  const [saved, setSaved] = useState(false);
  const [siret, setSiret] = useState("");
  const [legal, setLegal] = useState("");
  const [accountant, setAccountant] = useState("");

  const paidTotal = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0);
  const pendingCount = invoices.filter((i) => i.status === "pending").length;

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage
      category="Export de rapports"
      title="Centre de Gestion Comptable."
      description="Préparez vos clôtures mensuelles avec précision. Exportez vos données financières vers vos outils favoris ou transmettez-les directement à votre cabinet d'expertise."
    >
      {/* Reports */}
      <SettingsSection title="Rapports Prêts" description="Mise à jour : aujourd'hui">
        <div className="space-y-4">
          {[
            { icon: BarChart3, title: "Revenus mensuels", desc: `Synthèse complète des revenus générés pour ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}.`, size: "4.2 MB" },
            { icon: FileText, title: "Estimations fiscales", desc: "Calcul prévisionnel des charges sociales et fiscales trimestrielles.", size: "1.8 MB" },
            { icon: Download, title: "Rapport de dépenses", desc: "Inventaire détaillé des frais de fonctionnement et justificatifs numérisés.", size: "12.5 MB" },
          ].map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="border-b border-border-light pb-4 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-border-light flex items-center justify-center mb-2"><Icon size={18} className="text-accent" /></div>
                <p className="text-[15px] font-bold text-foreground">{r.title}</p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">{r.desc}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded">Prêt</span>
                  <span className="text-[10px] text-muted">{r.size}</span>
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Export format */}
      <SettingsSection title="Format d'export">
        <div className="space-y-2">
          {[
            { label: "PDF", sub: "Standard archivage", active: false },
            { label: "EXCEL", sub: "Analyse avancée", active: true },
            { label: "CSV", sub: "Import comptable", active: false },
          ].map((f) => (
            <motion.button key={f.label} whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left ${f.active ? "bg-accent-soft ring-1 ring-accent/20" : "bg-border-light"}`}>
              <FileText size={16} className={f.active ? "text-accent" : "text-muted"} />
              <div>
                <p className={`text-[13px] font-bold ${f.active ? "text-accent" : "text-foreground"}`}>{f.label}</p>
                <p className="text-[10px] text-muted">{f.sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </SettingsSection>

      {/* Accountant */}
      <SettingsSection title="Destinataires">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent text-[12px] font-bold">JD</div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-foreground">Jean-Claude Dupont</p>
            <p className="text-[10px] text-muted">Cabinet Dupont & Associés</p>
          </div>
          <CheckCircle2 size={16} className="text-accent" />
        </div>
        <div>
          <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Ajouter une note</label>
          <textarea value={accountant} onChange={(e) => setAccountant(e.target.value)}
            placeholder="Message optionnel pour votre comptable..." rows={2} className="input-field resize-none" />
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          className="w-full bg-accent text-white py-3.5 rounded-xl text-[13px] font-bold mt-3 flex items-center justify-center gap-2">
          <Send size={14} /> Envoyer au comptable
        </motion.button>
      </SettingsSection>

      {/* Annual stat */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Statut annuel</p>
        <p className="text-[28px] font-bold mt-1">{paidTotal > 0 ? `€${paidTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}` : "€0,00"}</p>
        <p className="text-[11px] text-white/60 mt-0.5">Revenu Imposable estimé (YTD)</p>
        <div className="flex gap-6 mt-3 pt-3 border-t border-white/10">
          <div><p className="text-[10px] text-white/50 uppercase">Dernier export</p><p className="text-[12px] font-bold mt-0.5">{new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p></div>
          <div><p className="text-[10px] text-white/50 uppercase">Factures</p><p className="text-[12px] font-bold mt-0.5">{pendingCount} en attente</p></div>
        </div>
      </div>
    </SettingsPage>
  );
}
