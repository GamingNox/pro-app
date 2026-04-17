"use client";

import ComingSoonGate from "@/components/ComingSoonGate";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Banknote,
  Building2,
  CheckCircle2,
  ExternalLink,
  Link2,
  Copy,
  Check,
  Circle,
  Receipt,
  Sparkles,
} from "lucide-react";
import SettingsPage, {
  SettingsSection,
  SettingsToggle,
  SettingsRow,
  PrimaryButton,
} from "@/components/SettingsPage";
import { useUserSettings } from "@/lib/user-settings";

const PROVIDER_PRESETS = [
  { key: "stripe", label: "Stripe", url: "https://dashboard.stripe.com/payment-links", hint: "dashboard.stripe.com → Liens de paiement" },
  { key: "paypal", label: "PayPal.me", url: "https://www.paypal.com/paypalme/grow", hint: "paypal.com/paypalme → Creer votre lien" },
  { key: "sumup", label: "SumUp", url: "https://me.sumup.com/", hint: "me.sumup.com → Lien de paiement" },
  { key: "other", label: "Autre", url: "", hint: "Tout lien URL qui ouvre un paiement" },
];

export default function SettingsPaymentsPage() {
  const [saved, setSaved] = useState(false);
  const [pm, setPm] = useState({ cash: true, card: true, transfer: false });
  const [tvaOn, setTvaOn] = useState(false);
  const [tvaRate, setTvaRate] = useState("20");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [holder, setHolder] = useState("");

  // External payment link config (Supabase-backed via useUserSettings)
  const [linkConfig, setLinkConfig] = useUserSettings<{
    url: string; providerKey: string; tested: boolean;
  }>("external_payment_link", { url: "", providerKey: "stripe", tested: false });

  const [paymentLink, setPaymentLink] = useState(linkConfig.url);
  const [providerKey, setProviderKey] = useState(linkConfig.providerKey);
  const [linkTested, setLinkTested] = useState(linkConfig.tested);
  const [linkCopied, setLinkCopied] = useState(false);

  // Sync from hook when it reconciles with Supabase
  useEffect(() => {
    if (linkConfig.url) setPaymentLink(linkConfig.url);
    if (linkConfig.providerKey) setProviderKey(linkConfig.providerKey);
    if (linkConfig.tested) setLinkTested(true);
  }, [linkConfig]);

  function saveLink() {
    setLinkConfig({ url: paymentLink.trim(), providerKey, tested: linkTested });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function copyLink() {
    if (!paymentLink.trim()) return;
    navigator.clipboard.writeText(paymentLink.trim());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function testLink() {
    if (!paymentLink.trim()) return;
    window.open(paymentLink.trim(), "_blank");
    setLinkTested(true);
    setLinkConfig({ url: paymentLink.trim(), providerKey, tested: true });
  }

  const selectedProvider = PROVIDER_PRESETS.find((p) => p.key === providerKey) || PROVIDER_PRESETS[0];

  // Setup progress
  const steps = useMemo(
    () => [
      { label: "Choisir un prestataire", done: !!providerKey },
      { label: "Coller votre lien", done: paymentLink.trim().length > 6 },
      { label: "Tester l'ouverture", done: linkTested && paymentLink.trim().length > 6 },
    ],
    [providerKey, paymentLink, linkTested]
  );
  const progress = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  return (
    <ComingSoonGate
      title="Paiements & encaissement"
      subtitle="Le système d'encaissement en ligne arrive très prochainement."
    >
    <SettingsPage
      category="Gestion administrative"
      title="Paiements & Facturation"
      description="Un seul endroit pour configurer votre lien de paiement, votre TVA et vos modes d'encaissement."
    >
      {/* ── Setup checklist ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
          boxShadow: "0 14px 36px color-mix(in srgb, var(--color-primary) 30%, transparent)",
        }}
      >
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={13} className="text-white" strokeWidth={2.6} />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">Setup en 3 etapes</p>
          </div>
          <p className="text-[18px] font-bold leading-tight mt-1">
            {progress === 100 ? "Tout est pret !" : "Prete a encaisser en 1 minute"}
          </p>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Steps */}
          <div className="mt-4 space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <motion.div
                  initial={false}
                  animate={{ scale: s.done ? 1 : 0.9 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: s.done ? "#22c55e" : "rgba(255,255,255,0.15)",
                  }}
                >
                  {s.done ? (
                    <Check size={12} className="text-white" strokeWidth={3} />
                  ) : (
                    <Circle size={10} className="text-white/70" strokeWidth={2.4} />
                  )}
                </motion.div>
                <p className={`text-[12px] font-semibold ${s.done ? "text-white" : "text-white/80"}`}>
                  {i + 1}. {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Section 1: Lien de paiement ── */}
      <div className="flex items-start gap-3 mb-2.5 px-1">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
            boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          <Link2 size={14} className="text-white" strokeWidth={2.6} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-bold text-foreground leading-tight" style={{ color: "var(--color-accent-deep)" }}>
            Lien de paiement
          </h2>
          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
            Collez l'URL fournie par votre prestataire. Elle s'ouvrira quand vous toucherez « Encaisser ».
          </p>
        </div>
      </div>

      <SettingsSection>
        {/* Explainer card */}
        <div
          className="rounded-xl p-3.5 mb-4 flex items-start gap-2.5"
          style={{ backgroundColor: "var(--color-primary-soft)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "white" }}
          >
            <CreditCard size={15} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-bold text-foreground leading-tight mb-1">
              À quoi ça sert, un lien de paiement ?
            </p>
            <p className="text-[11px] text-muted leading-relaxed">
              C&apos;est une page de paiement sécurisée fournie par un prestataire (Stripe, PayPal, SumUp…).
              Quand vous tapez « Encaisser » sur un rendez-vous, Client Base ouvre automatiquement ce lien
              pour que votre client règle par carte. <strong className="text-foreground">L&apos;argent arrive directement sur votre compte bancaire</strong>,
              Client Base ne touche à rien.
            </p>
          </div>
        </div>

        {/* Provider picker */}
        <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Prestataire</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PROVIDER_PRESETS.map((p) => {
            const active = providerKey === p.key;
            return (
              <motion.button
                key={p.key}
                whileTap={{ scale: 0.96 }}
                onClick={() => setProviderKey(p.key)}
                className="py-2.5 rounded-xl text-[11px] font-bold"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                        color: "white",
                        boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
                        border: "1px solid var(--color-primary-deep)",
                      }
                    : { backgroundColor: "var(--color-border-light)", color: "var(--color-muted)" }
                }
              >
                {p.label}
              </motion.button>
            );
          })}
        </div>

        {/* URL input */}
        <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">URL de paiement</label>
        <input
          type="url"
          value={paymentLink}
          onChange={(e) => {
            setPaymentLink(e.target.value);
            setLinkTested(false);
          }}
          placeholder={selectedProvider.url || "https://..."}
          className="input-field text-[12px] mb-2"
        />
        <p className="text-[10px] text-muted mb-3">
          Ou trouver votre lien : <strong>{selectedProvider.hint}</strong>
        </p>

        {/* Actions */}
        <div className="flex gap-2 mb-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={saveLink}
            disabled={!paymentLink.trim()}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
            style={
              paymentLink.trim()
                ? {
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                    color: "white",
                    boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
                  }
                : { backgroundColor: "var(--color-border-light)", color: "var(--color-muted)" }
            }
          >
            <Check size={13} strokeWidth={2.5} /> {saved ? "Enregistre !" : "Enregistrer"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={copyLink}
            disabled={!paymentLink.trim()}
            className="px-4 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: "var(--color-primary-soft)",
              color: "var(--color-primary-deep)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)",
            }}
          >
            {linkCopied ? (
              <>
                <Check size={13} strokeWidth={2.5} /> Copie
              </>
            ) : (
              <>
                <Copy size={13} strokeWidth={2.5} /> Copier
              </>
            )}
          </motion.button>
        </div>

        {paymentLink.trim() && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={testLink}
            className="w-full py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: "var(--color-primary-soft)",
              color: "var(--color-primary-deep)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
            }}
          >
            <ExternalLink size={12} strokeWidth={2.5} />
            {linkTested ? "Lien teste" : "Tester le lien"}
          </motion.button>
        )}
      </SettingsSection>

      {/* ── Section 2: TVA & Facturation ── */}
      <div className="flex items-start gap-3 mb-2.5 px-1">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
            boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          <Receipt size={14} className="text-white" strokeWidth={2.6} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-bold leading-tight" style={{ color: "var(--color-accent-deep)" }}>
            TVA & Facturation
          </h2>
          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
            Parametres affiches automatiquement sur vos factures et devis.
          </p>
        </div>
      </div>

      <SettingsSection>
        <div className="space-y-4">
          <SettingsRow label="Assujetti a la TVA" hint={tvaOn ? `Taux applique : ${tvaRate}%` : "Non applicable"}>
            <SettingsToggle on={tvaOn} onToggle={() => setTvaOn(!tvaOn)} />
          </SettingsRow>

          <AnimatePresence initial={false}>
            {tvaOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Taux</label>
                <div className="flex gap-2">
                  {["5.5", "10", "20"].map((r) => {
                    const active = tvaRate === r;
                    return (
                      <motion.button
                        key={r}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTvaRate(r)}
                        className="flex-1 py-2.5 rounded-xl text-[12px] font-bold"
                        style={
                          active
                            ? {
                                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                                color: "white",
                                boxShadow: "0 6px 16px color-mix(in srgb, var(--color-primary) 25%, transparent)",
                              }
                            : { backgroundColor: "var(--color-border-light)", color: "var(--color-muted)" }
                        }
                      >
                        {r}%
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-px bg-border-light" />

          <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Coordonnees bancaires</p>

          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Titulaire du compte</label>
            <input
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="STUDIO DESIGN PRO"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">IBAN</label>
              <input
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="FR76 3000 6000 0000"
                className="input-field text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">BIC / SWIFT</label>
              <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BNPAFR2" className="input-field text-[12px]" />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ── Section 3: Modes de paiement ── */}
      <div className="flex items-start gap-3 mb-2.5 px-1">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
            boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          <CreditCard size={14} className="text-white" strokeWidth={2.6} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-bold leading-tight" style={{ color: "var(--color-accent-deep)" }}>
            Modes de paiement
          </h2>
          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
            Choisissez ce que vous acceptez. S'affiche lors de l'encaissement.
          </p>
        </div>
      </div>

      <SettingsSection>
        <div className="space-y-2">
          {[
            { key: "card" as const, label: "Carte bancaire", sub: "via lien externe", icon: CreditCard, active: pm.card },
            { key: "cash" as const, label: "Especes", sub: "encaissement manuel", icon: Banknote, active: pm.cash },
            { key: "transfer" as const, label: "Virement", sub: "delai 48h", icon: Building2, active: pm.transfer },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <motion.button
                key={m.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPm({ ...pm, [m.key]: !pm[m.key] })}
                className="w-full flex items-center gap-3 p-4 rounded-xl"
                style={
                  m.active
                    ? {
                        backgroundColor: "var(--color-primary-soft)",
                        border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)",
                      }
                    : { backgroundColor: "var(--color-border-light)", border: "1px solid transparent" }
                }
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={
                    m.active
                      ? { backgroundColor: "var(--color-primary)", color: "white" }
                      : { backgroundColor: "white", color: "var(--color-muted)" }
                  }
                >
                  <Icon size={18} strokeWidth={2.4} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-bold text-foreground">{m.label}</p>
                  <p className="text-[9px] text-muted uppercase tracking-wider">{m.sub}</p>
                </div>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={
                    m.active
                      ? { backgroundColor: "var(--color-primary)", border: "2px solid var(--color-primary)" }
                      : { border: "2px solid var(--color-border)" }
                  }
                >
                  {m.active && <CheckCircle2 size={12} className="text-white" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </SettingsSection>

      <PrimaryButton onClick={saveLink}>{saved ? "Enregistre !" : "Enregistrer tout"}</PrimaryButton>
    </SettingsPage>
    </ComingSoonGate>
  );
}
