"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { APP_NAME } from "@/lib/constants";
import Modal from "@/components/Modal";
import Link from "next/link";
import SupportChat, { UnreadBadge } from "@/components/SupportChat";
import {
  User, Crown, Save, CheckCircle2, ChevronRight, LogOut, Camera, Copy, Check, Lock, Plus,
  X as XIcon, Plane, ShieldCheck, MessageSquare, Link2, Globe, Users, CreditCard, Package,
  Smartphone, ExternalLink, Receipt, BookOpen, Sparkles, Mail, Clock, Shield, FileText,
  Gift, Share2, Star, TrendingUp, CalendarDays, Bell, Palette, BarChart3, Wallet, Eye, Headphones,
} from "lucide-react";

type View = null | string;

const COLORS = [
  { n: "Bleu", v: "#007AFF" }, { n: "Violet", v: "#7C3AED" }, { n: "Vert", v: "#10B981" },
  { n: "Rose", v: "#EC4899" }, { n: "Orange", v: "#F59E0B" }, { n: "Cyan", v: "#06B6D4" },
];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function Toggle({ on, set }: { on: boolean; set: () => void }) {
  return (<motion.button whileTap={{ scale: 0.9 }} onClick={set} className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all ${on ? "justify-end" : "justify-start"}`} style={{ backgroundColor: on ? "var(--color-accent)" : "var(--color-border)" }}><div className="w-5 h-5 rounded-full bg-white shadow-sm" /></motion.button>);
}
function Row({ label, hint, children, last = false }: { label: string; hint?: string; children: React.ReactNode; last?: boolean }) {
  return (<div className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-border-light"}`}><div className="flex-1 min-w-0 mr-3"><span className="text-[13px] text-foreground">{label}</span>{hint && <p className="text-[10px] text-muted mt-0.5">{hint}</p>}</div>{children}</div>);
}
function Btn({ onClick, label = "Enregistrer" }: { onClick: () => void; label?: string }) {
  return (<motion.button whileTap={{ scale: 0.97 }} onClick={onClick} className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mt-4"><Save size={15} /> {label}</motion.button>);
}
function PLock({ text }: { text: string }) {
  return (<div className="bg-accent-soft rounded-xl p-3 flex items-center gap-2 mt-3"><Lock size={12} className="text-accent flex-shrink-0" /><p className="text-[11px] text-accent font-semibold">{text}</p></div>);
}

export default function ProfilePage() {
  const { user, updateUser, clients, appointments, invoices, products, getMonthRevenue, logout } = useApp();
  const [v, setV] = useState<View>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [form, setForm] = useState({ name: user.name, business: user.business, phone: user.phone, email: user.email });
  const [photo, setPhoto] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  const [accentColor, setAccentColor] = useState("#007AFF");
  useEffect(() => { const c = localStorage.getItem("accent-color"); if (c) { setAccentColor(c); document.documentElement.style.setProperty("--color-accent", c); } }, []);
  function applyColor(c: string) { setAccentColor(c); document.documentElement.style.setProperty("--color-accent", c); localStorage.setItem("accent-color", c); }

  // Settings state (all categories)
  const [info, setInfo] = useState({ company: user.business || "", desc: "", activity: user.business || "", address: "", email: user.email || "", phone: user.phone || "", insta: "", web: "" });
  const [wh, setWh] = useState({ s: "09:00", e: "19:00", ls: "12:00", le: "13:00" });
  const [wd, setWd] = useState([true, true, true, true, true, false, false]);
  const [vacs, setVacs] = useState<{ s: string; e: string }[]>([]); const [vs, setVs] = useState(""); const [ve, setVe] = useState("");
  const [cancelH, setCancelH] = useState("24");
  const [confMsg, setConfMsg] = useState("Merci pour votre réservation !");
  const [copied, setCopied] = useState(false);
  const [bkTitle, setBkTitle] = useState(user.business || "");
  const bUrl = user.bookingSlug ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${user.bookingSlug}` : null;
  const [badges, setBadges] = useState([{ n: "VIP", c: "#F59E0B" }, { n: "Nouveau", c: "#10B981" }, { n: "Fidèle", c: "#7C3AED" }]); const [nb, setNb] = useState("");
  const [depNew, setDepNew] = useState(true); const [depAmt, setDepAmt] = useState("30");
  const [legal, setLegal] = useState({ name: user.name || "", siret: "", tva: "" }); const [tvaOn, setTvaOn] = useState(false); const [tvaRate, setTvaRate] = useState("20");
  const [pm, setPm] = useState({ cash: true, card: true, transfer: false, check: false, online: false }); const [termOn, setTermOn] = useState(false); const [termUrl, setTermUrl] = useState("");
  const [nRdv, setNRdv] = useState(true); const [nPay, setNPay] = useState(true); const [nStk, setNStk] = useState(true);
  const [tone, setTone] = useState<"friendly"|"pro"|"concise">("friendly"); const [compact, setCompact] = useState(false);
  const [msgs, setMsgs] = useState([{ trigger: "after_booking", text: "Votre RDV est confirmé !", active: true }, { trigger: "before_appt", text: "Rappel : RDV demain.", active: true }, { trigger: "after_visit", text: "Merci pour votre visite !", active: false }]);

  // Loyalty
  const [loyType, setLoyType] = useState<"points"|"visits">("visits"); const [loyGoal, setLoyGoal] = useState("10"); const [loyReward, setLoyReward] = useState("Service gratuit");
  const [loyColor, setLoyColor] = useState("#007AFF"); const [loyBrand, setLoyBrand] = useState(user.business || "Mon entreprise"); const [loyMsg, setLoyMsg] = useState("Cumulez à chaque visite !"); const [loyDemo, setLoyDemo] = useState(6);
  const [loyStep, setLoyStep] = useState(0);
  const [loyCodeCopied, setLoyCodeCopied] = useState(false);
  const loyaltyCode = useMemo(() => {
    const base = (user.bookingSlug || user.name || "pro").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
    return `FID-${base}-${Math.abs((user.name || "").length * 7 + 42).toString(36).toUpperCase().slice(0, 3)}`;
  }, [user.bookingSlug, user.name]);

  // Referral
  const referralCode = useMemo(() => { const slug = user.bookingSlug || user.name?.replace(/\s/g, "").toLowerCase() || "user"; return `${slug.toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }, [user.bookingSlug, user.name]);
  const [refCount] = useState(3); // simulated
  const [refCopied, setRefCopied] = useState(false);
  const refRewards = [{ need: 1, label: "1 mois d'essai Pro", done: refCount >= 1 }, { need: 3, label: "20% de réduction", done: refCount >= 3 }, { need: 5, label: "Accès Premium gratuit", done: refCount >= 5 }];

  // Advantages
  const [promos, setPromos] = useState<{ code: string; type: "percent" | "fixed"; value: string; expiry: string }[]>([
    { code: "BIENVENUE20", type: "percent", value: "20", expiry: "2025-12-31" },
  ]);
  const [newPromo, setNewPromo] = useState({ code: "", type: "percent" as "percent" | "fixed", value: "", expiry: "" });
  const [gifts, setGifts] = useState<{ amount: string; code: string; used: boolean }[]>([]);
  const [newGift, setNewGift] = useState("");

  const totalDone = appointments.filter((a) => a.status === "done").length;
  const totalA = appointments.filter((a) => a.status !== "canceled").length;
  const conv = totalA > 0 ? Math.round((totalDone / totalA) * 100) : 0;
  const log = useMemo(() => {
    const r: { t: string; d: string; dt: string; c: string }[] = [];
    appointments.slice(0, 6).forEach((a) => r.push({ t: a.title, d: a.date, dt: a.status === "done" ? "Terminé" : a.status === "canceled" ? "Annulé" : "Confirmé", c: a.status === "done" ? "bg-success" : a.status === "canceled" ? "bg-danger" : "bg-accent" }));
    invoices.filter((i) => i.clientId !== "__expense__").slice(0, 4).forEach((i) => r.push({ t: i.description, d: i.date, dt: i.status === "paid" ? `+${i.amount}€` : `${i.amount}€`, c: i.status === "paid" ? "bg-success" : "bg-warning" }));
    return r.sort((a, b) => b.d.localeCompare(a.d)).slice(0, 8);
  }, [appointments, invoices]);

  function handleSave() { updateUser({ name: form.name.trim(), business: form.business.trim(), phone: form.phone.trim(), email: form.email.trim() }); setShowEdit(false); }
  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; const r = new FileReader();
    r.onload = (ev) => { const s = ev.target?.result as string; if (!s) return; const i = new Image(); i.onload = () => { const c = document.createElement("canvas"); const m = 200; let w = i.width, h = i.height; if (w > h) { h = (h/w)*m; w = m; } else { w = (w/h)*m; h = m; } c.width = w; c.height = h; c.getContext("2d")!.drawImage(i,0,0,w,h); setPhoto(c.toDataURL("image/jpeg",0.8)); }; i.src = s; };
    r.readAsDataURL(f); e.target.value = "";
  }
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  // Settings categories with sub-items
  // Settings categories — items with __link__ prefix navigate to full pages
  const categories = [
    { title: "Compte & Informations", items: [
      { i: "🏢", t: "Informations entreprise", s: "Identité, contact, réseaux.", k: "__link__/settings/info" },
      { i: "🌍", t: "Visibilité publique", s: "Page en ligne.", k: "visibility", p: true },
    ]},
    { title: "Activité", items: [
      { i: "📊", t: "Statistiques & Performance", s: "KPIs, tendances et insights.", k: "__link__/settings/analytics" },
      { i: "💬", t: "Messages automatisés", s: "Rappels et confirmations.", k: "__link__/settings/messages" },
    ]},
    { title: "Réservations", items: [
      { i: "📅", t: "Disponibilités & Horaires", s: "Créneaux, congés, règles.", k: "__link__/settings/availability" },
      { i: "🔗", t: "Lien de réservation", s: "URL, QR code, intégration.", k: "__link__/settings/booking-link" },
    ]},
    { title: "Clients & Fidélisation", items: [
      { i: "👥", t: "Gestion clients", s: "Badges et acomptes.", k: "clients" },
      { i: "💎", t: "Programme fidélité", s: "Cartes et récompenses.", k: "__link__/loyalty-manage", p: true },
      { i: "🎁", t: "Parrainage", s: "Code, récompenses, suivi.", k: "referral" },
      { i: "🎫", t: "Avantages clients", s: "Codes promo, cartes cadeaux.", k: "advantages" },
    ]},
    { title: "Paiements & Comptabilité", items: [
      { i: "💳", t: "Paiements & Facturation", s: "Stripe, TVA, coordonnées.", k: "__link__/settings/payments" },
      { i: "🧾", t: "Comptabilité", s: "TVA, factures, export.", k: "accounting" },
      { i: "📦", t: "Stock", s: "Alertes, fournisseurs.", k: "stock" },
    ]},
    { title: "Application", items: [
      { i: "🎨", t: "Personnalisation", s: "Couleurs et thème.", k: "__link__/settings/personalization" },
      { i: "⚙️", t: "Préférences", s: "Notifications, données.", k: "appSettings" },
      { i: "📘", t: "Guide", s: "Découvrir l'application.", k: "__link__/guide" },
    ]},
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background">
      <div className="flex-shrink-0"><header className="px-6 pt-5 pb-3"><h1 className="text-[22px] font-bold text-foreground tracking-tight">Profil</h1></header></div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* Avatar */}
          <div className="flex flex-col items-center text-center pt-2 pb-5">
            <div className="relative mb-4">
              <div className="w-[110px] h-[110px] rounded-full overflow-hidden shadow-apple-lg">{photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-border-light flex items-center justify-center"><User size={44} className="text-muted" /></div>}</div>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => photoRef.current?.click()} className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-sm border-[3px] border-background" style={{ backgroundColor: "var(--color-accent)" }}><Camera size={14} className="text-white" /></motion.button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
            <h2 className="text-[24px] font-bold text-foreground tracking-tight">{user.name || APP_NAME}</h2>
            {user.business && <p className="text-[14px] text-muted mt-1">{user.business}</p>}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setForm({ name: user.name, business: user.business, phone: user.phone, email: user.email }); setShowEdit(true); }}
              className="mt-3 text-white text-[12px] font-bold px-5 py-2 rounded-xl" style={{ backgroundColor: "var(--color-accent)" }}>Modifier</motion.button>
          </div>

          {/* Subscription — real plan from user profile */}
          <Link href="/subscription">
            <motion.div whileTap={{ scale: 0.98 }} className="w-full bg-accent-gradient rounded-[22px] p-5 shadow-card-premium text-left mb-5">
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-1">Abonnement</p>
              <h3 className="text-[20px] font-bold text-white">{(() => { const names: Record<string, string> = { essentiel: "Essentiel", croissance: "Croissance", entreprise: "Entreprise" }; return names[user.plan || "essentiel"] || "Essentiel"; })()}</h3>
              <div className="flex items-end gap-1 mt-1 mb-3"><p className="text-[28px] font-bold text-white leading-none">{(() => { const p: Record<string, string> = { essentiel: "0", croissance: "9,99", entreprise: "19,99" }; return p[user.plan || "essentiel"] ?? "0"; })()}€</p><p className="text-[13px] text-white/70 mb-0.5">/ mois</p></div>
              <div className="bg-white rounded-xl py-2.5 text-center"><span className="text-[13px] font-bold" style={{ color: "var(--color-accent)" }}>Gérer l&apos;abonnement</span></div>
            </motion.div>
          </Link>

          {/* Stats */}
          <div className="bg-white rounded-[22px] shadow-card-premium overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light"><span className="text-[14px] text-foreground">Conversion</span><span className="text-[16px] font-bold" style={{ color: "var(--color-accent)" }}>{conv}%</span></div>
            <div className="flex items-center justify-between px-5 py-4"><span className="text-[14px] text-foreground">Clients</span><span className="text-[16px] font-bold" style={{ color: "var(--color-accent)" }}>{clients.length}</span></div>
          </div>

          {/* Settings by category */}
          {categories.map((cat) => (
            <div key={cat.title} className="mb-5">
              <p className="text-[12px] text-muted font-bold uppercase tracking-wider mb-2 px-1">{cat.title}</p>
              <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden">
                {cat.items.map((s, i) => {
                  const isLink = s.k.startsWith("__link__");
                  const href = isLink ? s.k.replace("__link__", "") : undefined;
                  const inner = (<>
                    <div className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center flex-shrink-0 text-[16px]">{s.i}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><p className="text-[13px] font-bold text-foreground">{s.t}</p>{s.p && <span className="text-[8px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded">PRO</span>}</div>
                      <p className="text-[10px] text-muted mt-0.5">{s.s}</p>
                    </div>
                    <ChevronRight size={15} className="text-border flex-shrink-0" />
                  </>);
                  const cls = `w-full flex items-center gap-3 px-4 py-3.5 text-left ${i < cat.items.length - 1 ? "border-b border-border-light" : ""}`;
                  return isLink ? (
                    <Link key={s.k} href={href!} className={cls}>{inner}</Link>
                  ) : (
                    <motion.button key={s.k} whileTap={{ scale: 0.98 }} onClick={() => setV(s.k)} className={cls}>{inner}</motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Support + Legal + Logout */}
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowChat(true)} className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3 mb-3">
            <Headphones size={16} className="text-accent" /><span className="text-[13px] font-semibold text-foreground flex-1">Contacter le support</span>
            <UnreadBadge userId={user.email || "pro-user"} />
            <ChevronRight size={15} className="text-border" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setV("legal")} className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3 mb-3">
            <Shield size={16} className="text-muted" /><span className="text-[13px] font-semibold text-foreground flex-1">Mentions légales</span><ChevronRight size={15} className="text-border" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={logout}
            className="w-full bg-danger-soft rounded-2xl py-4 flex items-center justify-center gap-2 mb-5">
            <LogOut size={17} className="text-danger" /><span className="text-[15px] font-bold text-danger">Se déconnecter</span>
          </motion.button>
          <div className="text-center pb-4"><p className="text-[10px] text-subtle">© 2024 Lumière Pro · v1.0</p></div>
        </div>
      </div>

      {saved && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-success text-white text-[13px] font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2"><CheckCircle2 size={15} /> Enregistré</motion.div>)}

      {/* ═══ MODALS ═══ */}

      {/* Edit profile */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier le profil">
        <div className="space-y-4">
          <div className="flex justify-center"><div className="relative"><div className="w-[80px] h-[80px] rounded-full overflow-hidden">{photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-border-light flex items-center justify-center"><User size={32} className="text-muted" /></div>}</div><motion.button whileTap={{ scale: 0.85 }} onClick={() => photoRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-sm border-2 border-white" style={{ backgroundColor: "var(--color-accent)" }}><Camera size={11} className="text-white" /></motion.button></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Nom</label><input value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} className="input-field" /></div><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Activité</label><input value={form.business} onChange={(e) => setForm({...form,business:e.target.value})} className="input-field" /></div></div>
          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Téléphone</label><input value={form.phone} onChange={(e) => setForm({...form,phone:e.target.value})} type="tel" className="input-field" /></div>
          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Email</label><input value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} type="email" className="input-field" /></div>
          <Btn onClick={handleSave} />
        </div>
      </Modal>

      {/* Subscription */}
      {/* INFO */}
      <Modal open={v==="info"} onClose={() => setV(null)} title="Informations" size="large">
        <div className="space-y-4">
          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Entreprise</label><input value={info.company} onChange={(e) => setInfo({...info,company:e.target.value})} className="input-field" /></div>
          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Description</label><textarea value={info.desc} onChange={(e) => setInfo({...info,desc:e.target.value})} rows={2} className="input-field resize-none" /></div>
          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Adresse</label><input value={info.address} onChange={(e) => setInfo({...info,address:e.target.value})} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Email</label><input value={info.email} onChange={(e) => setInfo({...info,email:e.target.value})} className="input-field" /></div><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Téléphone</label><input value={info.phone} onChange={(e) => setInfo({...info,phone:e.target.value})} className="input-field" /></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Instagram</label><input value={info.insta} onChange={(e) => setInfo({...info,insta:e.target.value})} className="input-field" placeholder="@" /></div><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Site web</label><input value={info.web} onChange={(e) => setInfo({...info,web:e.target.value})} className="input-field" /></div></div>
          <Btn onClick={flash} />
        </div>
      </Modal>

      {/* VISIBILITY */}
      <Modal open={v==="visibility"} onClose={() => setV(null)} title="Visibilité" size="large">
        <div className="space-y-5">
          <div className="bg-accent-gradient rounded-2xl p-4 flex items-center gap-3"><Globe size={20} className="text-white" /><div className="flex-1"><p className="text-[14px] font-bold text-white">Page publique</p></div><Toggle on={false} set={() => {}} /></div>
          <PLock text="Fonctionnalité Premium." />
        </div>
      </Modal>

      {/* ACTIVITY */}
      <Modal open={v==="activity"} onClose={() => setV(null)} title="Activité" size="large">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">{[{l:"RDV",v:totalDone,c:"text-success"},{l:"Revenu/mois",v:`${getMonthRevenue().toFixed(0)}€`,c:"text-accent"},{l:"Conversion",v:`${conv}%`,c:"text-accent"},{l:"Clients",v:clients.length,c:"text-foreground"}].map((s,i) => (<div key={i} className="bg-border-light rounded-xl p-3.5"><p className={`text-[18px] font-bold leading-none ${s.c}`}>{s.v}</p><p className="text-[10px] text-muted mt-1">{s.l}</p></div>))}</div>
          <div><p className="text-[13px] font-bold text-foreground mb-3">Historique</p>{log.length === 0 ? <p className="text-[13px] text-muted text-center py-6">Aucune activité</p> : (<div className="space-y-2">{log.map((it,i) => (<div key={i} className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3"><div className={`w-2 h-2 rounded-full ${it.c}`} /><div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-foreground truncate">{it.t}</p><p className="text-[10px] text-muted">{new Date(it.d).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p></div><span className="text-[12px] font-bold text-muted">{it.dt}</span></div>))}</div>)}</div>
        </div>
      </Modal>

      {/* MESSAGES */}
      <Modal open={v==="messages"} onClose={() => setV(null)} title="Messages" size="large">
        <div className="space-y-4">{msgs.map((m,i) => (<div key={i} className="bg-white rounded-2xl p-4 shadow-card-premium"><div className="flex items-center justify-between mb-2"><span className="text-[11px] font-bold text-accent uppercase tracking-wider">{m.trigger==="after_booking"?"Après réservation":m.trigger==="before_appt"?"Avant RDV":"Après visite"}</span><Toggle on={m.active} set={()=>{const u=[...msgs];u[i]={...u[i],active:!u[i].active};setMsgs(u);}} /></div><textarea value={m.text} onChange={(e)=>{const u=[...msgs];u[i]={...u[i],text:e.target.value};setMsgs(u);}} rows={2} className="w-full bg-border-light rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none resize-none" /></div>))}<Btn onClick={flash} /></div>
      </Modal>

      {/* BOOKING */}
      <Modal open={v==="booking"} onClose={() => setV(null)} title="Disponibilités" size="large">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] text-muted font-semibold mb-1 block">Début</label><input type="time" value={wh.s} onChange={(e)=>setWh({...wh,s:e.target.value})} className="input-field text-[13px]" /></div><div><label className="text-[11px] text-muted font-semibold mb-1 block">Fin</label><input type="time" value={wh.e} onChange={(e)=>setWh({...wh,e:e.target.value})} className="input-field text-[13px]" /></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] text-muted font-semibold mb-1 block">Pause</label><input type="time" value={wh.ls} onChange={(e)=>setWh({...wh,ls:e.target.value})} className="input-field text-[13px]" /></div><div><label className="text-[11px] text-muted font-semibold mb-1 block">Fin pause</label><input type="time" value={wh.le} onChange={(e)=>setWh({...wh,le:e.target.value})} className="input-field text-[13px]" /></div></div>
          <div className="flex gap-1.5">{DAYS.map((d,i) => (<motion.button key={d} whileTap={{scale:0.9}} onClick={()=>{const dd=[...wd];dd[i]=!dd[i];setWd(dd);}} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold ${wd[i]?"bg-accent text-white":"bg-border-light text-muted"}`}>{d}</motion.button>))}</div>
          <div><p className="text-[13px] font-bold text-foreground mb-2">Congés</p><div className="flex gap-2 mb-2"><input type="date" value={vs} onChange={(e)=>setVs(e.target.value)} className="input-field text-[12px] flex-1" /><input type="date" value={ve} onChange={(e)=>setVe(e.target.value)} className="input-field text-[12px] flex-1" /><motion.button whileTap={{scale:0.9}} onClick={()=>{if(vs&&ve){setVacs([...vacs,{s:vs,e:ve}]);setVs("");setVe("");}}} className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center"><Plus size={16} /></motion.button></div>{vacs.map((vv,i)=>(<div key={i} className="flex items-center justify-between bg-warning-soft rounded-xl px-3.5 py-2.5 mb-1.5"><span className="text-[12px] font-semibold">{new Date(vv.s).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} → {new Date(vv.e).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span><motion.button whileTap={{scale:0.8}} onClick={()=>setVacs(vacs.filter((_,j)=>j!==i))}><XIcon size={14} className="text-warning" /></motion.button></div>))}</div>
          <div><p className="text-[13px] font-bold text-foreground mb-2">Annulation</p><div className="flex gap-2">{["12","24","48","72"].map((h)=>(<motion.button key={h} whileTap={{scale:0.9}} onClick={()=>setCancelH(h)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${cancelH===h?"bg-accent text-white":"bg-border-light text-muted"}`}>{h}h</motion.button>))}</div></div>
          <Btn onClick={flash} />
        </div>
      </Modal>

      {/* BOOKING LINK */}
      <Modal open={v==="bookingLink"} onClose={() => setV(null)} title="Lien de réservation" size="large">
        <div className="space-y-5">{bUrl ? (<><div className="flex items-center gap-2"><div className="flex-1 bg-border-light rounded-xl px-3.5 py-2.5 text-[11px] text-muted truncate">{bUrl}</div><motion.button whileTap={{scale:0.9}} onClick={()=>{navigator.clipboard.writeText(bUrl);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className={`px-3.5 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 ${copied?"bg-success text-white":"bg-accent text-white"}`}>{copied?<><Check size={13}/> Copié</>:<><Copy size={13}/> Copier</>}</motion.button><Link href={bUrl} target="_blank"><motion.div whileTap={{scale:0.9}} className="w-10 h-10 rounded-xl bg-border-light flex items-center justify-center flex-shrink-0"><Eye size={16} className="text-accent" /></motion.div></Link></div><p className="text-[10px] text-muted">Cliquez 👁 pour prévisualiser la page de réservation.</p><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Titre</label><input value={bkTitle} onChange={(e)=>setBkTitle(e.target.value)} className="input-field" /></div><Btn onClick={flash} /></>) : <p className="text-[13px] text-muted text-center py-8">Complétez votre profil pour un lien.</p>}</div>
      </Modal>

      {/* CLIENTS */}
      <Modal open={v==="clients"} onClose={() => setV(null)} title="Clients" size="large">
        <div className="space-y-5">
          <div><p className="text-[13px] font-bold text-foreground mb-3">Badges</p><div className="space-y-2 mb-3">{badges.map((b,i)=>(<div key={i} className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3"><div className="w-4 h-4 rounded-full" style={{backgroundColor:b.c}} /><span className="text-[13px] font-bold text-foreground flex-1">{b.n}</span><motion.button whileTap={{scale:0.8}} onClick={()=>setBadges(badges.filter((_,j)=>j!==i))}><XIcon size={13} className="text-muted" /></motion.button></div>))}</div><div className="flex gap-2"><input value={nb} onChange={(e)=>setNb(e.target.value)} placeholder="Nom" className="input-field flex-1 text-[13px]" /><motion.button whileTap={{scale:0.9}} onClick={()=>{if(nb.trim()){setBadges([...badges,{n:nb.trim(),c:COLORS[badges.length%COLORS.length].v}]);setNb("");}}} className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center"><Plus size={16} /></motion.button></div></div>
          <div><p className="text-[13px] font-bold text-foreground mb-2">Acompte</p><div className="bg-border-light rounded-2xl p-4 space-y-3"><Row label="Nouveaux clients"><Toggle on={depNew} set={()=>setDepNew(!depNew)} /></Row>{depNew && <div><label className="text-[11px] text-muted font-semibold mb-1 block">Montant (€)</label><input type="number" value={depAmt} onChange={(e)=>setDepAmt(e.target.value)} className="input-field text-[13px]" /></div>}</div></div>
          <Btn onClick={flash} />
        </div>
      </Modal>

      {/* ═══ REFERRAL (NEW) ═══ */}
      <Modal open={v==="referral"} onClose={() => setV(null)} title="Parrainage" size="large">
        <div className="space-y-5">
          {/* Code + share */}
          <div className="bg-accent-gradient rounded-2xl p-5 text-center">
            <Gift size={28} className="text-white/80 mx-auto mb-2" />
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-1">Votre code parrainage</p>
            <p className="text-[24px] font-bold text-white tracking-widest">{referralCode}</p>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => { navigator.clipboard.writeText(referralCode); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000); }}
              className="mt-3 bg-white rounded-xl px-5 py-2.5 text-[13px] font-bold inline-flex items-center gap-2" style={{ color: "var(--color-accent)" }}>
              {refCopied ? <><Check size={14} /> Copié !</> : <><Share2 size={14} /> Partager le code</>}
            </motion.button>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
            <p className="text-[32px] font-bold text-foreground">{refCount}</p>
            <p className="text-[12px] text-muted font-medium">filleul{refCount !== 1 ? "s" : ""} parrainé{refCount !== 1 ? "s" : ""}</p>
          </div>

          {/* Rewards progression */}
          <div>
            <p className="text-[13px] font-bold text-foreground mb-3">Récompenses</p>
            <div className="space-y-2.5">
              {refRewards.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3.5 ${r.done ? "bg-success-soft" : "bg-border-light"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${r.done ? "bg-success text-white" : "bg-white text-muted shadow-sm"}`}>
                    {r.done ? <CheckCircle2 size={16} /> : r.need}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[13px] font-bold ${r.done ? "text-success" : "text-foreground"}`}>{r.need} parrainage{r.need > 1 ? "s" : ""}</p>
                    <p className="text-[11px] text-muted">{r.label}</p>
                  </div>
                  {r.done && <span className="text-[10px] font-bold text-success bg-white px-2 py-0.5 rounded-md">Débloqué</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] text-muted font-medium">Progression</p>
              <p className="text-[11px] font-bold text-accent">{refCount}/5</p>
            </div>
            <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-accent" initial={{ width: "0%" }} animate={{ width: `${Math.min((refCount / 5) * 100, 100)}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══ LOYALTY ═══ */}
      <Modal open={v==="loyalty"} onClose={() => { setV(null); setLoyStep(0); }} title="Fidélité" size="large">
        <div className="space-y-5">
          <div className="flex gap-1">{[["Carte",0],["Règles",1],["Aperçu",2]].map(([l,idx]) => (<motion.button key={idx as number} whileTap={{scale:0.95}} onClick={()=>setLoyStep(idx as number)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold text-center ${loyStep===idx?"bg-accent text-white":"bg-border-light text-muted"}`}>{l as string}</motion.button>))}</div>

          {loyStep === 0 && (<>
            <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{backgroundColor:loyColor}}>
              <div className="absolute top-3 right-3 text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-md">LIVE</div>
              <div className="flex items-center gap-2 mb-6"><div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><Sparkles size={16} className="text-white" /></div><span className="text-[11px] font-bold uppercase tracking-wider text-white/70">{loyType==="points"?"POINTS":"PLATINUM"}</span></div>
              <p className="text-[9px] text-white/50 uppercase tracking-wider">Détenteur</p><p className="text-[17px] font-bold mt-0.5">{loyBrand}</p>
            </div>
            <div><p className="text-[13px] font-bold text-foreground mb-3">Couleur</p><div className="flex gap-3">{["#007AFF","#1D1D1F","#7C3AED","#10B981","#DC2626"].map((c)=>(<motion.button key={c} whileTap={{scale:0.9}} onClick={()=>setLoyColor(c)} className={`w-11 h-11 rounded-full ${loyColor===c?"ring-2 ring-offset-2 ring-foreground":""}`} style={{backgroundColor:c}} />))}</div></div>
            <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Nom</label><input value={loyBrand} onChange={(e)=>setLoyBrand(e.target.value)} className="input-field" /></div>
            <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Message</label><textarea value={loyMsg} onChange={(e)=>setLoyMsg(e.target.value)} rows={2} className="input-field resize-none" /></div>
            <Btn onClick={()=>{flash();setLoyStep(1);}} label="Suivant" />
          </>)}

          {loyStep === 1 && (<>
            <div className="flex gap-2"><motion.button whileTap={{scale:0.95}} onClick={()=>setLoyType("visits")} className={`flex-1 p-4 rounded-2xl text-left ${loyType==="visits"?"bg-accent-soft ring-1 ring-accent/20":"bg-border-light"}`}><p className="text-[14px] font-bold text-foreground">Visites</p><p className="text-[11px] text-muted mt-1">X visites = récompense</p></motion.button><motion.button whileTap={{scale:0.95}} onClick={()=>setLoyType("points")} className={`flex-1 p-4 rounded-2xl text-left ${loyType==="points"?"bg-accent-soft ring-1 ring-accent/20":"bg-border-light"}`}><p className="text-[14px] font-bold text-foreground">Points</p><p className="text-[11px] text-muted mt-1">1€ = 1 point</p></motion.button></div>
            <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Objectif</label><div className="flex gap-2">{(loyType==="visits"?["5","8","10","15"]:["50","100","150","200"]).map((n)=>(<motion.button key={n} whileTap={{scale:0.9}} onClick={()=>setLoyGoal(n)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${loyGoal===n?"bg-accent text-white":"bg-border-light text-muted"}`}>{n}</motion.button>))}</div></div>
            <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Récompense</label><div className="space-y-2">{["Service gratuit","Remise 20%","Remise 50%","Cadeau surprise"].map((r)=>(<motion.button key={r} whileTap={{scale:0.98}} onClick={()=>setLoyReward(r)} className={`w-full p-3 rounded-xl text-left text-[13px] font-semibold ${loyReward===r?"bg-accent-soft text-accent ring-1 ring-accent/20":"bg-border-light text-foreground"}`}>{r}</motion.button>))}</div></div>
            <Btn onClick={()=>{flash();setLoyStep(2);}} label="Aperçu" />
          </>)}

          {loyStep === 2 && (<>
            <div className="bg-border-light/50 rounded-[24px] p-5">
              <div className="rounded-2xl p-4 text-white mb-4" style={{backgroundColor:loyColor}}><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Sparkles size={14} className="text-white" /></div><span className="text-[10px] font-bold uppercase text-white/70">{loyType==="points"?"POINTS":"FIDÉLITÉ"}</span></div><p className="text-[15px] font-bold mt-2">{loyBrand}</p></div>
              <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                <div className="flex items-center justify-between mb-2"><p className="text-[13px] font-bold text-foreground">{loyType==="visits"?"Visites":"Points"}</p><span className="text-[12px] font-bold text-accent">{loyDemo}/{loyGoal}</span></div>
                {loyType==="visits" ? (<div className="flex gap-1.5 mb-3">{Array.from({length:parseInt(loyGoal)||10}).map((_,i) => (<div key={i} className={`flex-1 h-2.5 rounded-full ${i<loyDemo?"bg-accent":"bg-border-light"}`} />))}</div>) : (<div className="w-full h-2.5 bg-border-light rounded-full overflow-hidden mb-3"><motion.div className="h-full rounded-full" style={{backgroundColor:loyColor}} initial={{width:"0%"}} animate={{width:`${Math.min((loyDemo/(parseInt(loyGoal)||100))*100,100)}%`}} transition={{duration:0.8}} /></div>)}
                <p className="text-[12px] text-muted">{parseInt(loyGoal)-loyDemo>0?`Plus que ${parseInt(loyGoal)-loyDemo} pour la récompense !`:"Récompense débloquée !"}</p>
                <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-success-soft flex items-center justify-center"><CheckCircle2 size={14} className="text-success" /></div><div><p className="text-[12px] font-bold text-foreground">Récompense</p><p className="text-[11px] text-muted">{loyReward}</p></div></div>
              </div>
              <div className="flex items-center justify-center gap-3 mt-4"><motion.button whileTap={{scale:0.9}} onClick={()=>setLoyDemo(Math.max(0,loyDemo-1))} className="w-9 h-9 rounded-xl bg-white shadow-sm-apple flex items-center justify-center text-[16px] font-bold text-muted">−</motion.button><span className="text-[14px] font-bold text-foreground w-16 text-center">{loyDemo}</span><motion.button whileTap={{scale:0.9}} onClick={()=>setLoyDemo(Math.min(parseInt(loyGoal)||10,loyDemo+1))} className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center text-[16px] font-bold">+</motion.button></div>
            </div>
            {/* Loyalty sharing code */}
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[12px] font-bold text-foreground mb-2">Code de partage client</p>
              <p className="text-[10px] text-muted mb-3">Vos clients entrent ce code pour ajouter votre carte fidélité à leur compte.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-border-light rounded-xl px-4 py-2.5 text-[15px] font-bold text-foreground tracking-wider text-center">{loyaltyCode}</div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { navigator.clipboard.writeText(loyaltyCode); setLoyCodeCopied(true); setTimeout(() => setLoyCodeCopied(false), 2000); }}
                  className={`px-4 py-2.5 rounded-xl text-[12px] font-bold ${loyCodeCopied ? "bg-success text-white" : "bg-accent text-white"}`}>
                  {loyCodeCopied ? "Copié !" : "Copier"}
                </motion.button>
              </div>
            </div>
            <PLock text="Programme fidélité : fonctionnalité Premium." />
            <Btn onClick={flash} label="Enregistrer" />
          </>)}
        </div>
      </Modal>

      {/* PAYMENTS */}
      <Modal open={v==="payments"} onClose={() => setV(null)} title="Paiements" size="large">
        <div className="space-y-5">
          <div className="bg-border-light rounded-2xl p-4 space-y-3">{([["cash","Espèces"],["card","Carte"],["transfer","Virement"],["check","Chèque"],["online","En ligne"]] as const).map(([k,l],i,a)=>(<Row key={k} label={l} last={i===a.length-1}><Toggle on={pm[k]} set={()=>setPm({...pm,[k]:!pm[k]})} /></Row>))}</div>
          <div className="bg-border-light rounded-2xl p-4 space-y-3"><Row label="Terminal"><Toggle on={termOn} set={()=>setTermOn(!termOn)} /></Row>{termOn && <div><label className="text-[11px] text-muted font-semibold mb-1 block">Lien terminal</label><input value={termUrl} onChange={(e)=>setTermUrl(e.target.value)} placeholder="https://..." className="input-field text-[13px]" /></div>}</div>
          <PLock text="Paiement en ligne et terminal : Premium." />
          <Btn onClick={flash} />
        </div>
      </Modal>

      {/* ACCOUNTING */}
      <Modal open={v==="accounting"} onClose={() => setV(null)} title="Comptabilité" size="large">
        <div className="space-y-5">
          <div className="space-y-3"><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Raison sociale</label><input value={legal.name} onChange={(e)=>setLegal({...legal,name:e.target.value})} className="input-field" /></div><div><label className="text-[12px] text-muted font-semibold mb-1.5 block">SIRET</label><input value={legal.siret} onChange={(e)=>setLegal({...legal,siret:e.target.value})} className="input-field" /></div></div>
          <div className="bg-border-light rounded-2xl p-4 space-y-3"><Row label="TVA"><Toggle on={tvaOn} set={()=>setTvaOn(!tvaOn)} /></Row>{tvaOn && <div className="flex gap-2">{["5.5","10","20"].map((r)=>(<motion.button key={r} whileTap={{scale:0.9}} onClick={()=>setTvaRate(r)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${tvaRate===r?"bg-accent text-white":"bg-white text-muted"}`}>{r}%</motion.button>))}</div>}</div>
          <div className="grid grid-cols-2 gap-2"><div className="bg-success-soft rounded-xl p-3 text-center"><p className="text-[18px] font-bold text-success">{invoices.filter(i=>i.status==="paid"&&i.clientId!=="__expense__").reduce((s,i)=>s+i.amount,0).toFixed(0)} €</p><p className="text-[10px] text-success mt-0.5">Encaissé</p></div><div className="bg-warning-soft rounded-xl p-3 text-center"><p className="text-[18px] font-bold text-warning">{invoices.filter(i=>i.status==="pending").reduce((s,i)=>s+i.amount,0).toFixed(0)} €</p><p className="text-[10px] text-warning mt-0.5">En attente</p></div></div>
          <Btn onClick={flash} />
        </div>
      </Modal>

      {/* STOCK */}
      <Modal open={v==="stock"} onClose={() => setV(null)} title="Stock" size="large">
        <div className="space-y-5">
          <div className="bg-border-light rounded-2xl p-4 space-y-3"><Row label="Alerte stock bas"><Toggle on={true} set={()=>{}} /></Row><Row label="En alerte" last><span className="text-[13px] font-bold text-danger">{products.filter(p=>p.quantity<=p.minQuantity).length}</span></Row></div>
          <Btn onClick={flash} />
        </div>
      </Modal>

      {/* PERSONALIZATION */}
      <Modal open={v==="personalization"} onClose={() => setV(null)} title="Personnalisation" size="large">
        <div className="space-y-6">
          <div><p className="text-[13px] font-bold text-foreground mb-3">Couleur</p><div className="flex gap-3 flex-wrap">{COLORS.map((c)=>(<motion.button key={c.v} whileTap={{scale:0.9}} onClick={()=>applyColor(c.v)} className={`w-12 h-12 rounded-xl flex items-center justify-center ${accentColor===c.v?"ring-2 ring-offset-2 ring-foreground":""}`} style={{backgroundColor:c.v}}>{accentColor===c.v && <CheckCircle2 size={18} className="text-white" />}</motion.button>))}</div><p className="text-[11px] text-muted mt-2">Appliqué instantanément sur toute l&apos;app.</p></div>
          <div><p className="text-[13px] font-bold text-foreground mb-3">Assistant</p><div className="space-y-2">{([["friendly","Amical","Chaleureux"],["pro","Professionnel","Formel"],["concise","Minimaliste","Court"]] as const).map(([k,l,d])=>(<motion.button key={k} whileTap={{scale:0.98}} onClick={()=>setTone(k)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left ${tone===k?"bg-accent-soft ring-1 ring-accent/20":"bg-border-light"}`}><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${tone===k?"border-accent":"border-border"}`}>{tone===k && <div className="w-2 h-2 rounded-full bg-accent" />}</div><div><p className="text-[13px] font-bold text-foreground">{l}</p><p className="text-[11px] text-muted">{d}</p></div></motion.button>))}</div></div>
          <div className="bg-border-light rounded-2xl p-4"><Row label="Cartes compactes" hint="Affichage condensé." last><Toggle on={compact} set={()=>setCompact(!compact)} /></Row></div>
          <Btn onClick={flash} />
        </div>
      </Modal>

      {/* APP SETTINGS */}
      <Modal open={v==="appSettings"} onClose={() => setV(null)} title="Préférences" size="large">
        <div className="space-y-5">
          <div className="bg-border-light rounded-2xl p-4 space-y-3"><Row label="Thème"><span className="text-[12px] font-bold text-accent bg-accent-soft px-3 py-1 rounded-lg">Clair</span></Row><Row label="Langue" last><span className="text-[12px] font-bold text-foreground">Français</span></Row></div>
          <div><p className="text-[13px] font-bold text-foreground mb-3">Notifications</p><div className="bg-border-light rounded-2xl p-4 space-y-3"><Row label="Rendez-vous"><Toggle on={nRdv} set={()=>setNRdv(!nRdv)} /></Row><Row label="Paiements"><Toggle on={nPay} set={()=>setNPay(!nPay)} /></Row><Row label="Stock" last><Toggle on={nStk} set={()=>setNStk(!nStk)} /></Row></div></div>
          <div className="bg-border-light rounded-2xl p-4 space-y-3"><Row label="Synchro"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-success" /><span className="text-[12px] font-bold text-success">OK</span></div></Row><Row label="Version" last><span className="text-[12px] text-muted">1.0</span></Row></div>
          <Btn onClick={flash} />
        </div>
      </Modal>

      {/* ADVANTAGES */}
      <Modal open={v==="advantages"} onClose={() => setV(null)} title="Avantages clients" size="large">
        <div className="space-y-5">
          {/* Promo codes */}
          <div>
            <p className="text-[13px] font-bold text-foreground mb-3">Codes promotionnels</p>
            {promos.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3 mb-2">
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-foreground">{p.code}</p>
                  <p className="text-[10px] text-muted">{p.type === "percent" ? `${p.value}%` : `${p.value} €`} · Exp. {p.expiry ? new Date(p.expiry).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—"}</p>
                </div>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => setPromos(promos.filter((_, j) => j !== i))}><XIcon size={13} className="text-muted" /></motion.button>
              </div>
            ))}
            <div className="bg-white rounded-2xl p-4 shadow-card-premium space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-muted font-semibold mb-1 block">Code</label><input value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} placeholder="PROMO20" className="input-field text-[13px]" /></div>
                <div><label className="text-[11px] text-muted font-semibold mb-1 block">Valeur</label><input type="number" value={newPromo.value} onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })} placeholder="20" className="input-field text-[13px]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-muted font-semibold mb-1 block">Type</label>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setNewPromo({ ...newPromo, type: "percent" })} className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${newPromo.type === "percent" ? "bg-accent text-white" : "bg-border-light text-muted"}`}>%</motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setNewPromo({ ...newPromo, type: "fixed" })} className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${newPromo.type === "fixed" ? "bg-accent text-white" : "bg-border-light text-muted"}`}>€</motion.button>
                  </div>
                </div>
                <div><label className="text-[11px] text-muted font-semibold mb-1 block">Expiration</label><input type="date" value={newPromo.expiry} onChange={(e) => setNewPromo({ ...newPromo, expiry: e.target.value })} className="input-field text-[13px]" /></div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                if (newPromo.code && newPromo.value) { setPromos([...promos, newPromo]); setNewPromo({ code: "", type: "percent", value: "", expiry: "" }); flash(); }
              }} className="w-full bg-accent text-white py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5">
                <Plus size={14} /> Créer le code
              </motion.button>
            </div>
          </div>

          {/* Gift cards */}
          <div>
            <p className="text-[13px] font-bold text-foreground mb-3">Cartes cadeaux</p>
            {gifts.map((g, i) => (
              <div key={i} className="flex items-center gap-3 bg-success-soft rounded-xl px-4 py-3 mb-2">
                <Gift size={16} className="text-success" />
                <div className="flex-1"><p className="text-[13px] font-bold text-foreground">{g.amount} €</p><p className="text-[10px] text-muted">{g.code} · {g.used ? "Utilisée" : "Active"}</p></div>
              </div>
            ))}
            <div className="flex gap-2">
              <input type="number" value={newGift} onChange={(e) => setNewGift(e.target.value)} placeholder="Montant €" className="input-field flex-1 text-[13px]" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                if (newGift) { setGifts([...gifts, { amount: newGift, code: `GIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, used: false }]); setNewGift(""); flash(); }
              }} className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center"><Plus size={16} /></motion.button>
            </div>
          </div>
        </div>
      </Modal>

      {/* LEGAL */}
      <Modal open={v==="legal"} onClose={() => setV(null)} title="Mentions légales" size="large">
        <div className="space-y-5">{[["Mentions légales","Lumière Pro : app de gestion pour indépendants. Fournie en l'état."],["Conditions","Service réservé aux professionnels majeurs. Résiliation à tout moment."],["Confidentialité","Données chiffrées SSL. Conforme RGPD. Jamais partagées."]].map(([t,d],i)=>(<div key={i}><h3 className="text-[14px] font-bold text-foreground mb-2">{t}</h3><div className="bg-border-light rounded-2xl p-4"><p className="text-[12px] text-muted leading-relaxed">{d}</p></div></div>))}</div>
      </Modal>

      {/* Support Chat */}
      <SupportChat open={showChat} onClose={() => setShowChat(false)} userId={user.email || "pro-user"} userName={user.name || "Professionnel"} />
    </div>
  );
}
