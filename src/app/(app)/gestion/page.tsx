"use client";

import { useState, useMemo, useEffect, useDeferredValue } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import Modal from "@/components/Modal";
import {
  Plus, Clock, CheckCircle2, Receipt, Package, Wallet,
  Trash2, Minus, Search, TrendingDown, TrendingUp, ArrowUpRight,
  Copy, AlertCircle, BarChart3, PiggyBank, ShoppingCart,
  FileText, AlertTriangle, ChevronRight, Settings, Save, ArrowLeft,
  Gift, Tag, Users as UsersIcon, CalendarDays, MessageSquare,
  Download, Send, Link2, QrCode, Globe,
} from "lucide-react";
import type { InvoiceItem } from "@/lib/types";
import FeatureGate from "@/components/FeatureGate";
import Link from "next/link";
import { tabContentVariants, tabContentTransition } from "@/lib/motion";
import { CATEGORIES } from "@/lib/categories";
import { countUnread } from "@/lib/chat";
import { supabase } from "@/lib/supabase";
import { useUserSettings } from "@/lib/user-settings";
import { downloadInvoicePDF, generateInvoiceNumber, DEFAULT_INVOICE_CONFIG, type InvoiceConfig } from "@/lib/invoice-pdf";

type Tab = "invoices" | "payments" | "stock" | "analytics";

export default function GestionPage() {
  const {
    user, userId, invoices, clients, products, services, appointments, getClient,
    loyaltyTemplates,
    addInvoice, setInvoiceStatus,
    addProduct, updateProduct, deleteProduct,
    getLowStockProducts, getMonthRevenue, getWeekRevenue, getPendingAmount,
    getTodayRevenue, getTodayAppointments,
  } = useApp();

  // ── Unread message counter (live) ───────────────────────
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const n = await countUnread(userId);
      if (!cancelled) setUnreadMessages(n);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`gestion-msg-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` },
        () => setUnreadMessages((c) => c + 1)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab | null>(null);
  const [invoiceConfig, setInvoiceConfig] = useUserSettings<InvoiceConfig>("invoice_config", DEFAULT_INVOICE_CONFIG);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [stockSearch, setStockSearch] = useState("");
  const deferredStockSearch = useDeferredValue(stockSearch);

  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showGoalConfig, setShowGoalConfig] = useState(false);
  const [goalInput, setGoalInput] = useState("1500");
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [invForm, setInvForm] = useState({ clientId: "", description: "", status: "pending" as "paid" | "pending" });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([{ label: "", quantity: 1, unitPrice: 0 }]);
  const [expForm, setExpForm] = useState({ description: "", amount: "", category: "Fournitures" });
  const [prodForm, setProdForm] = useState({ name: "", quantity: "", minQuantity: "", price: "", category: "", emoji: "📦" });
  const [payForm, setPayForm] = useState({ clientId: "", productId: "", serviceLabel: "", amount: "", useProduct: true });

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowNewInvoice(true);
    if (searchParams.get("tab") === "stock") setTab("stock");
    if (searchParams.get("tab") === "payments") setTab("payments");
    if (searchParams.get("tab") === "analytics") setTab("analytics");
  }, [searchParams]);

  const pending = getPendingAmount();
  const monthRev = getMonthRevenue();
  const weekRev = getWeekRevenue();
  const todayRev = getTodayRevenue();
  const todayAppts = getTodayAppointments();
  const lowStock = getLowStockProducts();
  const lineTotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);

  const realInvoices = useMemo(() => invoices.filter((i) => i.clientId !== "__expense__"), [invoices]);
  const paidInvoices = useMemo(() => realInvoices.filter((i) => i.status === "paid").sort((a, b) => b.date.localeCompare(a.date)), [realInvoices]);
  const pendingInvoices = useMemo(() => realInvoices.filter((i) => i.status === "pending").sort((a, b) => b.date.localeCompare(a.date)), [realInvoices]);
  const expenses = useMemo(() => invoices.filter((i) => i.clientId === "__expense__").sort((a, b) => b.date.localeCompare(a.date)), [invoices]);
  const monthExpenses = useMemo(() => {
    const now = new Date(); const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
    return expenses.filter((e) => new Date(e.date) >= monthAgo).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const overdueInvoices = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    return pendingInvoices.filter((i) => i.date < cutoff.toISOString().split("T")[0]);
  }, [pendingInvoices]);

  // Monthly goal (configurable)
  const monthlyGoal = parseInt(goalInput) || 1500;
  const goalProgress = Math.min((monthRev / monthlyGoal) * 100, 100);
  const goalRemaining = Math.max(monthlyGoal - monthRev, 0);

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const items: { id: string; title: string; subtitle: string; amount?: string; amountColor?: string; icon: typeof Receipt; iconBg: string; iconColor: string }[] = [];
    realInvoices.slice(0, 3).forEach((inv) => {
      const client = getClient(inv.clientId);
      const clientName = client ? `${client.firstName} ${client.lastName}` : "";
      items.push({
        id: inv.id,
        title: `Facture ${inv.status === "paid" ? "encaissée" : "émise"}`,
        subtitle: `${new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${clientName}`,
        amount: `+${inv.amount.toFixed(0)} €`,
        amountColor: inv.status === "paid" ? "text-accent" : "text-warning",
        icon: Receipt, iconBg: "bg-accent-soft", iconColor: "text-accent",
      });
    });
    expenses.slice(0, 2).forEach((exp) => {
      items.push({
        id: exp.id,
        title: exp.description.replace(/^\[\w+\]\s*/, ""),
        subtitle: new Date(exp.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        amount: `-${exp.amount.toFixed(0)} €`,
        amountColor: "text-danger",
        icon: ShoppingCart, iconBg: "bg-danger-soft", iconColor: "text-danger",
      });
    });
    return items.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [realInvoices, expenses, getClient]);

  // Insights
  const insightCards = useMemo(() => {
    const cards: { title: string; subtitle: string; action: string; actionHref?: string; onClick?: () => void; icon: typeof AlertTriangle; iconBg: string; iconColor: string }[] = [];
    if (lowStock.length > 0) {
      cards.push({
        title: `Stock faible : ${lowStock[0].name}`,
        subtitle: `Plus que ${lowStock[0].quantity} unité${lowStock[0].quantity !== 1 ? "s" : ""} disponible${lowStock[0].quantity !== 1 ? "s" : ""}. Réapprovisionner bientôt.`,
        action: "Commander", icon: AlertTriangle, iconBg: "bg-warning-soft", iconColor: "text-warning",
        onClick: () => setTab("stock"),
      });
    }
    if (pendingInvoices.length > 0) {
      cards.push({
        title: `${pendingInvoices.length} paiement${pendingInvoices.length > 1 ? "s" : ""} en attente`,
        subtitle: `${pending.toFixed(0)} € à encaisser rapidement.`,
        action: "Encaisser", icon: Clock, iconBg: "bg-accent-soft", iconColor: "text-accent",
        onClick: () => setTab("payments"),
      });
    }
    if (monthExpenses > monthRev * 0.3 && monthExpenses > 0) {
      cards.push({
        title: "Dépenses élevées ce mois",
        subtitle: `${monthExpenses.toFixed(0)} € dépensés soit ${Math.round((monthExpenses / Math.max(monthRev, 1)) * 100)}% du revenu.`,
        action: "Voir détails", icon: TrendingDown, iconBg: "bg-danger-soft", iconColor: "text-danger",
        onClick: () => setTab("invoices"),
      });
    }
    return cards.slice(0, 2);
  }, [lowStock, pendingInvoices, pending, monthExpenses, monthRev]);

  const filteredProducts = useMemo(() => {
    if (!deferredStockSearch.trim()) return products;
    const q = deferredStockSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, deferredStockSearch]);

  const groupedProducts = useMemo(() => {
    const m = new Map<string, typeof products>();
    filteredProducts.forEach((p) => { const l = m.get(p.category) || []; l.push(p); m.set(p.category, l); });
    return Array.from(m.entries());
  }, [filteredProducts]);

  // 7-day revenue sparkline — one bar per day, last 7 days inclusive of today
  const weekSpark = useMemo(() => {
    const days: { label: string; date: string; revenue: number }[] = [];
    const now = new Date();
    const dayNames = ["D", "L", "M", "M", "J", "V", "S"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const rev = realInvoices
        .filter((inv) => inv.status === "paid" && inv.date === iso)
        .reduce((s, inv) => s + inv.amount, 0);
      days.push({ label: dayNames[d.getDay()], date: iso, revenue: rev });
    }
    return days;
  }, [realInvoices]);
  const maxSpark = Math.max(...weekSpark.map((d) => d.revenue), 1);

  // Revenue delta vs previous week — drives the trend arrow in the sparkline card
  const prevWeekRev = useMemo(() => {
    const now = new Date();
    const start = new Date(now); start.setDate(start.getDate() - 13);
    const end = new Date(now); end.setDate(end.getDate() - 7);
    const a = start.toISOString().split("T")[0];
    const b = end.toISOString().split("T")[0];
    return realInvoices
      .filter((inv) => inv.status === "paid" && inv.date >= a && inv.date <= b)
      .reduce((s, inv) => s + inv.amount, 0);
  }, [realInvoices]);
  const weekDelta = prevWeekRev > 0 ? Math.round(((weekRev - prevWeekRev) / prevWeekRev) * 100) : 0;

  const monthlyData = useMemo(() => {
    const months: { label: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const label = d.toLocaleDateString("fr-FR", { month: "short" });
      const rev = realInvoices.filter((inv) => inv.status === "paid" && inv.date >= d.toISOString().split("T")[0] && inv.date <= end.toISOString().split("T")[0]).reduce((s, inv) => s + inv.amount, 0);
      months.push({ label, revenue: rev });
    }
    return months;
  }, [realInvoices]);
  const maxMonthly = Math.max(...monthlyData.map((m) => m.revenue), 1);

  function handleInvoiceSubmit() {
    const validItems = lineItems.filter((item) => item.label.trim() && item.unitPrice > 0);
    if (validItems.length === 0 && !invForm.description.trim()) return;
    const total = validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const desc = invForm.description.trim() || validItems.map((i) => i.label).join(", ");
    addInvoice({ clientId: invForm.clientId, amount: total, description: desc, status: invForm.status, date: new Date().toISOString().split("T")[0], items: validItems.length > 0 ? validItems : undefined });
    setShowNewInvoice(false); setInvForm({ clientId: "", description: "", status: "pending" }); setLineItems([{ label: "", quantity: 1, unitPrice: 0 }]);
  }

  function handleExpenseSubmit() {
    if (!expForm.description.trim() || !expForm.amount) return;
    addInvoice({ clientId: "__expense__", amount: parseFloat(expForm.amount), description: `[${expForm.category}] ${expForm.description.trim()}`, status: "paid", date: new Date().toISOString().split("T")[0] });
    setShowNewExpense(false); setExpForm({ description: "", amount: "", category: "Fournitures" });
  }

  function duplicateInvoice(invId: string) {
    const inv = invoices.find((i) => i.id === invId);
    if (!inv) return;
    addInvoice({ clientId: inv.clientId, amount: inv.amount, description: inv.description, status: "pending", date: new Date().toISOString().split("T")[0], items: inv.items });
    setSelectedInvId(null);
  }

  // ── Invoice PDF + email helpers ─────────────────────────
  const [emailSending, setEmailSending] = useState<"idle" | "sending" | "sent" | "error" | "no_email">("idle");

  function buildPdfParams(invId: string) {
    const inv = invoices.find((i) => i.id === invId);
    if (!inv) return null;
    const client = getClient(inv.clientId);
    let cfg: InvoiceConfig | undefined;
    try {
      const raw = localStorage.getItem("invoice_config");
      if (raw) cfg = JSON.parse(raw);
    } catch { /* ignore */ }
    const config = cfg || { ...DEFAULT_INVOICE_CONFIG, legalName: user.business || user.name || "" };
    return {
      invoice: inv,
      items: inv.items || [],
      client: client || null,
      config,
      businessName: user.business || user.name || "Mon entreprise",
      // Use the persistent number if assigned; fall back to generated
      invoiceNumber: inv.invoiceNumber || generateInvoiceNumber(config),
    };
  }

  async function handleDownloadPdf(invId: string) {
    const params = buildPdfParams(invId);
    if (!params) return;
    const { downloadInvoicePDF } = await import("@/lib/invoice-pdf");
    downloadInvoicePDF(params);
  }

  async function handleEmailInvoice(invId: string) {
    const params = buildPdfParams(invId);
    if (!params) return;
    const clientEmail = params.client?.email;
    if (!clientEmail) {
      setEmailSending("no_email");
      setTimeout(() => setEmailSending("idle"), 2500);
      return;
    }
    setEmailSending("sending");
    try {
      const { generateInvoicePDF } = await import("@/lib/invoice-pdf");
      const { sendEmail, buildInvoiceEmail } = await import("@/lib/email");
      const doc = generateInvoicePDF(params);
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      const { subject, html, text } = buildInvoiceEmail({
        clientName: params.client?.firstName || "Client",
        businessName: params.businessName,
        amount: params.invoice.amount,
        description: params.invoice.description,
        invoiceId: params.invoiceNumber,
      });
      const res = await sendEmail({
        to: clientEmail,
        subject,
        html,
        text,
        fromName: params.businessName,
        replyTo: user.email || undefined,
        attachments: [{
          filename: `Facture_${params.invoiceNumber}.pdf`,
          content: pdfBase64,
          contentType: "application/pdf",
        }],
      });
      setEmailSending(res.delivered ? "sent" : "error");
    } catch (e) {
      console.error("[invoice email] failed:", e);
      setEmailSending("error");
    }
    setTimeout(() => setEmailSending("idle"), 3000);
  }

  function handleProductSubmit() {
    if (!prodForm.name.trim()) return;
    addProduct({ name: prodForm.name.trim(), quantity: parseInt(prodForm.quantity) || 0, minQuantity: parseInt(prodForm.minQuantity) || 3, price: parseFloat(prodForm.price) || 0, category: prodForm.category.trim() || "Autre", emoji: prodForm.emoji || "📦" });
    setShowNewProduct(false); setProdForm({ name: "", quantity: "", minQuantity: "", price: "", category: "", emoji: "📦" });
  }

  function handlePaymentSubmit() {
    if (!payForm.clientId || !payForm.amount) return;
    const amount = parseFloat(payForm.amount);
    if (amount <= 0) return;

    const desc = payForm.useProduct && payForm.productId
      ? products.find((p) => p.id === payForm.productId)?.name || payForm.serviceLabel || "Paiement"
      : payForm.serviceLabel || "Paiement";

    // Create a paid invoice
    addInvoice({
      clientId: payForm.clientId,
      amount,
      description: desc,
      status: "paid",
      date: new Date().toISOString().split("T")[0],
    });

    // Deduct stock if a product was selected
    if (payForm.useProduct && payForm.productId) {
      const prod = products.find((p) => p.id === payForm.productId);
      if (prod && prod.quantity > 0) {
        updateProduct(payForm.productId, { quantity: Math.max(0, prod.quantity - 1) });
      }
    }

    setShowNewPayment(false);
    setPayForm({ clientId: "", productId: "", serviceLabel: "", amount: "", useProduct: true });
  }

  const selectedInv = selectedInvId ? invoices.find((i) => i.id === selectedInvId) : null;

  // If no tab selected, show the overview
  const showOverview = tab === null;

  // Next upcoming appointment time (used by hero + summary)
  const nextApptTimeEarly = useMemo(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const upcoming = todayAppts
      .filter((a) => a.status === "confirmed")
      .filter((a) => {
        const [h, m] = a.time.split(":").map(Number);
        return h * 60 + m > mins;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
    return upcoming[0]?.time;
  }, [todayAppts]);

  // ── Dynamic hero messages ───────────────────────────────
  // Picks a contextual message from the list below, with priority for
  // actionable states. On pathname change + on app reload, a different
  // message is rotated in. A sessionStorage cursor advances each navigation.
  const heroMessages = useMemo(() => {
    const list: { id: string; title: string; subtitle: string; href?: string; tab?: Tab; priority: number }[] = [];

    // Priority 1 — Setup gaps
    if (clients.length === 0) {
      list.push({ id: "no-clients", title: "Ajoutez votre premier client", subtitle: "Commencez à construire votre répertoire.", href: "/clients", priority: 1 });
    }
    if (services.length === 0) {
      list.push({ id: "no-services", title: "Créez votre premier service", subtitle: "Définissez vos prestations pour commencer à facturer.", href: "/settings/services", priority: 1 });
    }
    if (loyaltyTemplates.length === 0) {
      list.push({ id: "no-loyalty", title: "Activez la fidélité", subtitle: "Boostez votre activité avec un programme de récompenses.", href: "/loyalty-manage", priority: 2 });
    }

    // Priority 2 — Actionable today
    if (todayAppts.length > 0) {
      list.push({ id: "today-appts", title: `Vous avez ${todayAppts.length} rendez-vous aujourd'hui`, subtitle: nextApptTimeEarly ? `Prochain à ${nextApptTimeEarly}` : "Préparez votre journée.", href: "/appointments", priority: 2 });
    }
    if (pendingInvoices.length > 0) {
      list.push({ id: "pending-inv", title: `${pending.toFixed(0)} € à encaisser`, subtitle: `${pendingInvoices.length} paiement${pendingInvoices.length > 1 ? "s" : ""} en attente de règlement.`, tab: "payments", priority: 2 });
    }
    if (lowStock.length > 0) {
      list.push({ id: "low-stock", title: "Réapprovisionnez votre stock", subtitle: `${lowStock.length} référence${lowStock.length > 1 ? "s" : ""} sous le seuil minimum.`, tab: "stock", priority: 3 });
    }

    // Priority 3 — Default rotation (always available)
    list.push(
      { id: "report", title: "Optimiser votre gestion", subtitle: "Pilotez factures, stock, clients et messagerie depuis un seul écran.", tab: "analytics", priority: 4 },
      { id: "promos", title: "Lancez une offre flash", subtitle: "Attirez plus de clients avec une promotion temporaire.", href: "/settings/promotions", priority: 4 },
      { id: "parrain", title: "Parrainez un collègue", subtitle: "Gagnez 1 mois Premium par inscription validée.", href: "/settings/referral", priority: 4 },
    );

    return list.sort((a, b) => a.priority - b.priority);
  }, [clients.length, services.length, loyaltyTemplates.length, todayAppts.length, pendingInvoices.length, pending, lowStock.length, nextApptTimeEarly]);

  const [heroIndex, setHeroIndex] = useState(0);
  // Pick a hero message on mount and FREEZE it for the whole visit.
  // The sessionStorage cursor advances so the next navigation/reload shows a
  // different message, but we never switch while the user is on the page.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gestion-hero-idx");
      const cursor = raw ? parseInt(raw, 10) || 0 : 0;
      const nextCursor = (cursor + 1) % Math.max(heroMessages.length, 1);
      sessionStorage.setItem("gestion-hero-idx", String(nextCursor));
      setHeroIndex(cursor % Math.max(heroMessages.length, 1));
    } catch {}
    // No interval — content is stable while the user reads the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hero = heroMessages[heroIndex % Math.max(heroMessages.length, 1)] || heroMessages[0];

  // Reuse the early-computed next appointment time for the RÉSUMÉ DU JOUR card
  const nextApptTime = nextApptTimeEarly;
  const remainingToday = useMemo(
    () => todayAppts.filter((a) => a.status === "confirmed" && (!nextApptTime || a.time >= nextApptTime)).length || todayAppts.filter((a) => a.status === "confirmed").length,
    [todayAppts, nextApptTime]
  );

  // ── Tile color helper: aligns Gestion tiles with Paramètres category colors ──
  const tileStyle = (c: string): React.CSSProperties => ({
    background: `linear-gradient(135deg, color-mix(in srgb, ${c} 14%, white), color-mix(in srgb, ${c} 6%, white))`,
    border: `1px solid color-mix(in srgb, ${c} 28%, white)`,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background"
      style={{
        // Rule: category color is only for icons and section titles.
        // Everything else stays on the canonical violet (--color-primary).
        // Aligning accent to primary means every bg-accent/text-accent
        // inside this page renders in the brand violet automatically.
        ["--color-accent" as string]: "#5B4FE9",
        ["--color-accent-soft" as string]: "#EEF0FF",
        ["--color-accent-deep" as string]: "#3B30B5",
      } as React.CSSProperties}>

      {/* ═══ FIXED HEADER ═══ */}
      <div className="flex-shrink-0">
        <header className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Gestion Activité</h1>
          <Link href="/settings/preferences">
            <motion.div whileTap={{ scale: 0.94 }}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-border-light shadow-sm-apple">
              <Settings size={16} className="text-muted" />
            </motion.div>
          </Link>
        </header>

        {/* Back button when in a sub-view — strong visibility */}
        {tab !== null && (
          <div className="px-6 pb-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(null)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold bg-white text-foreground"
              style={{
                border: "1px solid #E4E4E7",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <ArrowLeft size={14} strokeWidth={2.5} /> Retour
            </motion.button>
          </div>
        )}
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ═══ OVERVIEW — complete business tool ═══ */}
          {showOverview && (() => {
            const badgeText = unreadMessages > 3 ? "3+" : String(unreadMessages);
            // Visual stats: count done vs confirmed today for the radial progress
            const doneToday = todayAppts.filter((a) => a.status === "done").length;
            const totalToday = todayAppts.length;
            const progressPct = totalToday > 0 ? (doneToday / totalToday) * 100 : 0;
            const circ = 2 * Math.PI * 26;

            return (
            <motion.div key={`gestion-${tab ?? "overview"}`} initial={tabContentVariants.initial} animate={tabContentVariants.animate} transition={tabContentTransition}>

              {/* ══ HERO — dynamic contextual message (rotates) ══ */}
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  if (!hero) return;
                  if (hero.tab) setTab(hero.tab);
                  else if (hero.href) router.push(hero.href);
                }}
                className="w-full rounded-[22px] p-5 mb-5 text-white text-left relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-deep) 100%)",
                  boxShadow: "0 14px 36px color-mix(in srgb, var(--color-accent) 35%, transparent)",
                  minHeight: "148px",
                }}
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -right-4 -bottom-12 w-28 h-28 rounded-full bg-white/10" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={hero?.id || "default"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="relative z-10 flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Conseil du moment</p>
                      </div>
                      <h2 className="text-[22px] font-bold tracking-tight leading-tight">{hero?.title || "Optimiser votre gestion"}</h2>
                      <p className="text-[11px] text-white/85 mt-2 leading-relaxed max-w-[280px]">
                        {hero?.subtitle || "Pilotez factures, stock, clients et messagerie."}
                      </p>
                      <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold">
                        Y aller <ChevronRight size={12} strokeWidth={2.5} />
                      </div>
                    </div>
                    {/* Mini bar chart decoration (stays the same across rotations) */}
                    <div className="flex items-end gap-1 h-16 flex-shrink-0">
                      {weekSpark.slice(-5).map((d, i) => {
                        const h = Math.max((d.revenue / maxSpark) * 100, 12);
                        return (
                          <motion.div
                            key={i}
                            className="w-2 rounded-sm"
                            style={{ backgroundColor: i === 4 ? "white" : "rgba(255,255,255,0.45)" }}
                            initial={{ height: "10%" }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

              </motion.button>

              {/* Stock bas : indication discrète via le badge sur la tuile Stock ci-dessous */}

              {/* ══ RÉSUMÉ DU JOUR — visual stat cards ══ */}
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Résumé du jour</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* CA card with sparkline */}
                <button
                  onClick={() => setShowGoalConfig(true)}
                  className="bg-white rounded-2xl p-4 shadow-card-premium text-left relative overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-accent-soft)" }}>
                      <TrendingUp size={11} className="text-accent" strokeWidth={2.4} />
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-muted">Chiffre affaires</p>
                  </div>
                  <p className="text-[20px] font-bold text-foreground tracking-tight leading-none">
                    {monthRev.toFixed(0)}<span className="text-[13px] text-muted font-medium"> €</span>
                  </p>
                  {prevWeekRev > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {weekDelta >= 0
                        ? <TrendingUp size={10} className="text-accent" />
                        : <TrendingDown size={10} className="text-danger" />}
                      <p className={`text-[10px] font-bold ${weekDelta >= 0 ? "text-accent" : "text-danger"}`}>
                        {weekDelta >= 0 ? "+" : ""}{weekDelta}%
                      </p>
                    </div>
                  )}
                  {/* Monthly goal progress bar */}
                  <div className="mt-3 pt-2.5" style={{ borderTop: "1px solid color-mix(in srgb, var(--color-accent) 10%, white)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-muted">Objectif mensuel</p>
                      <p className="text-[9px] font-bold text-accent">{Math.round(goalProgress)}%</p>
                    </div>
                    <div className="w-full h-[5px] bg-border-light rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-deep))" }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${goalProgress}%` }}
                        transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      />
                    </div>
                    <p className="text-[8px] text-muted mt-1 text-right">
                      {monthRev.toFixed(0)} / {monthlyGoal.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                </button>

                {/* RDV restants with radial progress */}
                <Link href="/appointments">
                  <motion.div whileTap={{ scale: 0.98 }} className="bg-white rounded-2xl p-4 shadow-card-premium h-full flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-accent-soft)" }}>
                        <CalendarDays size={11} className="text-accent" strokeWidth={2.4} />
                      </div>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-muted">RDV restants</p>
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[20px] font-bold text-foreground tracking-tight leading-none">{remainingToday}</p>
                        <p className="text-[9px] text-muted mt-1">
                          {nextApptTime ? `Prochain : ${nextApptTime}` : "Aucun à venir"}
                        </p>
                      </div>
                      {/* Radial progress ring */}
                      <div className="relative w-[58px] h-[58px] flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="26" stroke="color-mix(in srgb, var(--color-accent) 12%, white)" strokeWidth="5" fill="none" />
                          <motion.circle
                            cx="30" cy="30" r="26"
                            stroke="var(--color-accent)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={circ}
                            initial={{ strokeDashoffset: circ }}
                            animate={{ strokeDashoffset: circ * (1 - progressPct / 100) }}
                            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[11px] font-bold text-foreground leading-none">{doneToday}/{totalToday}</span>
                          <span className="text-[7px] text-muted uppercase tracking-wider mt-0.5">fait</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </div>

              {/* ══ OUTILS — 4 essentials visible, 8 more behind toggle ══ */}
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Outils</p>
              <div className="grid grid-cols-4 gap-2.5 mb-3">
                {/* Row 1 — core management (always visible) */}
                <motion.button whileTap={{ scale: 0.94 }} onClick={() => setTab("invoices")}
                  className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={tileStyle(CATEGORIES.finance.color)}>
                    <FileText size={18} strokeWidth={2.4} style={{ color: CATEGORIES.finance.color }} />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Factures</p>
                </motion.button>

                <motion.button whileTap={{ scale: 0.94 }} onClick={() => setTab("payments")}
                  className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={tileStyle(CATEGORIES.finance.color)}>
                    <Wallet size={18} strokeWidth={2.4} style={{ color: CATEGORIES.finance.color }} />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Paiements</p>
                </motion.button>

                <motion.button whileTap={{ scale: 0.94 }} onClick={() => setTab("stock")}
                  className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2 relative">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={tileStyle(CATEGORIES.business.color)}>
                    <Package size={18} strokeWidth={2.4} style={{ color: CATEGORIES.business.color }} />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Stock</p>
                  {lowStock.length > 0 && (
                    <span className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[8px] font-bold flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #EF4444, #BE123C)" }}>
                      {lowStock.length > 3 ? "3+" : lowStock.length}
                    </span>
                  )}
                </motion.button>

                <Link href="/chat">
                  <motion.div whileTap={{ scale: 0.94 }}
                    className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2 relative">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={tileStyle(CATEGORIES.marketing.color)}>
                      <MessageSquare size={18} strokeWidth={2.4} style={{ color: CATEGORIES.marketing.color }} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Conversations</p>
                    {unreadMessages > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #EF4444, #BE123C)", boxShadow: "0 2px 6px rgba(239, 68, 68, 0.35)" }}
                      >
                        {badgeText}
                      </motion.span>
                    )}
                  </motion.div>
                </Link>

              </div>

              {/* Toggle for secondary tools */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowMoreTools((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 text-[11px] font-bold text-muted hover:text-foreground"
              >
                {showMoreTools ? "Masquer" : "Plus d'outils"}
                <ChevronRight
                  size={12}
                  strokeWidth={2.4}
                  style={{ transform: showMoreTools ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.2s" }}
                />
              </motion.button>

              {showMoreTools && (
                <div className="grid grid-cols-4 gap-2.5 mb-5">
                {/* Row 2 — extended management (clients / fidélité / promos / rapports) */}
                <Link href="/clients">
                  <motion.div whileTap={{ scale: 0.94 }}
                    className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={tileStyle(CATEGORIES.clients.color)}>
                      <UsersIcon size={18} strokeWidth={2.4} style={{ color: CATEGORIES.clients.color }} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Clients</p>
                  </motion.div>
                </Link>

                <Link href="/loyalty-manage">
                  <motion.div whileTap={{ scale: 0.94 }}
                    className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={tileStyle(CATEGORIES.clients.color)}>
                      <Gift size={18} strokeWidth={2.4} style={{ color: CATEGORIES.clients.color }} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Fidélité</p>
                  </motion.div>
                </Link>

                <Link href="/settings/promotions">
                  <motion.div whileTap={{ scale: 0.94 }}
                    className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={tileStyle(CATEGORIES.marketing.color)}>
                      <Tag size={18} strokeWidth={2.4} style={{ color: CATEGORIES.marketing.color }} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Offres</p>
                  </motion.div>
                </Link>

                <motion.button whileTap={{ scale: 0.94 }} onClick={() => setTab("analytics")}
                  className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={tileStyle(CATEGORIES.finance.color)}>
                    <BarChart3 size={18} strokeWidth={2.4} style={{ color: CATEGORIES.finance.color }} />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Rapports</p>
                </motion.button>

                <Link href="/waitlist">
                  <motion.div whileTap={{ scale: 0.94 }}
                    className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={tileStyle(CATEGORIES.bookings.color)}>
                      <Clock size={18} strokeWidth={2.4} style={{ color: CATEGORIES.bookings.color }} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Liste d&apos;attente</p>
                  </motion.div>
                </Link>

                {/* Row 3 — 3 new tiles for symmetry (12 total = 3×4) */}
                <Link href="/settings/booking-link">
                  <motion.div whileTap={{ scale: 0.94 }}
                    className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={tileStyle(CATEGORIES.bookings.color)}>
                      <Link2 size={18} strokeWidth={2.4} style={{ color: CATEGORIES.bookings.color }} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Lien résa</p>
                  </motion.div>
                </Link>

                <Link href="/settings/messages">
                  <motion.div whileTap={{ scale: 0.94 }}
                    className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={tileStyle(CATEGORIES.marketing.color)}>
                      <Send size={18} strokeWidth={2.4} style={{ color: CATEGORIES.marketing.color }} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Messages</p>
                  </motion.div>
                </Link>

                <Link href="/settings/visibility">
                  <motion.div whileTap={{ scale: 0.94 }}
                    className="bg-white rounded-2xl py-4 px-2 shadow-card-interactive flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={tileStyle(CATEGORIES.business.color)}>
                      <Globe size={18} strokeWidth={2.4} style={{ color: CATEGORIES.business.color }} />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">Page publique</p>
                  </motion.div>
                </Link>
                </div>
              )}

              {/* ══ Quick create strip — secondary ══ */}
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Créer rapidement</p>
              <div className="flex gap-2 mb-5">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewInvoice(true)}
                  className="flex-1 text-white rounded-xl py-2.5 text-[10px] font-bold flex items-center justify-center gap-1"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
                  <Plus size={11} strokeWidth={3} /> Facture
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewPayment(true)}
                  className="flex-1 bg-white text-accent rounded-xl py-2.5 text-[10px] font-bold flex items-center justify-center gap-1"
                  style={{ border: "1px solid color-mix(in srgb, var(--color-accent) 25%, white)" }}>
                  <Plus size={11} strokeWidth={3} /> Paiement
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewProduct(true)}
                  className="flex-1 bg-white text-accent rounded-xl py-2.5 text-[10px] font-bold flex items-center justify-center gap-1"
                  style={{ border: "1px solid color-mix(in srgb, var(--color-accent) 25%, white)" }}>
                  <Plus size={11} strokeWidth={3} /> Produit
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewExpense(true)}
                  className="flex-1 bg-white text-accent rounded-xl py-2.5 text-[10px] font-bold flex items-center justify-center gap-1"
                  style={{ border: "1px solid color-mix(in srgb, var(--color-accent) 25%, white)" }}>
                  <Plus size={11} strokeWidth={3} /> Dépense
                </motion.button>
              </div>

              {/* ── Activité récente ── */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Activité récente</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setTab("invoices")}
                  className="text-[11px] text-accent font-bold">
                  Tout voir
                </motion.button>
              </div>

              {recentActivity.length === 0 && lowStock.length === 0 ? (
                <div className="bg-white rounded-2xl p-7 shadow-card-premium text-center mb-5">
                  <Receipt size={24} className="text-muted mx-auto mb-2" />
                  <p className="text-[14px] font-bold text-foreground">Pas encore d&apos;activité</p>
                  <p className="text-[12px] text-muted mt-1">Créez votre première facture.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-5">
                  {recentActivity.slice(0, 3).map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.id + i}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setTab("invoices")}
                        className="bg-white rounded-2xl p-4 shadow-card-interactive flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0">
                          <Icon size={16} className="text-accent" strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-foreground truncate">{item.title}</p>
                          <p className="text-[11px] text-muted mt-0.5">{item.subtitle}</p>
                        </div>
                        {item.amount && (
                          <p className="text-[14px] font-bold text-accent flex-shrink-0">{item.amount}</p>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Stock alerts inline with activity feed */}
                  {lowStock.slice(0, 2).map((p) => (
                    <motion.button
                      key={`stock-${p.id}`}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setTab("stock")}
                      className="w-full bg-white rounded-2xl p-4 shadow-card-interactive flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-accent" strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-foreground truncate">Stock faible</p>
                        <p className="text-[11px] text-muted mt-0.5 truncate">{p.name} ({p.quantity} restant{p.quantity !== 1 ? "s" : ""})</p>
                      </div>
                      <AlertTriangle size={16} className="text-danger flex-shrink-0" strokeWidth={2.4} />
                    </motion.button>
                  ))}
                </div>
              )}

            </motion.div>
            );
          })()}

          {/* ═══ FACTURES TAB ═══ */}
          {tab === "invoices" && (
            <motion.div key="invoices" initial={tabContentVariants.initial} animate={tabContentVariants.animate} transition={tabContentTransition}>
              {/* Config shortcut */}
              <Link href="/settings/invoice">
                <div className="flex items-center gap-2 mb-3 px-1 text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>
                  <Settings size={11} strokeWidth={2.5} />
                  <span>Configurer mes infos legales (SIRET, TVA)</span>
                </div>
              </Link>
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">{realInvoices.length} facture{realInvoices.length !== 1 ? "s" : ""}</p>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewExpense(true)}
                    className="text-[11px] text-accent-deep font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg"
                    style={{
                      background: "color-mix(in srgb, var(--color-accent) 14%, white)",
                      border: "1px solid color-mix(in srgb, var(--color-accent) 30%, white)",
                      boxShadow: "0 2px 8px color-mix(in srgb, var(--color-accent) 15%, transparent)",
                    }}>
                    <PiggyBank size={12} strokeWidth={2.5} /> Dépense
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewInvoice(true)}
                    className="text-[11px] text-white font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
                      boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 35%, transparent)",
                    }}>
                    <Plus size={12} strokeWidth={3} /> Facture
                  </motion.button>
                </div>
              </div>
              {realInvoices.length === 0 ? (
                <div className="bg-white rounded-[22px] p-8 shadow-card-premium text-center">
                  <Receipt size={24} className="text-accent mx-auto mb-3" />
                  <p className="text-[15px] font-bold text-foreground mb-1">Aucune facture</p>
                  <p className="text-[13px] text-muted">Créez votre première facture.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {realInvoices.sort((a, b) => b.date.localeCompare(a.date)).map((inv, i) => {
                    const client = getClient(inv.clientId);
                    const isPaid = inv.status === "paid";
                    const isOverdue = !isPaid && overdueInvoices.some((o) => o.id === inv.id);
                    return (
                      <motion.button key={inv.id} initial={{ y: 3 }} animate={{ y: 0 }} transition={{ delay: i * 0.02 }}
                        onClick={() => setSelectedInvId(inv.id)}
                        className={`bg-white rounded-2xl p-4 shadow-card-interactive flex items-center gap-3 text-left w-full ${isOverdue ? "ring-1 ring-danger/20" : ""}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? "bg-accent-soft" : isOverdue ? "bg-danger-soft" : "bg-warning-soft"}`}>
                          {isPaid ? <CheckCircle2 size={17} className="text-accent" /> : isOverdue ? <AlertCircle size={17} className="text-danger" /> : <Clock size={17} className="text-warning" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[14px] font-semibold text-foreground truncate">{inv.description}</p>
                            {inv.invoiceNumber && (
                              <span className="text-[9px] font-bold text-muted bg-border-light px-1.5 py-0.5 rounded flex-shrink-0 font-mono">
                                {inv.invoiceNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">{client ? `${client.firstName} ${client.lastName} · ` : ""}{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                          <p className={`text-[14px] font-bold ${isPaid ? "text-foreground" : isOverdue ? "text-danger" : "text-warning"}`}>{inv.amount} €</p>
                          <div className="flex items-center gap-2">
                            {!isPaid && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); setInvoiceStatus(inv.id, "paid"); }}
                                className="text-[10px] font-bold text-accent flex items-center gap-0.5">
                                <ArrowUpRight size={10} /> Encaisser
                              </motion.button>
                            )}
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const cfg = { ...DEFAULT_INVOICE_CONFIG, ...invoiceConfig };
                                // Derive a deterministic invoice number from sorted position
                                const sorted = [...invoices].filter((x) => x.clientId !== "__expense__").sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
                                const idx = sorted.findIndex((x) => x.id === inv.id);
                                const num = `${cfg.invoicePrefix}-${new Date(inv.date).getFullYear()}-${String(idx + 1).padStart(4, "0")}`;
                                downloadInvoicePDF({
                                  invoice: inv,
                                  items: inv.items || [],
                                  client: client || null,
                                  config: cfg,
                                  businessName: user.business || user.name || "",
                                  invoiceNumber: num,
                                });
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: "var(--color-accent-soft)" }}
                              title="Telecharger PDF"
                            >
                              <Download size={12} className="text-accent" strokeWidth={2.5} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
              {expenses.length > 0 && (
                <>
                  <p className="section-label mt-5 mb-2.5">Dépenses ({expenses.length})</p>
                  <div className="flex flex-col gap-2">
                    {expenses.slice(0, 8).map((exp) => (
                      <div key={exp.id} className="bg-white rounded-2xl p-4 shadow-sm-apple flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-danger-soft flex items-center justify-center"><PiggyBank size={17} className="text-danger" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-foreground truncate">{exp.description.replace(/^\[\w+\]\s*/, "")}</p>
                          <p className="text-[11px] text-muted">{new Date(exp.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                        </div>
                        <p className="text-[14px] font-bold text-danger">-{exp.amount} €</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </motion.div>)}

          {/* ═══ PAYMENTS TAB ═══ */}
          {tab === "payments" && (
            <motion.div key="payments" initial={tabContentVariants.initial} animate={tabContentVariants.animate} transition={tabContentTransition}>
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">Suivi des paiements</p>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setPayForm({ clientId: "", productId: "", serviceLabel: "", amount: "", useProduct: true }); setShowNewPayment(true); }}
                  className="text-[11px] text-white font-bold flex items-center gap-1 bg-accent px-3 py-1.5 rounded-lg">
                  <Plus size={12} /> Encaisser
                </motion.button>
              </div>
              {overdueInvoices.length > 0 && (
                <div className="mb-4">
                  <p className="section-label mb-2.5 text-danger">En retard ({overdueInvoices.length})</p>
                  <div className="flex flex-col gap-2">
                    {overdueInvoices.map((inv) => {
                      const client = getClient(inv.clientId);
                      return (
                        <div key={inv.id} className="bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3 ring-1 ring-danger/15">
                          <div className="w-10 h-10 rounded-xl bg-danger-soft flex items-center justify-center"><AlertCircle size={17} className="text-danger" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-foreground truncate">{inv.description}</p>
                            <p className="text-[11px] text-danger font-medium">{client ? `${client.firstName} ${client.lastName} · ` : ""}{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-bold text-danger">{inv.amount} €</p>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setInvoiceStatus(inv.id, "paid")}
                              className="bg-accent text-white text-[11px] font-bold px-3 py-2 rounded-xl">Encaisser</motion.button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="section-label mb-2.5">En attente ({pendingInvoices.filter((i) => !overdueInvoices.some((o) => o.id === i.id)).length})</p>
              {pendingInvoices.filter((i) => !overdueInvoices.some((o) => o.id === i.id)).length === 0 ? (
                <div className="bg-white rounded-[22px] p-6 shadow-card-premium text-center mb-5">
                  <CheckCircle2 size={22} className="text-accent mx-auto mb-2" />
                  <p className="text-[14px] font-bold text-foreground">Tout est encaissé</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mb-5">
                  {pendingInvoices.filter((i) => !overdueInvoices.some((o) => o.id === i.id)).map((inv) => {
                    const client = getClient(inv.clientId);
                    return (
                      <div key={inv.id} className="bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning-soft flex items-center justify-center"><Clock size={17} className="text-warning" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-foreground truncate">{inv.description}</p>
                          <p className="text-[11px] text-muted">{client ? `${client.firstName} ${client.lastName}` : "—"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold text-warning">{inv.amount} €</p>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setInvoiceStatus(inv.id, "paid")}
                            className="bg-accent text-white text-[11px] font-bold px-3 py-2 rounded-xl">Encaisser</motion.button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="section-label mb-2.5">Payé ({paidInvoices.length})</p>
              <div className="flex flex-col gap-2">
                {paidInvoices.slice(0, 10).map((inv) => {
                  const client = getClient(inv.clientId);
                  return (
                    <div key={inv.id} className="bg-white rounded-2xl p-4 shadow-sm-apple flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"><CheckCircle2 size={17} className="text-accent" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-foreground truncate">{inv.description}</p>
                        <p className="text-[11px] text-muted">{client ? `${client.firstName} ${client.lastName} · ` : ""}{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                      </div>
                      <p className="text-[14px] font-bold text-accent">{inv.amount} €</p>
                    </div>
                  );
                })}
              </div>
          </motion.div>)}

          {/* ═══ STOCK TAB ═══ */}
          {tab === "stock" && (() => {
            // Stock KPIs for the summary cards
            const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
            const outOfStock = products.filter((p) => p.quantity === 0).length;
            const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
            const categoryCount = new Set(products.map((p) => p.category)).size;
            return (
            <motion.div key="stock" initial={tabContentVariants.initial} animate={tabContentVariants.animate} transition={tabContentTransition}>
            <FeatureGate feature="stock_management">

              {/* ── Stock KPI summary (4 cards) ── */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="bg-white rounded-2xl p-3.5 shadow-card-premium">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package size={11} className="text-accent" strokeWidth={2.4} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Produits</p>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{products.length}</p>
                  <p className="text-[9px] text-muted mt-1">{categoryCount} catégorie{categoryCount !== 1 ? "s" : ""}</p>
                </div>

                <div className="bg-white rounded-2xl p-3.5 shadow-card-premium">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={11} className="text-accent" strokeWidth={2.4} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Valeur totale</p>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{totalValue.toFixed(0)}<span className="text-[13px] text-muted font-medium"> €</span></p>
                  <p className="text-[9px] text-muted mt-1">{totalUnits} unité{totalUnits !== 1 ? "s" : ""}</p>
                </div>

                <div className="bg-white rounded-2xl p-3.5 shadow-card-premium">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={11} className="text-warning" strokeWidth={2.4} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Stock bas</p>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{lowStock.length}</p>
                  <p className="text-[9px] text-muted mt-1">à réapprovisionner</p>
                </div>

                <div className="bg-white rounded-2xl p-3.5 shadow-card-premium">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle size={11} className="text-danger" strokeWidth={2.4} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted">En rupture</p>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{outOfStock}</p>
                  <p className="text-[9px] text-muted mt-1">à recommander</p>
                </div>
              </div>

              {/* Stock bas : indication via le KPI "Stock bas" ci-dessus et les badges inline sur chaque produit */}

              {/* ── Header row: total count + create button ── */}
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">Inventaire</p>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewProduct(true)}
                  className="text-[11px] text-white font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
                    boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 35%, transparent)",
                  }}>
                  <Plus size={12} strokeWidth={3} /> Nouveau produit
                </motion.button>
              </div>

              {/* ── Search ── */}
              <div className="relative mb-3">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
                <input type="text" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="Rechercher un produit ou une catégorie..."
                  className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-[14px] placeholder:text-subtle shadow-card-premium focus:outline-none focus:ring-2 focus:ring-accent/15" />
              </div>
              {groupedProducts.length === 0 ? (
                <div className="bg-white rounded-[22px] p-7 shadow-card-premium text-center">
                  <Package size={24} className="text-muted mx-auto mb-2" />
                  <p className="text-[15px] font-bold text-foreground">Aucun produit</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedProducts.map(([cat, items]) => (
                    <div key={cat}>
                      <p className="section-label mb-2">{cat}</p>
                      <div className="flex flex-col gap-2">
                        {items.map((p) => {
                          const isLow = p.quantity <= p.minQuantity;
                          const isOut = p.quantity === 0;
                          return (
                            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-card-premium">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{p.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-bold text-foreground truncate">{p.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-[4px] bg-border-light rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${isOut ? "bg-danger" : isLow ? "bg-warning" : "bg-accent"}`}
                                        style={{ width: `${Math.min((p.quantity / Math.max(p.minQuantity * 3, 1)) * 100, 100)}%` }} />
                                    </div>
                                    <span className={`text-[10px] font-bold flex-shrink-0 ${isOut ? "text-danger" : isLow ? "text-warning" : "text-muted"}`}>
                                      {isOut ? "Rupture" : `${p.quantity}`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateProduct(p.id, { quantity: Math.max(0, p.quantity - 1) })}
                                    className="w-7 h-7 rounded-lg bg-border-light flex items-center justify-center"><Minus size={12} /></motion.button>
                                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateProduct(p.id, { quantity: p.quantity + 1 })}
                                    className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center"><Plus size={12} /></motion.button>
                                </div>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => deleteProduct(p.id)} className="p-1 text-subtle"><Trash2 size={12} /></motion.button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FeatureGate>
          </motion.div>
          );
          })()}

          {/* ═══ ANALYTICS TAB ═══ */}
          {tab === "analytics" && (
            <motion.div key="analytics" initial={tabContentVariants.initial} animate={tabContentVariants.animate} transition={tabContentTransition}>
            <FeatureGate feature="analytics_advanced">
              <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-4">
                <p className="text-[13px] font-bold text-foreground mb-4">Revenus · 6 derniers mois</p>
                <div className="flex items-end gap-[5px] h-[100px] mb-2">
                  {monthlyData.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-[80px] flex items-end">
                        <motion.div className="flex-1 bg-accent/15 rounded-[3px]"
                          initial={{ height: 0 }} animate={{ height: `${Math.max((m.revenue / maxMonthly) * 100, 4)}%` }}
                          transition={{ delay: i * 0.06, duration: 0.2 }} />
                      </div>
                      <span className="text-[9px] text-muted font-medium">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Ce mois", value: `${monthRev.toFixed(0)} €`, color: "text-accent" },
                  { label: "En attente", value: `${pending.toFixed(0)} €`, color: "text-warning" },
                  { label: "Dépenses", value: `${monthExpenses.toFixed(0)} €`, color: "text-danger" },
                  { label: "Bénéfice", value: `${(monthRev - monthExpenses).toFixed(0)} €`, color: monthRev - monthExpenses >= 0 ? "text-accent" : "text-danger" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-card-premium">
                    <p className="text-[9px] text-muted font-bold uppercase tracking-wider">{s.label}</p>
                    <p className={`text-[22px] font-bold leading-none mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-[22px] p-5 shadow-card-premium">
                <p className="text-[13px] font-bold text-foreground mb-3">Meilleurs clients</p>
                {(() => {
                  const cr = clients.map((c) => ({
                    client: c,
                    revenue: realInvoices.filter((i) => i.clientId === c.id && i.status === "paid").reduce((s, i) => s + i.amount, 0),
                  })).filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
                  return cr.length === 0 ? (
                    <p className="text-[13px] text-muted text-center py-4">Pas encore de données</p>
                  ) : (
                    <div className="space-y-3">
                      {cr.map(({ client: c, revenue }, i) => (
                        <div key={c.id} className="flex items-center gap-3">
                          <span className="text-[12px] font-bold text-muted w-5">{i + 1}</span>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: c.avatar }}>
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <p className="text-[13px] font-semibold text-foreground truncate flex-1">{c.firstName} {c.lastName}</p>
                          <p className="text-[13px] font-bold text-accent">{revenue} €</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </FeatureGate>
          </motion.div>)}

        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      <Modal open={showNewInvoice} onClose={() => setShowNewInvoice(false)} title="Nouvelle facture">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Client</label>
            <select value={invForm.clientId} onChange={(e) => setInvForm({ ...invForm, clientId: e.target.value })} className="input-field">
              <option value="">-- Sélectionner --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] text-muted font-semibold">Lignes</label>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setLineItems([...lineItems, { label: "", quantity: 1, unitPrice: 0 }])}
                className="text-[11px] text-accent font-bold flex items-center gap-0.5"><Plus size={12} /> Ligne</motion.button>
            </div>
            <div className="space-y-2">
              {lineItems.map((li, index) => (
                <div key={index} className="bg-border-light rounded-2xl p-3.5">
                  <input value={li.label} onChange={(e) => { const u = [...lineItems]; u[index] = { ...u[index], label: e.target.value }; setLineItems(u); }}
                    placeholder="Ex : Manucure gel" className="w-full bg-white rounded-xl px-3.5 py-2.5 text-[13px] mb-2 focus:outline-none focus:ring-2 focus:ring-accent/10" />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-muted uppercase font-bold mb-0.5 block">Qté</label>
                      <input type="number" value={li.quantity || ""} onChange={(e) => { const u = [...lineItems]; u[index] = { ...u[index], quantity: parseInt(e.target.value) || 0 }; setLineItems(u); }}
                        className="w-full bg-white rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/10" min="1" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-muted uppercase font-bold mb-0.5 block">Prix €</label>
                      <input type="number" value={li.unitPrice || ""} onChange={(e) => { const u = [...lineItems]; u[index] = { ...u[index], unitPrice: parseFloat(e.target.value) || 0 }; setLineItems(u); }}
                        placeholder="0" className="w-full bg-white rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/10" />
                    </div>
                    <p className="text-[13px] font-bold text-foreground min-w-[45px] text-right pt-4">{(li.quantity * li.unitPrice).toFixed(0)} €</p>
                    {lineItems.length > 1 && <motion.button whileTap={{ scale: 0.95 }} onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))} className="text-subtle pt-4"><Trash2 size={12} /></motion.button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-foreground rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[14px] text-white/70">Total</span>
            <span className="text-[24px] font-bold text-white">{lineTotal.toFixed(0)} €</span>
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-2 block">Statut</label>
            <div className="flex gap-2.5">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setInvForm({ ...invForm, status: "pending" })}
                className={`flex-1 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 ${invForm.status === "pending" ? "bg-warning text-white" : "bg-border-light text-muted"}`}>
                <Clock size={14} /> En attente
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setInvForm({ ...invForm, status: "paid" })}
                className={`flex-1 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 ${invForm.status === "paid" ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                <CheckCircle2 size={14} /> Payé
              </motion.button>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleInvoiceSubmit}
            className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold fab-shadow">
            Créer la facture
          </motion.button>
        </div>
      </Modal>

      <Modal open={!!selectedInv} onClose={() => setSelectedInvId(null)} title="Détails facture">
        {selectedInv && (() => {
          const client = getClient(selectedInv.clientId);
          const isPaid = selectedInv.status === "paid";
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`badge text-[12px] px-3 py-1.5 ${isPaid ? "bg-accent-soft text-accent" : "bg-warning-soft text-warning"}`}>{isPaid ? "Payée" : "En attente"}</span>
                <span className="text-[28px] font-bold text-foreground">{selectedInv.amount} €</span>
              </div>
              <div className="bg-border-light rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-[13px]"><span className="text-muted">Description</span><span className="font-semibold text-right max-w-[60%] truncate">{selectedInv.description}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted">Date</span><span className="font-semibold">{new Date(selectedInv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                {client && <div className="flex justify-between text-[13px]"><span className="text-muted">Client</span><span className="font-semibold">{client.firstName} {client.lastName}</span></div>}
              </div>
              {selectedInv.items && selectedInv.items.length > 0 && (
                <div className="bg-border-light rounded-2xl overflow-hidden">
                  {selectedInv.items.map((li, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < selectedInv.items!.length - 1 ? "border-b border-white/60" : ""}`}>
                      <div><p className="text-[13px] font-semibold">{li.label}</p><p className="text-[11px] text-muted">{li.quantity} x {li.unitPrice.toFixed(2)} €</p></div>
                      <p className="text-[13px] font-bold">{(li.quantity * li.unitPrice).toFixed(0)} €</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2.5">
                {!isPaid && (
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setInvoiceStatus(selectedInv.id, "paid"); setSelectedInvId(null); }}
                    className="flex-1 text-white py-3.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))", boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)" }}>
                    <CheckCircle2 size={15} /> Encaisser
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => duplicateInvoice(selectedInv.id)}
                  className="flex-1 bg-border-light text-foreground py-3.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2">
                  <Copy size={15} /> Dupliquer
                </motion.button>
              </div>

              {/* ── PDF + Email actions ──────────────── */}
              <div className="pt-3 border-t border-border-light">
                <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Document</p>
                <div className="flex gap-2.5">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleDownloadPdf(selectedInv.id)}
                    className="flex-1 py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-deep)", border: "1px solid var(--color-primary)" }}>
                    <Download size={13} strokeWidth={2.6} /> Télécharger PDF
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => handleEmailInvoice(selectedInv.id)}
                    disabled={emailSending === "sending"}
                    className="flex-1 py-3 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
                    style={{
                      background:
                        emailSending === "sent"
                          ? "linear-gradient(135deg, #10B981, #047857)"
                          : emailSending === "error" || emailSending === "no_email"
                            ? "linear-gradient(135deg, #EF4444, #B91C1C)"
                            : "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                      boxShadow: "0 8px 20px color-mix(in srgb, var(--color-primary) 25%, transparent)",
                    }}>
                    <Send size={13} strokeWidth={2.6} />
                    {emailSending === "sending"
                      ? "Envoi..."
                      : emailSending === "sent"
                        ? "Envoyée"
                        : emailSending === "no_email"
                          ? "Pas d'email"
                          : emailSending === "error"
                            ? "Échec"
                            : "Envoyer par email"}
                  </motion.button>
                </div>
                {!getClient(selectedInv.clientId)?.email && (
                  <p className="text-[10px] text-warning mt-2 flex items-center gap-1">
                    <AlertTriangle size={10} /> Ce client n&apos;a pas d&apos;email — ajoutez-en un dans sa fiche pour l&apos;envoyer.
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal open={showNewExpense} onClose={() => setShowNewExpense(false)} title="Nouvelle dépense">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Description</label>
            <input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
              placeholder="Ex : Achat fournitures" className="input-field" />
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Catégorie</label>
            <div className="flex gap-1.5 flex-wrap">
              {["Fournitures", "Loyer", "Transport", "Marketing", "Autre"].map((cat) => (
                <motion.button key={cat} whileTap={{ scale: 0.95 }} onClick={() => setExpForm({ ...expForm, category: cat })}
                  className={`text-[11px] font-bold px-3 py-2 rounded-xl ${expForm.category === cat ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Montant (€)</label>
            <input type="number" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
              placeholder="0" className="input-field" />
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleExpenseSubmit}
            className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold fab-shadow">
            Ajouter la dépense
          </motion.button>
        </div>
      </Modal>

      <Modal open={showNewProduct} onClose={() => setShowNewProduct(false)} title="Nouveau produit">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Nom</label>
            <input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} placeholder="Gel UV transparent" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Catégorie</label><input value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })} placeholder="Gel" className="input-field" /></div>
            <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Emoji</label><input value={prodForm.emoji} onChange={(e) => setProdForm({ ...prodForm, emoji: e.target.value })} className="input-field text-center text-xl" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["Qté", "quantity", "0"], ["Seuil", "minQuantity", "3"], ["Prix €", "price", "0"]].map(([l, k, ph]) => (
              <div key={k}><label className="text-[12px] text-muted font-semibold mb-1.5 block">{l}</label>
                <input type="number" value={(prodForm as Record<string, string>)[k]} onChange={(e) => setProdForm({ ...prodForm, [k]: e.target.value })} placeholder={ph} className="input-field" /></div>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleProductSubmit}
            className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold fab-shadow">
            Ajouter
          </motion.button>
        </div>
      </Modal>

      {/* Payment creation modal — with client + product/service + auto-price + stock deduction */}
      <Modal open={showNewPayment} onClose={() => setShowNewPayment(false)} title="Encaisser un paiement">
        <div className="space-y-4">
          {/* Client selection */}
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Client</label>
            <select value={payForm.clientId} onChange={(e) => setPayForm({ ...payForm, clientId: e.target.value })} className="input-field">
              <option value="">-- Sélectionner un client --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>

          {/* Product or service toggle */}
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Type</label>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPayForm({ ...payForm, useProduct: true, productId: "", serviceLabel: "" })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 ${payForm.useProduct ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                <Package size={13} /> Produit
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPayForm({ ...payForm, useProduct: false, productId: "", serviceLabel: "" })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 ${!payForm.useProduct ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                <FileText size={13} /> Service
              </motion.button>
            </div>
          </div>

          {/* Product selection with auto-price */}
          {payForm.useProduct ? (
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Produit</label>
              <select value={payForm.productId} onChange={(e) => {
                const pid = e.target.value;
                const prod = products.find((p) => p.id === pid);
                setPayForm({ ...payForm, productId: pid, amount: prod ? String(prod.price) : payForm.amount });
              }} className="input-field">
                <option value="">-- Sélectionner un produit --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.emoji} {p.name} — {p.price} € {p.quantity === 0 ? "(rupture)" : `(${p.quantity} en stock)`}</option>
                ))}
              </select>
              {payForm.productId && (() => {
                const prod = products.find((p) => p.id === payForm.productId);
                if (!prod) return null;
                return (
                  <div className="mt-2 bg-border-light rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{prod.emoji}</span>
                      <div>
                        <p className="text-[12px] font-bold text-foreground">{prod.name}</p>
                        <p className="text-[10px] text-muted">{prod.quantity} en stock</p>
                      </div>
                    </div>
                    <p className="text-[14px] font-bold text-accent">{prod.price} €</p>
                  </div>
                );
              })()}
              {payForm.productId && products.find((p) => p.id === payForm.productId)?.quantity === 0 && (
                <p className="text-[11px] text-danger font-medium mt-1">⚠ Ce produit est en rupture de stock</p>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Service / Description</label>
              <input value={payForm.serviceLabel} onChange={(e) => setPayForm({ ...payForm, serviceLabel: e.target.value })}
                placeholder="Ex : Consultation, manucure..." className="input-field" />
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Montant (€)</label>
            <input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              placeholder="0" className="input-field text-[18px] font-bold" />
          </div>

          {/* Summary */}
          {payForm.clientId && payForm.amount && (
            <div className="bg-accent-soft rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-accent font-bold">Paiement encaissé</p>
                  <p className="text-[11px] text-foreground/60 mt-0.5">
                    {clients.find((c) => c.id === payForm.clientId)?.firstName} — {payForm.useProduct && payForm.productId ? products.find((p) => p.id === payForm.productId)?.name : payForm.serviceLabel || "Paiement"}
                  </p>
                </div>
                <p className="text-[20px] font-bold text-accent">{parseFloat(payForm.amount || "0").toFixed(0)} €</p>
              </div>
              {payForm.useProduct && payForm.productId && (
                <p className="text-[10px] text-accent/70 mt-2 flex items-center gap-1">
                  <Package size={10} /> Le stock sera mis à jour automatiquement
                </p>
              )}
            </div>
          )}

          <motion.button whileTap={{ scale: 0.98 }} onClick={handlePaymentSubmit}
            disabled={!payForm.clientId || !payForm.amount}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 ${
              payForm.clientId && payForm.amount ? "bg-accent text-white fab-shadow" : "bg-border-light text-muted"
            }`}>
            <CheckCircle2 size={16} /> Encaisser le paiement
          </motion.button>
        </div>
      </Modal>

      {/* Goal configuration */}
      <Modal open={showGoalConfig} onClose={() => setShowGoalConfig(false)} title="Objectif mensuel">
        <div className="space-y-4">
          <p className="text-[13px] text-muted leading-relaxed">Définissez votre objectif de chiffre d&apos;affaires mensuel pour suivre votre progression.</p>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Objectif (€)</label>
            <input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
              placeholder="1500" className="input-field text-[18px] font-bold" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["1000", "1500", "3000", "5000", "10000"].map((g) => (
              <motion.button key={g} whileTap={{ scale: 0.96 }} onClick={() => setGoalInput(g)}
                className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-[11px] font-bold ${goalInput === g ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                {parseInt(g).toLocaleString("fr-FR")} €
              </motion.button>
            ))}
          </div>
          <div className="bg-border-light rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-muted">Progression actuelle</p>
              <p className="text-[12px] font-bold text-accent">{Math.round(goalProgress)}%</p>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-accent-gradient rounded-full" style={{ width: `${goalProgress}%` }} />
            </div>
            <p className="text-[11px] text-muted mt-2">{monthRev.toFixed(0)} € / {monthlyGoal.toLocaleString("fr-FR")} €</p>
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowGoalConfig(false)}
            className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow">
            <Save size={15} /> Enregistrer
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
