"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Bell, Users, CreditCard, LogOut, ChevronRight, Settings, Globe, Lock, MessageCircle, ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { AdminChatPanel, UnreadBadge } from "@/components/SupportChat";

type View = null | "platform" | "users" | "billing" | "notifications" | "security" | "advanced";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onToggle}
      className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all ${on ? "justify-end" : "justify-start"}`}
      style={{ backgroundColor: on ? "var(--color-accent)" : "var(--color-border)" }}>
      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
    </motion.button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="mb-4">
      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder}
        className="w-full bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-subtle outline-none" />
    </div>
  );
}

function Row({ label, hint, children, last = false }: { label: string; hint?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3.5 ${last ? "" : "border-b border-border-light"}`}>
      <div className="flex-1 min-w-0 mr-3">
        <span className="text-[13px] text-foreground">{label}</span>
        {hint && <p className="text-[10px] text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="mb-4">
      <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground outline-none appearance-none">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [view, setView] = useState<View>(null);
  const [showChat, setShowChat] = useState(false);
  const [saved, setSaved] = useState(false);

  // Platform
  const [platformName, setPlatformName] = useState("Lumiere Pro");
  const [platformDesc, setPlatformDesc] = useState("Plateforme de gestion pour professionnels");
  const [platformLang, setPlatformLang] = useState("fr");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Users
  const [requireVerification, setRequireVerification] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [allowSignup, setAllowSignup] = useState(true);
  const [maxUsers, setMaxUsers] = useState("100");

  // Billing
  const [currency, setCurrency] = useState("EUR");
  const [commissionRate, setCommissionRate] = useState("5");
  const [trialDays, setTrialDays] = useState("14");

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [adminEmail, setAdminEmail] = useState("noah.pscl.08@gmail.com");
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Security
  const [require2FA, setRequire2FA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [minPwLength, setMinPwLength] = useState("8");
  const [rateLimiting, setRateLimiting] = useState(true);

  // Advanced
  const [webhookUrl, setWebhookUrl] = useState("");
  const [debugMode, setDebugMode] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin-settings");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.platformName !== undefined) setPlatformName(s.platformName);
        if (s.platformDesc !== undefined) setPlatformDesc(s.platformDesc);
        if (s.platformLang !== undefined) setPlatformLang(s.platformLang);
        if (s.maintenanceMode !== undefined) setMaintenanceMode(s.maintenanceMode);
        if (s.requireVerification !== undefined) setRequireVerification(s.requireVerification);
        if (s.autoApprove !== undefined) setAutoApprove(s.autoApprove);
        if (s.allowSignup !== undefined) setAllowSignup(s.allowSignup);
        if (s.maxUsers !== undefined) setMaxUsers(s.maxUsers);
        if (s.currency !== undefined) setCurrency(s.currency);
        if (s.commissionRate !== undefined) setCommissionRate(s.commissionRate);
        if (s.trialDays !== undefined) setTrialDays(s.trialDays);
        if (s.emailNotifs !== undefined) setEmailNotifs(s.emailNotifs);
        if (s.pushNotifs !== undefined) setPushNotifs(s.pushNotifs);
        if (s.adminEmail !== undefined) setAdminEmail(s.adminEmail);
        if (s.weeklyReport !== undefined) setWeeklyReport(s.weeklyReport);
        if (s.require2FA !== undefined) setRequire2FA(s.require2FA);
        if (s.sessionTimeout !== undefined) setSessionTimeout(s.sessionTimeout);
        if (s.minPwLength !== undefined) setMinPwLength(s.minPwLength);
        if (s.rateLimiting !== undefined) setRateLimiting(s.rateLimiting);
        if (s.webhookUrl !== undefined) setWebhookUrl(s.webhookUrl);
        if (s.debugMode !== undefined) setDebugMode(s.debugMode);
      }
    } catch { /* ignore parse errors */ }
  }, []);

  function saveAll() {
    localStorage.setItem("admin-settings", JSON.stringify({
      platformName, platformDesc, platformLang, maintenanceMode,
      requireVerification, autoApprove, allowSignup, maxUsers,
      currency, commissionRate, trialDays,
      emailNotifs, pushNotifs, adminEmail, weeklyReport,
      require2FA, sessionTimeout, minPwLength, rateLimiting,
      webhookUrl, debugMode,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleLogout() {
    localStorage.removeItem("admin-auth");
    sessionStorage.removeItem("admin-auth");
    router.replace("/admin-login");
  }

  const settingsItems = [
    { key: "platform" as const, icon: Globe, label: "Plateforme", sub: "Nom, description, langue", color: "bg-accent-soft", ic: "text-accent" },
    { key: "users" as const, icon: Users, label: "Politiques utilisateurs", sub: "Inscription, verification, limites", color: "bg-accent-soft", ic: "text-accent" },
    { key: "billing" as const, icon: CreditCard, label: "Facturation", sub: "Devise, commission, essai gratuit", color: "bg-warning-soft", ic: "text-warning" },
    { key: "notifications" as const, icon: Bell, label: "Notifications", sub: "Email, push, rapports", color: "bg-border-light", ic: "text-muted" },
    { key: "security" as const, icon: Lock, label: "Securite", sub: "2FA, sessions, mots de passe", color: "bg-danger-soft", ic: "text-danger" },
    { key: "advanced" as const, icon: Settings, label: "Avance", sub: "Webhooks, mode debug", color: "bg-border-light", ic: "text-muted" },
  ];

  const viewTitle: Record<string, string> = {
    platform: "Plateforme",
    users: "Politiques utilisateurs",
    billing: "Facturation",
    notifications: "Notifications",
    security: "Securite",
    advanced: "Avance",
  };

  function renderDetail() {
    switch (view) {
      case "platform":
        return (
          <>
            <Field label="Nom de la plateforme" value={platformName} onChange={setPlatformName} placeholder="Lumiere Pro" />
            <Field label="Description" value={platformDesc} onChange={setPlatformDesc} placeholder="Description de votre plateforme" />
            <SelectField label="Langue" value={platformLang} onChange={setPlatformLang} options={[
              { v: "fr", l: "Francais" }, { v: "en", l: "English" }, { v: "es", l: "Espanol" },
            ]} />
            <Row label="Mode maintenance" hint="Desactive l'acces public" last>
              <Toggle on={maintenanceMode} onToggle={() => setMaintenanceMode(!maintenanceMode)} />
            </Row>
          </>
        );
      case "users":
        return (
          <>
            <Row label="Verification email" hint="Exiger une verification par email">
              <Toggle on={requireVerification} onToggle={() => setRequireVerification(!requireVerification)} />
            </Row>
            <Row label="Approbation automatique" hint="Approuver les comptes automatiquement">
              <Toggle on={autoApprove} onToggle={() => setAutoApprove(!autoApprove)} />
            </Row>
            <Row label="Autoriser l'inscription" hint="Permettre les nouvelles inscriptions">
              <Toggle on={allowSignup} onToggle={() => setAllowSignup(!allowSignup)} />
            </Row>
            <Field label="Limite d'utilisateurs" value={maxUsers} onChange={setMaxUsers} type="number" placeholder="100" />
          </>
        );
      case "billing":
        return (
          <>
            <SelectField label="Devise" value={currency} onChange={setCurrency} options={[
              { v: "EUR", l: "Euro" }, { v: "USD", l: "Dollar ($)" }, { v: "GBP", l: "Livre" },
            ]} />
            <Field label="Taux de commission (%)" value={commissionRate} onChange={setCommissionRate} type="number" placeholder="5" />
            <Field label="Jours d'essai gratuit" value={trialDays} onChange={setTrialDays} type="number" placeholder="14" />
          </>
        );
      case "notifications":
        return (
          <>
            <Row label="Notifications email" hint="Recevoir les alertes par email">
              <Toggle on={emailNotifs} onToggle={() => setEmailNotifs(!emailNotifs)} />
            </Row>
            <Row label="Notifications push" hint="Alertes push dans l'app">
              <Toggle on={pushNotifs} onToggle={() => setPushNotifs(!pushNotifs)} />
            </Row>
            <Field label="Email administrateur" value={adminEmail} onChange={setAdminEmail} type="email" placeholder="admin@email.com" />
            <Row label="Rapport hebdomadaire" hint="Recevoir un resume chaque semaine" last>
              <Toggle on={weeklyReport} onToggle={() => setWeeklyReport(!weeklyReport)} />
            </Row>
          </>
        );
      case "security":
        return (
          <>
            <Row label="Exiger 2FA" hint="Double authentification obligatoire">
              <Toggle on={require2FA} onToggle={() => setRequire2FA(!require2FA)} />
            </Row>
            <Field label="Timeout de session (min)" value={sessionTimeout} onChange={setSessionTimeout} type="number" placeholder="60" />
            <Field label="Longueur min. mot de passe" value={minPwLength} onChange={setMinPwLength} type="number" placeholder="8" />
            <Row label="Rate limiting" hint="Limiter les requetes par IP" last>
              <Toggle on={rateLimiting} onToggle={() => setRateLimiting(!rateLimiting)} />
            </Row>
          </>
        );
      case "advanced":
        return (
          <>
            <Field label="URL Webhook" value={webhookUrl} onChange={setWebhookUrl} placeholder="https://..." />
            <Row label="Mode debug" hint="Activer les logs detailles" last>
              <Toggle on={debugMode} onToggle={() => setDebugMode(!debugMode)} />
            </Row>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {view ? (
          <motion.div key={view} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView(null)}
                className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center">
                <ArrowLeft size={18} className="text-foreground" />
              </motion.button>
              <h1 className="text-[20px] font-bold text-foreground tracking-tight">{viewTitle[view]}</h1>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="px-6 pb-32">
                <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
                  {renderDetail()}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { saveAll(); setView(null); }}
                  className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow">
                  <Save size={15} /> Enregistrer
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 px-6 pt-5 pb-3">
              <h1 className="text-[24px] font-bold text-foreground tracking-tight">Reglages</h1>
              <p className="text-[12px] text-muted mt-0.5">Configuration et controle de la plateforme.</p>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="px-6 pb-32">
                {/* Admin profile */}
                <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center"><Shield size={24} className="text-accent" /></div>
                  <div>
                    <p className="text-[16px] font-bold text-foreground">Administrateur</p>
                    <p className="text-[12px] text-muted">noah.pscl.08@gmail.com</p>
                    <p className="text-[10px] text-accent font-bold mt-0.5">Super Admin</p>
                  </div>
                </div>

                {/* Settings categories */}
                <div className="space-y-3 mb-5">
                  {settingsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.button key={item.key} whileTap={{ scale: 0.98 }} onClick={() => setView(item.key)}
                        className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5 text-left">
                        <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}><Icon size={18} className={item.ic} /></div>
                        <div className="flex-1"><p className="text-[14px] font-bold text-foreground">{item.label}</p><p className="text-[11px] text-muted mt-0.5">{item.sub}</p></div>
                        <ChevronRight size={16} className="text-border" />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Support messages */}
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowChat(true)}
                  className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5 text-left mb-5">
                  <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center"><MessageCircle size={18} className="text-accent" /></div>
                  <div className="flex-1"><p className="text-[14px] font-bold text-foreground">Messages support</p><p className="text-[11px] text-muted mt-0.5">Voir et repondre aux conversations.</p></div>
                  <UnreadBadge userId="admin" />
                  <ChevronRight size={16} className="text-border" />
                </motion.button>

                {/* Logout */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
                  className="w-full bg-danger-soft rounded-2xl py-4 flex items-center justify-center gap-2">
                  <LogOut size={17} className="text-danger" /><span className="text-[15px] font-bold text-danger">Deconnexion admin</span>
                </motion.button>

                <div className="text-center mt-4"><p className="text-[10px] text-subtle">Lumiere Pro Admin · v1.0</p></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved toast */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-success text-white px-5 py-2.5 rounded-xl shadow-apple-lg flex items-center gap-2 z-50">
            <CheckCircle2 size={16} /> <span className="text-[13px] font-bold">Enregistre</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminChatPanel open={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
}