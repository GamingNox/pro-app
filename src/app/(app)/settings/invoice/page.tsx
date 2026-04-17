"use client";

import ComingSoonGate from "@/components/ComingSoonGate";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Building2, Hash, Receipt, CreditCard, FileText, Info } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SaveButton } from "@/components/SettingsPage";
import { useUserSettings } from "@/lib/user-settings";
import { DEFAULT_INVOICE_CONFIG, type InvoiceConfig } from "@/lib/invoice-pdf";

const TVA_RATES = [
  { value: 20, label: "20% (taux normal)" },
  { value: 10, label: "10% (taux intermédiaire)" },
  { value: 5.5, label: "5,5% (taux réduit)" },
  { value: 2.1, label: "2,1% (taux super-réduit)" },
];

const LEGAL_FORMS = [
  "Micro-entrepreneur",
  "Entreprise individuelle (EI)",
  "EIRL",
  "SARL",
  "SAS",
  "SASU",
  "EURL",
  "Autre",
];

export default function SettingsInvoicePage() {
  const { user } = useApp();
  const [config, setConfig, saveStatus] = useUserSettings<InvoiceConfig>("invoice_config", {
    ...DEFAULT_INVOICE_CONFIG,
    legalName: user.business || user.name || "",
  });
  const saved = saveStatus === "saved";

  function update<K extends keyof InvoiceConfig>(key: K, val: InvoiceConfig[K]) {
    setConfig({ ...config, [key]: val });
  }

  return (
    <ComingSoonGate title="Mes factures" subtitle="La gestion complète des factures arrive très prochainement.">
    <SettingsPage
      category="Comptabilité"
      title="Paramètres de facturation"
      description="Ces informations apparaissent sur vos factures PDF. Remplissez-les pour être en conformité."
    >
      {/* ═══ Legal identity ═══ */}
      <SettingsSection
        title="Identité légale"
        description="Obligatoire sur chaque facture (CGI Art. 289)."
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
              Raison sociale / Nom commercial
            </label>
            <div className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3">
              <Building2 size={15} className="text-muted flex-shrink-0" />
              <input
                value={config.legalName}
                onChange={(e) => update("legalName", e.target.value)}
                placeholder="Ex : Salon Harmonie"
                className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-subtle"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
              Forme juridique
            </label>
            <div className="flex flex-wrap gap-2">
              {LEGAL_FORMS.map((form) => {
                const active = config.legalForm === form;
                return (
                  <motion.button
                    key={form}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => update("legalForm", form)}
                    className="px-3 py-2 rounded-xl text-[11px] font-bold"
                    style={{
                      backgroundColor: active ? "var(--color-primary)" : "var(--color-border-light)",
                      color: active ? "white" : "var(--color-muted)",
                    }}
                  >
                    {form}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
              Adresse du siège
            </label>
            <textarea
              value={config.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder={"12 rue des Lilas\n75011 Paris"}
              rows={2}
              className="w-full bg-border-light rounded-xl px-4 py-3 text-[14px] text-foreground outline-none resize-none placeholder:text-subtle"
            />
          </div>

          <div>
            <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
              SIRET (14 chiffres)
            </label>
            <div className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3">
              <Hash size={15} className="text-muted flex-shrink-0" />
              <input
                value={config.siret}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 14);
                  update("siret", v);
                  if (v.length >= 9) update("siren", v.slice(0, 9));
                }}
                placeholder="123 456 789 00012"
                maxLength={14}
                inputMode="numeric"
                className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-subtle font-mono tracking-wider"
              />
            </div>
            {config.siret && config.siret.length > 0 && config.siret.length < 14 && (
              <p className="text-[10px] text-warning mt-1">{14 - config.siret.length} chiffres manquants</p>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* ═══ TVA ═══ */}
      <SettingsSection
        title="TVA"
        description="Le régime TVA détermine ce qui apparaît sur vos factures."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary-soft)" }}
              >
                <Receipt size={15} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Franchise en base (Art. 293 B)</p>
                <p className="text-[10px] text-muted">Pas de TVA sur vos factures</p>
              </div>
            </div>
            <SettingsToggle on={config.tvaExempt} onToggle={() => update("tvaExempt", !config.tvaExempt)} />
          </div>

          {!config.tvaExempt && (
            <>
              <div>
                <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
                  Taux de TVA
                </label>
                <div className="flex flex-wrap gap-2">
                  {TVA_RATES.map((rate) => {
                    const active = config.tvaRate === rate.value;
                    return (
                      <motion.button
                        key={rate.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => update("tvaRate", rate.value)}
                        className="px-3 py-2 rounded-xl text-[11px] font-bold"
                        style={{
                          backgroundColor: active ? "var(--color-primary)" : "var(--color-border-light)",
                          color: active ? "white" : "var(--color-muted)",
                        }}
                      >
                        {rate.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
                  N° TVA intracommunautaire
                </label>
                <div className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3">
                  <FileText size={15} className="text-muted flex-shrink-0" />
                  <input
                    value={config.tvaNumber}
                    onChange={(e) => update("tvaNumber", e.target.value.toUpperCase())}
                    placeholder="FR XX 123456789"
                    className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-subtle font-mono tracking-wider"
                  />
                </div>
              </div>
            </>
          )}

          {config.tvaExempt && (
            <div
              className="rounded-xl p-3.5 flex items-start gap-2.5"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <Info size={13} style={{ color: "var(--color-primary)" }} className="mt-0.5 flex-shrink-0" />
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-primary-deep)" }}>
                Vos factures afficheront la mention obligatoire :{" "}
                <em>&quot;TVA non applicable, article 293 B du Code général des impôts&quot;</em>
              </p>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* ═══ Payment conditions ═══ */}
      <SettingsSection
        title="Conditions de paiement"
        description="Apparaissent en bas de chaque facture."
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
              Modes de paiement acceptés
            </label>
            <div className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3">
              <CreditCard size={15} className="text-muted flex-shrink-0" />
              <input
                value={config.paymentMethods}
                onChange={(e) => update("paymentMethods", e.target.value)}
                placeholder="Virement, carte bancaire, espèces"
                className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-subtle"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
              Délai de paiement (jours)
            </label>
            <div className="flex flex-wrap gap-2">
              {[0, 7, 14, 30, 45, 60].map((d) => {
                const active = config.paymentDays === d;
                return (
                  <motion.button
                    key={d}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => update("paymentDays", d)}
                    className="px-3.5 py-2 rounded-xl text-[12px] font-bold"
                    style={{
                      backgroundColor: active ? "var(--color-primary)" : "var(--color-border-light)",
                      color: active ? "white" : "var(--color-muted)",
                    }}
                  >
                    {d === 0 ? "Immédiat" : `${d}j`}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-foreground font-semibold mb-1.5 block">
              Pénalités de retard
            </label>
            <input
              value={config.latePenaltyRate}
              onChange={(e) => update("latePenaltyRate", e.target.value)}
              placeholder="3 fois le taux d'intérêt légal en vigueur"
              className="w-full bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground outline-none placeholder:text-subtle"
            />
            <p className="text-[10px] text-muted mt-1.5 leading-relaxed">
              Mention obligatoire (Art. L441-10 Code de commerce). L&apos;indemnité forfaitaire de 40 EUR
              pour frais de recouvrement est ajoutée automatiquement.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* ═══ Numbering ═══ */}
      <SettingsSection
        title="Numérotation"
        description="Le préfixe de vos numéros de facture. Ex : FA-2026-0001."
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3 flex-1">
            <span className="text-[13px] text-muted font-mono">Préfixe :</span>
            <input
              value={config.invoicePrefix}
              onChange={(e) => update("invoicePrefix", e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 5))}
              placeholder="FA"
              maxLength={5}
              className="flex-1 bg-transparent text-[14px] text-foreground outline-none font-mono font-bold tracking-wider"
            />
          </div>
          <div className="bg-border-light rounded-xl px-4 py-3 text-[12px] text-muted font-mono">
            → {config.invoicePrefix || "FA"}-{new Date().getFullYear()}-{String((config.nextNumber || 1)).padStart(4, "0")}
          </div>
        </div>
        <p className="text-[10px] text-muted mt-2 leading-relaxed">
          Le compteur s&apos;incrémente automatiquement à chaque facture. La loi interdit les trous dans la numérotation.
        </p>
      </SettingsSection>

      <SaveButton onClick={() => setConfig({ ...config })} saving={saved} />
    </SettingsPage>
    </ComingSoonGate>
  );
}
