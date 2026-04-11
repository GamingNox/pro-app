"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { CreditCard, Banknote, Building2, CheckCircle2, Shield, ExternalLink, Info } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SettingsRow } from "@/components/SettingsPage";

export default function SettingsPaymentsPage() {
  const { invoices } = useApp();
  const [saved, setSaved] = useState(false);
  const [pm, setPm] = useState({ cash: true, card: true, transfer: false, check: false });
  const [tvaOn, setTvaOn] = useState(false);
  const [tvaRate, setTvaRate] = useState("20");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [holder, setHolder] = useState("");

  const paidTotal = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0);
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage
      category="Gestion administrative"
      title="Paiements & Facturation"
      description="Gérez vos méthodes de paiement, configurez la fiscalité et mettez à jour vos coordonnées bancaires en toute sécurité."
    >
      {/* Stripe */}
      <SettingsSection>
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
            <Building2 size={24} className="text-accent" />
          </div>
          <span className="text-[10px] font-bold text-success bg-success-soft px-2.5 py-1 rounded-full uppercase">Connecté</span>
        </div>
        <h3 className="text-[18px] font-bold text-foreground text-center">Stripe Checkout</h3>
        <p className="text-[12px] text-muted text-center mt-1 leading-relaxed">Acceptez les paiements par carte bancaire, Apple Pay et Google Pay instantanément.</p>
        <div className="flex gap-3 mt-4 justify-center">
          <motion.button whileTap={{ scale: 0.97 }} className="bg-accent text-white px-5 py-2.5 rounded-xl text-[12px] font-bold">Gérer le compte Stripe</motion.button>
          <button className="text-[12px] text-accent font-bold flex items-center gap-1"><ExternalLink size={12} /> Détails techniques</button>
        </div>
      </SettingsSection>

      {/* Security badge */}
      <div className="bg-foreground rounded-2xl p-5 text-center text-white mb-5">
        <Shield size={24} className="text-white/60 mx-auto mb-2" />
        <p className="text-[14px] font-bold">Sécurité PCI DSS</p>
        <p className="text-[11px] text-white/60 mt-1 max-w-[260px] mx-auto leading-relaxed">Vos données bancaires sont cryptées selon les normes bancaires les plus strictes.</p>
      </div>

      {/* TVA */}
      <SettingsSection title="Configuration de la TVA">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Régime de TVA</label>
            <div className="bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground">
              {tvaOn ? `Assujetti à la TVA (${tvaRate}%)` : "Non assujetti"}
            </div>
          </div>
          <SettingsRow label="TVA active">
            <SettingsToggle on={tvaOn} onToggle={() => setTvaOn(!tvaOn)} />
          </SettingsRow>
          {tvaOn && (
            <>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Taux</label>
                <div className="flex gap-2">
                  {["5.5", "10", "20"].map((r) => (
                    <motion.button key={r} whileTap={{ scale: 0.95 }} onClick={() => setTvaRate(r)}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${tvaRate === r ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                      {r}%
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-accent text-[11px] font-semibold">
                <Info size={12} /> Calcul automatique activé
                <SettingsToggle on={true} onToggle={() => {}} />
              </div>
            </>
          )}
        </div>
      </SettingsSection>

      {/* Bank details */}
      <SettingsSection title="Coordonnées Bancaires">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Titulaire du compte</label>
            <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="STUDIO DESIGN PRO" className="input-field" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">IBAN</label>
              <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="FR76 3000 6000 0000" className="input-field text-[12px]" />
            </div>
            <div>
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">BIC / SWIFT</label>
              <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BNPAFR2" className="input-field text-[12px]" />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Payment methods */}
      <SettingsSection title="Modes de paiement acceptés">
        <div className="space-y-1">
          {[
            { key: "card" as const, label: "Carte Bancaire", sub: "VIA STRIPE", icon: CreditCard, active: pm.card },
            { key: "cash" as const, label: "Espèces", sub: "ENCAISSEMENT MANUEL", icon: Banknote, active: pm.cash },
            { key: "transfer" as const, label: "Virement", sub: "DÉLAI 48H", icon: Building2, active: pm.transfer },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <motion.button key={m.key} whileTap={{ scale: 0.98 }}
                onClick={() => setPm({ ...pm, [m.key]: !pm[m.key] })}
                className={`w-full flex items-center gap-3 p-4 rounded-xl ${m.active ? "bg-accent-soft" : "bg-border-light"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.active ? "bg-accent text-white" : "bg-white text-muted"}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-bold text-foreground">{m.label}</p>
                  <p className="text-[9px] text-muted uppercase tracking-wider">{m.sub}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${m.active ? "border-accent bg-accent" : "border-border"}`}>
                  {m.active && <CheckCircle2 size={12} className="text-white" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </SettingsSection>

      <motion.button whileTap={{ scale: 0.97 }} onClick={flash}
        className="w-full bg-accent text-white py-4 rounded-2xl text-[14px] font-bold fab-shadow mb-5">
        {saved ? "Enregistré !" : "Enregistrer"}
      </motion.button>
    </SettingsPage>
  );
}
