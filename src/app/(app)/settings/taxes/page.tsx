"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { FileText, Info, Download, BarChart3 } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SaveButton } from "@/components/SettingsPage";

export default function SettingsTaxesPage() {
  const { invoices } = useApp();
  const [saved, setSaved] = useState(false);
  const [tvaOn, setTvaOn] = useState(false);
  const [tvaRate, setTvaRate] = useState("20");

  const paidTotal = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0);
  const expenses = invoices.filter((i) => i.clientId === "__expense__").reduce((s, i) => s + i.amount, 0);
  const estimatedTva = tvaOn ? paidTotal * (parseFloat(tvaRate) / 100) : 0;

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage
      category="Pilotage fiscal"
      title="Gestion des Taxes & TVA"
      description="Suivez vos obligations fiscales en temps réel et préparez vos déclarations en toute sérénité."
    >
      {/* TVA estimate */}
      <SettingsSection>
        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">TVA estimée à payer</p>
        <p className="text-[32px] font-bold text-foreground leading-none mt-2">{estimatedTva.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
        <p className="text-[11px] text-muted mt-2 leading-relaxed">Basé sur vos revenus et dépenses du trimestre en cours.</p>
        <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center mt-2 ml-auto"><BarChart3 size={14} className="text-accent" /></div>
      </SettingsSection>

      {/* Revenue + expenses */}
      <div className="grid grid-cols-1 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-5 shadow-card-premium">
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Chiffre d&apos;affaires (HT)</p>
          <p className="text-[24px] font-bold text-foreground mt-1">{paidTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
          {paidTotal > 0 && <p className="text-[11px] text-success font-bold mt-1 flex items-center gap-1">↗ +12.5% vs Q3</p>}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card-premium">
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Dépenses déductibles</p>
          <p className="text-[24px] font-bold text-foreground mt-1">{expenses.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
          <p className="text-[11px] text-muted mt-1 flex items-center gap-1"><FileText size={11} /> {invoices.filter((i) => i.clientId === "__expense__").length} justificatifs</p>
        </div>
      </div>

      {/* TVA config */}
      <SettingsSection title="Régime de TVA">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Assujetti à la TVA</span>
            <SettingsToggle on={tvaOn} onToggle={() => setTvaOn(!tvaOn)} />
          </div>
          {tvaOn && (
            <div>
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Taux applicable</label>
              <div className="flex gap-2">
                {["5.5", "10", "20"].map((r) => (
                  <motion.button key={r} whileTap={{ scale: 0.95 }} onClick={() => setTvaRate(r)}
                    className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${tvaRate === r ? "text-white" : "bg-border-light text-muted"}`}
                    style={tvaRate === r ? { backgroundColor: "var(--color-primary)" } : undefined}>
                    {r}%
                  </motion.button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Info size={12} className="text-accent" />
                <span className="text-[11px] text-accent font-bold">Calcul automatique activé</span>
                <div className="ml-auto"><SettingsToggle on={true} onToggle={() => {}} /></div>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Export tools */}
      <SettingsSection title="Outils d'exportation">
        <div className="space-y-3">
          <motion.button whileTap={{ scale: 0.98 }}
            className="w-full text-white py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
              boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
            }}>
            <Download size={15} /> Exporter pour mon comptable
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }}
            className="w-full bg-border-light text-foreground py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2">
            <FileText size={15} /> Générer rapport PDF
          </motion.button>
        </div>
      </SettingsSection>

      {/* Fiscal tip */}
      <div className="bg-accent-soft rounded-2xl p-4 flex items-start gap-3 mb-5">
        <Info size={16} className="text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold text-foreground">Optimisation Fiscale</p>
          <p className="text-[11px] text-muted mt-1 leading-relaxed">Vous avez {invoices.filter((i) => i.status === "pending").length} factures en attente de catégorisation qui pourraient réduire votre TVA.</p>
        </div>
      </div>

      <SaveButton onClick={flash} saving={saved} />
    </SettingsPage>
  );
}
