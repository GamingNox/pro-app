"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import Modal from "@/components/Modal";
import {
  Plus, Clock, CheckCircle2, Receipt, Package, Wallet,
  Trash2, Minus, Search, TrendingDown, TrendingUp, ArrowUpRight,
  Copy, AlertCircle, BarChart3, PiggyBank, ShoppingCart,
  FileText, AlertTriangle, ChevronRight, Settings, Save,
} from "lucide-react";
import type { InvoiceItem } from "@/lib/types";
import Link from "next/link";

type Tab = "invoices" | "payments" | "stock" | "analytics";

export default function GestionPage() {
  const {
    invoices, clients, products, services, getClient,
    addInvoice, setInvoiceStatus,
    addProduct, updateProduct, deleteProduct,
    getLowStockProducts, getMonthRevenue, getWeekRevenue, getPendingAmount,
  } = useApp();

  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [stockSearch, setStockSearch] = useState("");

  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showGoalConfig, setShowGoalConfig] = useState(false);
  const [goalInput, setGoalInput] = useState("15000");
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
  const monthlyGoal = parseInt(goalInput) || 15000;
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
        amountColor: inv.status === "paid" ? "text-success" : "text-warning",
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
    if (!stockSearch.trim()) return products;
    const q = stockSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, stockSearch]);

  const groupedProducts = useMemo(() => {
    const m = new Map<string, typeof products>();
    filteredProducts.forEach((p) => { const l = m.get(p.category) || []; l.push(p); m.set(p.category, l); });
    return Array.from(m.entries());
  }, [filteredProducts]);

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background">

      {/* ═══ FIXED HEADER ═══ */}
      <div className="flex-shrink-0">
        <header className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Gestion</h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewInvoice(true)}
            className="bg-white rounded-xl px-3.5 py-2 shadow-sm-apple flex items-center gap-1.5 border border-border-light">
            <Plus size={14} className="text-accent" />
            <span className="text-[12px] font-bold text-foreground">Facture</span>
          </motion.button>
        </header>

        {/* Simple back button when in a sub-view */}
        {tab !== null && (
          <div className="px-6 pb-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setTab(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold bg-white text-muted shadow-sm-apple">
              ← Retour
            </motion.button>
          </div>
        )}
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ═══ OVERVIEW (no tab selected) ═══ */}
          {showOverview && (
            <>
              {/* Monthly goal card */}
              <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Objectif mensuel</p>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowGoalConfig(true)}
                    className="w-7 h-7 rounded-lg bg-border-light flex items-center justify-center">
                    <Settings size={13} className="text-muted" />
                  </motion.button>
                </div>
                <div className="flex items-end gap-1.5 mb-3 mt-2">
                  <p className="text-[32px] font-bold text-foreground tracking-tight leading-none">{monthRev.toFixed(0)} €</p>
                  <p className="text-[14px] text-muted font-medium mb-0.5">/ {(monthlyGoal / 1000).toFixed(0)}k</p>
                </div>
                {/* Progress bar */}
                <div className="w-full h-[8px] bg-border-light rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-accent-gradient rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted font-medium">{Math.round(goalProgress)}% complété</p>
                  <p className="text-[11px] text-muted font-medium">Encore {goalRemaining.toFixed(0)} €</p>
                </div>
              </div>

              {/* Outils de gestion 2x2 */}
              <h2 className="text-[16px] font-bold text-foreground mb-3">Outils de gestion</h2>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: FileText, label: "Factures", onClick: () => setTab("invoices"), bg: "bg-accent-soft", color: "text-accent" },
                  { icon: Wallet, label: "Paiements", onClick: () => setTab("payments"), bg: "bg-warning-soft", color: "text-warning" },
                  { icon: BarChart3, label: "Rapports", onClick: () => setTab("analytics"), bg: "bg-success-soft", color: "text-success" },
                  { icon: Package, label: "Stock", onClick: () => setTab("stock"), bg: "bg-info-soft", color: "text-info" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button key={action.label} whileTap={{ scale: 0.95 }} onClick={action.onClick}
                      className="bg-white rounded-2xl p-5 shadow-card-premium flex flex-col items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center`}>
                        <Icon size={22} className={action.color} />
                      </div>
                      <span className="text-[13px] font-bold text-foreground">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Dernières Activités */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold text-foreground">Dernières Activités</h2>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setTab("invoices")}
                  className="text-[12px] text-accent font-bold flex items-center gap-0.5">
                  Voir tout <ChevronRight size={13} />
                </motion.button>
              </div>

              {recentActivity.length === 0 ? (
                <div className="bg-white rounded-[22px] p-7 shadow-card-premium text-center">
                  <Receipt size={24} className="text-muted mx-auto mb-2" />
                  <p className="text-[14px] font-bold text-foreground">Pas encore d&apos;activité</p>
                  <p className="text-[12px] text-muted mt-1">Créez votre première facture.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden">
                  {recentActivity.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id + i} className={`flex items-center gap-3.5 px-4 py-4 ${i < recentActivity.length - 1 ? "border-b border-border-light" : ""}`}>
                        <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={17} className={item.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-foreground truncate">{item.title}</p>
                          <p className="text-[11px] text-muted mt-0.5">{item.subtitle}</p>
                        </div>
                        {item.amount && (
                          <p className={`text-[14px] font-bold flex-shrink-0 ${item.amountColor}`}>{item.amount}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ═══ FACTURES TAB ═══ */}
          {tab === "invoices" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">{realInvoices.length} facture{realInvoices.length !== 1 ? "s" : ""}</p>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewExpense(true)}
                    className="text-[11px] text-muted font-bold flex items-center gap-1 bg-border-light px-3 py-1.5 rounded-lg">
                    <PiggyBank size={12} /> Dépense
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewInvoice(true)}
                    className="text-[11px] text-white font-bold flex items-center gap-1 bg-accent px-3 py-1.5 rounded-lg">
                    <Plus size={12} /> Facture
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? "bg-success-soft" : isOverdue ? "bg-danger-soft" : "bg-warning-soft"}`}>
                          {isPaid ? <CheckCircle2 size={17} className="text-success" /> : isOverdue ? <AlertCircle size={17} className="text-danger" /> : <Clock size={17} className="text-warning" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-foreground truncate">{inv.description}</p>
                          <p className="text-[11px] text-muted mt-0.5">{client ? `${client.firstName} ${client.lastName} · ` : ""}{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-[14px] font-bold ${isPaid ? "text-foreground" : isOverdue ? "text-danger" : "text-warning"}`}>{inv.amount} €</p>
                          {!isPaid && (
                            <motion.button whileTap={{ scale: 0.88 }} onClick={(e) => { e.stopPropagation(); setInvoiceStatus(inv.id, "paid"); }}
                              className="text-[10px] font-bold text-accent mt-0.5 flex items-center gap-0.5">
                              <ArrowUpRight size={10} /> Encaisser
                            </motion.button>
                          )}
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
            </>
          )}

          {/* ═══ PAYMENTS TAB ═══ */}
          {tab === "payments" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">Suivi des paiements</p>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setPayForm({ clientId: "", productId: "", serviceLabel: "", amount: "", useProduct: true }); setShowNewPayment(true); }}
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
                            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setInvoiceStatus(inv.id, "paid")}
                              className="bg-success text-white text-[11px] font-bold px-3 py-2 rounded-xl">Encaisser</motion.button>
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
                  <CheckCircle2 size={22} className="text-success mx-auto mb-2" />
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
                          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setInvoiceStatus(inv.id, "paid")}
                            className="bg-success text-white text-[11px] font-bold px-3 py-2 rounded-xl">Encaisser</motion.button>
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
                      <div className="w-10 h-10 rounded-xl bg-success-soft flex items-center justify-center"><CheckCircle2 size={17} className="text-success" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-foreground truncate">{inv.description}</p>
                        <p className="text-[11px] text-muted">{client ? `${client.firstName} ${client.lastName} · ` : ""}{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                      </div>
                      <p className="text-[14px] font-bold text-success">{inv.amount} €</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ═══ STOCK TAB ═══ */}
          {tab === "stock" && (
            <>
              {lowStock.length > 0 && (
                <div className="bg-warning-soft rounded-2xl p-3.5 flex items-center gap-3 mb-3">
                  <TrendingDown size={16} className="text-warning flex-shrink-0" />
                  <p className="text-[12px] text-foreground font-medium">{lowStock.map((p) => p.name).join(", ")}</p>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">{products.length} produit{products.length !== 1 ? "s" : ""}</p>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewProduct(true)}
                  className="text-[11px] text-white font-bold flex items-center gap-1 bg-accent px-3 py-1.5 rounded-lg">
                  <Plus size={12} /> Ajouter
                </motion.button>
              </div>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
                <input type="text" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="Rechercher..."
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
                                  <motion.button whileTap={{ scale: 0.82 }} onClick={() => updateProduct(p.id, { quantity: Math.max(0, p.quantity - 1) })}
                                    className="w-7 h-7 rounded-lg bg-border-light flex items-center justify-center"><Minus size={12} /></motion.button>
                                  <motion.button whileTap={{ scale: 0.82 }} onClick={() => updateProduct(p.id, { quantity: p.quantity + 1 })}
                                    className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center"><Plus size={12} /></motion.button>
                                </div>
                                <motion.button whileTap={{ scale: 0.82 }} onClick={() => deleteProduct(p.id)} className="p-1 text-subtle"><Trash2 size={12} /></motion.button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ ANALYTICS TAB ═══ */}
          {tab === "analytics" && (
            <>
              <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-4">
                <p className="text-[13px] font-bold text-foreground mb-4">Revenus · 6 derniers mois</p>
                <div className="flex items-end gap-[5px] h-[100px] mb-2">
                  {monthlyData.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-[80px] flex items-end">
                        <motion.div className="flex-1 bg-accent/15 rounded-[3px]"
                          initial={{ height: 0 }} animate={{ height: `${Math.max((m.revenue / maxMonthly) * 100, 4)}%` }}
                          transition={{ delay: i * 0.06, duration: 0.5 }} />
                      </div>
                      <span className="text-[9px] text-muted font-medium">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Ce mois", value: `${monthRev.toFixed(0)} €`, color: "text-success" },
                  { label: "En attente", value: `${pending.toFixed(0)} €`, color: "text-warning" },
                  { label: "Dépenses", value: `${monthExpenses.toFixed(0)} €`, color: "text-danger" },
                  { label: "Bénéfice", value: `${(monthRev - monthExpenses).toFixed(0)} €`, color: monthRev - monthExpenses >= 0 ? "text-success" : "text-danger" },
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
                          <p className="text-[13px] font-bold text-success">{revenue} €</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}

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
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLineItems([...lineItems, { label: "", quantity: 1, unitPrice: 0 }])}
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
                    {lineItems.length > 1 && <motion.button whileTap={{ scale: 0.85 }} onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))} className="text-subtle pt-4"><Trash2 size={12} /></motion.button>}
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
                className={`flex-1 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 ${invForm.status === "paid" ? "bg-success text-white" : "bg-border-light text-muted"}`}>
                <CheckCircle2 size={14} /> Payé
              </motion.button>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleInvoiceSubmit}
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
                <span className={`badge text-[12px] px-3 py-1.5 ${isPaid ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{isPaid ? "Payée" : "En attente"}</span>
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
                    className="flex-1 bg-success text-white py-3.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={15} /> Encaisser
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => duplicateInvoice(selectedInv.id)}
                  className="flex-1 bg-border-light text-foreground py-3.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2">
                  <Copy size={15} /> Dupliquer
                </motion.button>
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
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleExpenseSubmit}
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
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleProductSubmit}
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
            <div className="bg-success-soft rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-success font-bold">Paiement encaissé</p>
                  <p className="text-[11px] text-foreground/60 mt-0.5">
                    {clients.find((c) => c.id === payForm.clientId)?.firstName} — {payForm.useProduct && payForm.productId ? products.find((p) => p.id === payForm.productId)?.name : payForm.serviceLabel || "Paiement"}
                  </p>
                </div>
                <p className="text-[20px] font-bold text-success">{parseFloat(payForm.amount || "0").toFixed(0)} €</p>
              </div>
              {payForm.useProduct && payForm.productId && (
                <p className="text-[10px] text-success/70 mt-2 flex items-center gap-1">
                  <Package size={10} /> Le stock sera mis à jour automatiquement
                </p>
              )}
            </div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handlePaymentSubmit}
            disabled={!payForm.clientId || !payForm.amount}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 ${
              payForm.clientId && payForm.amount ? "bg-success text-white fab-shadow" : "bg-border-light text-muted"
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
              placeholder="15000" className="input-field text-[18px] font-bold" />
          </div>
          <div className="flex gap-2">
            {["5000", "10000", "15000", "20000", "30000"].map((g) => (
              <motion.button key={g} whileTap={{ scale: 0.9 }} onClick={() => setGoalInput(g)}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold ${goalInput === g ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                {(parseInt(g) / 1000).toFixed(0)}k
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
            <p className="text-[11px] text-muted mt-2">{monthRev.toFixed(0)} € / {(monthlyGoal / 1000).toFixed(0)}k €</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowGoalConfig(false)}
            className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow">
            <Save size={15} /> Enregistrer
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
