"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import Modal from "@/components/Modal";
import {
  Plus, Clock, CheckCircle2, TrendingUp, Receipt, ChevronRight,
  Trash2, FileText, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import type { InvoiceItem } from "@/lib/types";

type Period = "day" | "week" | "month";
type Filter = "all" | "paid" | "pending";

export default function FinancesPage() {
  const { invoices, clients, getClient, addInvoice, setInvoiceStatus, getTodayRevenue, getWeekRevenue, getMonthRevenue, getPendingAmount } = useApp();
  const searchParams = useSearchParams();

  const [period, setPeriod] = useState<Period>("week");
  const [filter, setFilter] = useState<Filter>("all");
  const [showNew, setShowNew] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: "", description: "", status: "pending" as "paid" | "pending",
  });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    { label: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowNew(true);
    if (searchParams.get("filter") === "pending") setFilter("pending");
  }, [searchParams]);

  const revenue = period === "day" ? getTodayRevenue() : period === "week" ? getWeekRevenue() : getMonthRevenue();
  const pending = getPendingAmount();
  const paidTotal = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const invoiceCount = invoices.length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  const filtered = useMemo(() => {
    let list = [...invoices].sort((a, b) => b.date.localeCompare(a.date));
    if (filter !== "all") list = list.filter((i) => i.status === filter);
    return list;
  }, [invoices, filter]);

  // 7-day chart
  const bars = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    const dl = ["D", "L", "M", "M", "J", "V", "S"];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      out.push({ label: dl[d.getDay()], value: invoices.filter((x) => x.date === ds && x.status === "paid").reduce((s, x) => s + x.amount, 0) });
    }
    return out;
  }, [invoices]);
  const maxBar = Math.max(...bars.map((b) => b.value), 1);

  const lineTotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);

  function addLineItem() {
    setLineItems([...lineItems, { label: "", quantity: 1, unitPrice: 0 }]);
  }

  function updateLineItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const updated = [...lineItems];
    if (field === "label") {
      updated[index] = { ...updated[index], label: value as string };
    } else {
      updated[index] = { ...updated[index], [field]: typeof value === "string" ? (parseFloat(value) || 0) : value };
    }
    setLineItems(updated);
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const validItems = lineItems.filter((item) => item.label.trim() && item.unitPrice > 0);
    if (validItems.length === 0 && !form.description.trim()) return;

    const total = validItems.length > 0 ? validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0) : 0;
    const desc = form.description.trim() || validItems.map((i) => i.label).join(", ");

    addInvoice({
      clientId: form.clientId,
      amount: total,
      description: desc,
      status: form.status,
      date: new Date().toISOString().split("T")[0],
      items: validItems.length > 0 ? validItems : undefined,
    });
    setShowNew(false);
    setForm({ clientId: "", description: "", status: "pending" });
    setLineItems([{ label: "", quantity: 1, unitPrice: 0 }]);
  }

  const selectedInv = selectedInvId ? invoices.find((i) => i.id === selectedInvId) : null;

  return (
    <div className="flex-1 flex flex-col animate-in">
      {/* Header */}
      <header className="px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Finances</h1>
          <p className="text-[12px] text-muted">{invoiceCount} facture{invoiceCount !== 1 ? "s" : ""}</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNew(true)}
          className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center fab-shadow">
          <Plus size={18} strokeWidth={2} />
        </motion.button>
      </header>

      {/* Revenue card */}
      <div className="px-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-apple"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="section-label mb-1.5">Revenus</p>
              <p className="number-xl">
                {revenue.toFixed(0)}<span className="text-[16px] text-muted font-medium ml-0.5">€</span>
              </p>
            </div>
            <div className="segment-control">
              {(["day", "week", "month"] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`segment-btn ${period === p ? "segment-btn-active" : ""}`}>
                  {p === "day" ? "Jour" : p === "week" ? "Sem." : "Mois"}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="flex items-end gap-[6px] h-14 mb-3">
            {bars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-10 flex items-end">
                  <motion.div
                    className={`w-full rounded-[4px] ${i === bars.length - 1 ? "bg-accent" : "bg-accent/15"}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((b.value / maxBar) * 100, 6)}%` }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.4 }}
                  />
                </div>
                <span className="text-[9px] text-muted font-medium">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Paid vs Pending */}
          <div className="flex gap-3 pt-3 border-t border-border-light">
            <div className="flex-1 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-success-soft flex items-center justify-center">
                <ArrowUpRight size={14} className="text-success" />
              </div>
              <div>
                <p className="text-[10px] text-muted">Encaissé</p>
                <p className="text-[15px] font-bold text-success">{paidTotal.toFixed(0)} €</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warning-soft flex items-center justify-center">
                <Clock size={14} className="text-warning" />
              </div>
              <div>
                <p className="text-[10px] text-muted">En attente</p>
                <p className="text-[15px] font-bold text-warning">{pending.toFixed(0)} €</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter tabs */}
      <div className="px-6 pb-2.5 flex gap-1.5">
        {(["all", "paid", "pending"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
              filter === f ? "bg-foreground text-white" : "bg-white text-muted shadow-sm-apple"
            }`}>
            {f === "all" ? `Tout (${invoiceCount})` : f === "paid" ? `Payé (${paidCount})` : `En attente (${invoiceCount - paidCount})`}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      <div className="flex-1 custom-scroll px-6 pb-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-apple text-center mt-2">
            <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
              <Receipt size={24} className="text-accent" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">Aucune facture</p>
            <p className="text-[12px] text-muted mb-4">
              {filter === "all" ? "Créez votre première facture" : filter === "paid" ? "Aucune facture payée" : "Aucune facture en attente"}
            </p>
            {filter === "all" && (
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNew(true)}
                className="inline-flex items-center gap-1.5 bg-accent text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl">
                <Plus size={15} />
                Créer une facture
              </motion.button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((inv, i) => {
              const client = getClient(inv.clientId);
              const isPaid = inv.status === "paid";
              return (
                <motion.button key={inv.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedInvId(inv.id)}
                  className="bg-white rounded-2xl p-4 shadow-sm-apple flex items-center gap-3.5 text-left w-full tap-scale"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? "bg-success-soft" : "bg-warning-soft"}`}>
                    {isPaid ? <CheckCircle2 size={17} className="text-success" /> : <Clock size={17} className="text-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{inv.description}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {client ? `${client.firstName} ${client.lastName} · ` : ""}
                      {new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      {inv.items && inv.items.length > 0 && ` · ${inv.items.length} article${inv.items.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[14px] font-bold ${isPaid ? "text-foreground" : "text-warning"}`}>{inv.amount} €</p>
                    {!isPaid && (
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setInvoiceStatus(inv.id, "paid"); }}
                        className="text-[10px] font-semibold text-accent mt-0.5">
                        Encaisser
                      </motion.button>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── New invoice modal with line items ──────────── */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouvelle facture">
        <div className="space-y-5">
          {/* Client */}
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Client</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="input-field">
              <option value="">-- Sélectionner un client --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] text-muted font-medium">Services / Produits</label>
              <button onClick={addLineItem} className="text-[11px] text-accent font-semibold flex items-center gap-0.5">
                <Plus size={12} /> Ajouter
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <motion.div key={index}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-border-light rounded-xl p-3"
                >
                  <input
                    value={item.label}
                    onChange={(e) => updateLineItem(index, "label", e.target.value)}
                    placeholder="Ex : Manucure gel"
                    className="w-full bg-white rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-accent/20 mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-muted uppercase tracking-wider mb-0.5 block">Qté</label>
                      <input type="number" value={item.quantity || ""}
                        onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                        className="w-full bg-white rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/20"
                        min="1" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-muted uppercase tracking-wider mb-0.5 block">Prix unit. €</label>
                      <input type="number" value={item.unitPrice || ""}
                        onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                        placeholder="0"
                        className="w-full bg-white rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/20" />
                    </div>
                    <div className="flex-shrink-0">
                      <label className="text-[9px] text-muted uppercase tracking-wider mb-0.5 block">Total</label>
                      <p className="text-[13px] font-bold text-foreground py-1.5 px-1 min-w-[50px] text-right">
                        {(item.quantity * item.unitPrice).toFixed(0)} €
                      </p>
                    </div>
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(index)} className="text-subtle hover:text-danger transition-colors mt-3">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-foreground rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[13px] text-white/70 font-medium">Total</span>
            <span className="text-[24px] font-bold text-white">{lineTotal.toFixed(0)} €</span>
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Description (optionnel)</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Résumé de la facture" className="input-field" />
          </div>

          {/* Status */}
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Statut</label>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, status: "pending" })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  form.status === "pending" ? "bg-warning text-white" : "bg-border-light text-muted"
                }`}>
                <Clock size={13} /> En attente
              </button>
              <button onClick={() => setForm({ ...form, status: "paid" })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  form.status === "paid" ? "bg-success text-white" : "bg-border-light text-muted"
                }`}>
                <CheckCircle2 size={13} /> Payé
              </button>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold shadow-sm">
            Créer la facture
          </motion.button>
        </div>
      </Modal>

      {/* ── Invoice detail modal ──────────────────────── */}
      <Modal open={!!selectedInv} onClose={() => setSelectedInvId(null)} title="Détails facture">
        {selectedInv && (() => {
          const client = getClient(selectedInv.clientId);
          const isPaid = selectedInv.status === "paid";
          return (
            <div className="space-y-4">
              {/* Status + Amount */}
              <div className="flex items-center justify-between">
                <span className={`badge ${isPaid ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                  {isPaid ? "Payée" : "En attente"}
                </span>
                <span className="text-[26px] font-bold text-foreground">{selectedInv.amount} €</span>
              </div>

              {/* Info */}
              <div className="bg-border-light rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted">Description</span>
                  <span className="font-semibold text-right max-w-[60%] truncate">{selectedInv.description}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted">Date</span>
                  <span className="font-semibold">{new Date(selectedInv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                {client && (
                  <div className="flex justify-between text-[13px] items-center">
                    <span className="text-muted">Client</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: client.avatar }}>
                        {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                      </div>
                      <span className="font-semibold">{client.firstName} {client.lastName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Line items */}
              {selectedInv.items && selectedInv.items.length > 0 && (
                <div>
                  <p className="section-label mb-2">Détail</p>
                  <div className="bg-border-light rounded-2xl overflow-hidden">
                    {selectedInv.items.map((item, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < selectedInv.items!.length - 1 ? "border-b border-white/50" : ""}`}>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted">{item.quantity} x {item.unitPrice.toFixed(2)} €</p>
                        </div>
                        <p className="text-[13px] font-bold text-foreground">{(item.quantity * item.unitPrice).toFixed(0)} €</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/50 border-t border-border">
                      <span className="text-[13px] font-semibold text-foreground">Total</span>
                      <span className="text-[15px] font-bold text-foreground">{selectedInv.amount} €</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isPaid && (
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setInvoiceStatus(selectedInv.id, "paid"); setSelectedInvId(null); }}
                  className="w-full bg-success text-white py-3.5 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} />
                  Marquer comme payée
                </motion.button>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
