"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import Modal from "@/components/Modal";
import {
  Plus, Clock, CheckCircle2, Receipt, Package, Wallet,
  Trash2, Minus, Search, AlertTriangle, ArrowUpRight, TrendingDown,
} from "lucide-react";
import type { InvoiceItem } from "@/lib/types";

type Tab = "invoices" | "payments" | "stock";

export default function GestionPage() {
  const {
    invoices, clients, products, getClient,
    addInvoice, setInvoiceStatus,
    addProduct, updateProduct, deleteProduct,
    getLowStockProducts, getTodayRevenue, getWeekRevenue, getMonthRevenue, getPendingAmount,
  } = useApp();

  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("invoices");
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [stockSearch, setStockSearch] = useState("");

  // Invoice form
  const [invForm, setInvForm] = useState({ clientId: "", description: "", status: "pending" as "paid" | "pending" });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([{ label: "", quantity: 1, unitPrice: 0 }]);

  // Product form
  const [prodForm, setProdForm] = useState({ name: "", quantity: "", minQuantity: "", price: "", category: "", emoji: "📦" });

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowNewInvoice(true);
    if (searchParams.get("tab") === "stock") setTab("stock");
    if (searchParams.get("tab") === "payments") setTab("payments");
  }, [searchParams]);

  const pending = getPendingAmount();
  const paidTotal = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const lowStock = getLowStockProducts();
  const lineTotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);

  const paidInvoices = useMemo(() => invoices.filter((i) => i.status === "paid").sort((a, b) => b.date.localeCompare(a.date)), [invoices]);
  const pendingInvoices = useMemo(() => invoices.filter((i) => i.status === "pending").sort((a, b) => b.date.localeCompare(a.date)), [invoices]);

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

  function handleInvoiceSubmit() {
    const validItems = lineItems.filter((item) => item.label.trim() && item.unitPrice > 0);
    if (validItems.length === 0 && !invForm.description.trim()) return;
    const total = validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const desc = invForm.description.trim() || validItems.map((i) => i.label).join(", ");
    addInvoice({ clientId: invForm.clientId, amount: total, description: desc, status: invForm.status, date: new Date().toISOString().split("T")[0], items: validItems.length > 0 ? validItems : undefined });
    setShowNewInvoice(false);
    setInvForm({ clientId: "", description: "", status: "pending" });
    setLineItems([{ label: "", quantity: 1, unitPrice: 0 }]);
  }

  function handleProductSubmit() {
    if (!prodForm.name.trim()) return;
    addProduct({ name: prodForm.name.trim(), quantity: parseInt(prodForm.quantity) || 0, minQuantity: parseInt(prodForm.minQuantity) || 3, price: parseFloat(prodForm.price) || 0, category: prodForm.category.trim() || "Autre", emoji: prodForm.emoji || "📦" });
    setShowNewProduct(false);
    setProdForm({ name: "", quantity: "", minQuantity: "", price: "", category: "", emoji: "📦" });
  }

  const selectedInv = selectedInvId ? invoices.find((i) => i.id === selectedInvId) : null;

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <header className="px-6 pt-5 pb-3">
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Gestion</h1>
      </header>

      {/* Summary cards */}
      <div className="px-6 pb-4 grid grid-cols-3 gap-2">
        <motion.div initial={{ y: 4 }} animate={{ y: 0 }}
          className="bg-white rounded-2xl p-3.5 text-center shadow-sm-apple">
          <p className="text-[18px] font-bold text-success">{paidTotal.toFixed(0)} €</p>
          <p className="text-[9px] text-muted mt-0.5">Encaissé</p>
        </motion.div>
        <motion.div initial={{ y: 4 }} animate={{ y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-3.5 text-center shadow-sm-apple">
          <p className={`text-[18px] font-bold ${pending > 0 ? "text-warning" : "text-foreground"}`}>{pending.toFixed(0)} €</p>
          <p className="text-[9px] text-muted mt-0.5">En attente</p>
        </motion.div>
        <motion.div initial={{ y: 4 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-3.5 text-center shadow-sm-apple">
          <p className={`text-[18px] font-bold ${lowStock.length > 0 ? "text-danger" : "text-foreground"}`}>{lowStock.length}</p>
          <p className="text-[9px] text-muted mt-0.5">Stock bas</p>
        </motion.div>
      </div>

      {/* Tab selector */}
      <div className="px-6 pb-3">
        <div className="segment-control">
          {([["invoices", "Facturation", Receipt], ["payments", "Paiements", Wallet], ["stock", "Stock", Package]] as [Tab, string, typeof Receipt][]).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`segment-btn flex-1 flex items-center justify-center gap-1.5 ${tab === key ? "segment-btn-active" : ""}`}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── INVOICES TAB ──────────────────────────────── */}
      {tab === "invoices" && (
        <div className="flex-1 custom-scroll px-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">{invoices.length} facture{invoices.length !== 1 ? "s" : ""}</p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewInvoice(true)}
              className="text-[11px] text-accent font-semibold flex items-center gap-1"><Plus size={13} /> Créer</motion.button>
          </div>
          {invoices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-apple text-center">
              <Receipt size={24} className="text-muted mx-auto mb-2" />
              <p className="text-[14px] font-semibold text-foreground mb-1">Aucune facture</p>
              <p className="text-[12px] text-muted">Créez votre première facture.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {invoices.sort((a, b) => b.date.localeCompare(a.date)).map((inv, i) => {
                const client = getClient(inv.clientId);
                const isPaid = inv.status === "paid";
                return (
                  <motion.button key={inv.id} initial={{ y: 3 }} animate={{ y: 0 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedInvId(inv.id)}
                    className="bg-white rounded-2xl p-3.5 shadow-sm-apple flex items-center gap-3 text-left w-full tap-scale">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPaid ? "bg-success-soft" : "bg-warning-soft"}`}>
                      {isPaid ? <CheckCircle2 size={16} className="text-success" /> : <Clock size={16} className="text-warning" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{inv.description}</p>
                      <p className="text-[10px] text-muted mt-0.5">{client ? `${client.firstName} ${client.lastName} · ` : ""}{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[13px] font-bold ${isPaid ? "text-foreground" : "text-warning"}`}>{inv.amount} €</p>
                      {!isPaid && (
                        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setInvoiceStatus(inv.id, "paid"); }}
                          className="text-[9px] font-semibold text-accent mt-0.5">Encaisser</motion.button>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENTS TAB ──────────────────────────────── */}
      {tab === "payments" && (
        <div className="flex-1 custom-scroll px-6 pb-4">
          {/* Pending */}
          <div className="mb-4">
            <p className="section-label mb-2">En attente ({pendingInvoices.length})</p>
            {pendingInvoices.length === 0 ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm-apple text-center">
                <CheckCircle2 size={20} className="text-success mx-auto mb-1" />
                <p className="text-[13px] font-medium text-foreground">Tout est encaissé</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {pendingInvoices.map((inv) => {
                  const client = getClient(inv.clientId);
                  return (
                    <div key={inv.id} className="bg-white rounded-2xl p-3.5 shadow-sm-apple flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-warning-soft flex items-center justify-center"><Clock size={16} className="text-warning" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{inv.description}</p>
                        <p className="text-[10px] text-muted">{client ? `${client.firstName} ${client.lastName}` : "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-warning">{inv.amount} €</p>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setInvoiceStatus(inv.id, "paid")}
                          className="bg-success text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg">Encaisser</motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Paid */}
          <p className="section-label mb-2">Payé ({paidInvoices.length})</p>
          <div className="flex flex-col gap-1.5">
            {paidInvoices.slice(0, 15).map((inv) => {
              const client = getClient(inv.clientId);
              return (
                <div key={inv.id} className="bg-white rounded-2xl p-3.5 shadow-sm-apple flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success-soft flex items-center justify-center"><CheckCircle2 size={16} className="text-success" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{inv.description}</p>
                    <p className="text-[10px] text-muted">{client ? `${client.firstName} ${client.lastName} · ` : ""}{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                  </div>
                  <p className="text-[13px] font-bold text-success">{inv.amount} €</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STOCK TAB ─────────────────────────────────── */}
      {tab === "stock" && (
        <div className="flex-1 custom-scroll px-6 pb-4">
          {lowStock.length > 0 && (
            <div className="bg-warning-soft rounded-2xl p-3 flex items-center gap-3 mb-3">
              <TrendingDown size={15} className="text-warning flex-shrink-0" />
              <p className="text-[11px] text-foreground">{lowStock.map((p) => p.name).join(", ")}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-2.5">
            <p className="section-label">{products.length} produit{products.length !== 1 ? "s" : ""}</p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewProduct(true)}
              className="text-[11px] text-accent font-semibold flex items-center gap-1"><Plus size={13} /> Ajouter</motion.button>
          </div>

          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input type="text" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="Rechercher..."
              className="w-full bg-white rounded-xl pl-9 pr-4 py-2 text-[13px] placeholder:text-subtle shadow-sm-apple focus:outline-none focus:ring-2 focus:ring-accent/15" />
          </div>

          {groupedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 shadow-apple text-center">
              <Package size={22} className="text-muted mx-auto mb-2" />
              <p className="text-[14px] font-semibold text-foreground">Aucun produit</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedProducts.map(([cat, items]) => (
                <div key={cat}>
                  <p className="section-label mb-1.5">{cat}</p>
                  <div className="flex flex-col gap-1.5">
                    {items.map((p) => {
                      const isLow = p.quantity <= p.minQuantity;
                      const isOut = p.quantity === 0;
                      return (
                        <div key={p.id} className="bg-white rounded-2xl p-3.5 shadow-sm-apple">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{p.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-foreground truncate">{p.name}</p>
                              <p className="text-[10px] text-muted">{p.price.toFixed(2)} €
                                {isOut && <span className="text-danger font-semibold ml-1">· Rupture</span>}
                                {isLow && !isOut && <span className="text-warning font-semibold ml-1">· Bas</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <motion.button whileTap={{ scale: 0.85 }} onClick={() => updateProduct(p.id, { quantity: Math.max(0, p.quantity - 1) })}
                                className="w-7 h-7 rounded-lg bg-border-light flex items-center justify-center"><Minus size={12} /></motion.button>
                              <span className={`w-7 text-center text-[13px] font-bold ${isOut ? "text-danger" : isLow ? "text-warning" : "text-foreground"}`}>{p.quantity}</span>
                              <motion.button whileTap={{ scale: 0.85 }} onClick={() => updateProduct(p.id, { quantity: p.quantity + 1 })}
                                className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center"><Plus size={12} /></motion.button>
                            </div>
                            <motion.button whileTap={{ scale: 0.85 }} onClick={() => deleteProduct(p.id)} className="p-1 text-subtle"><Trash2 size={12} /></motion.button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── New invoice modal ─────────────────────────── */}
      <Modal open={showNewInvoice} onClose={() => setShowNewInvoice(false)} title="Nouvelle facture">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Client</label>
            <select value={invForm.clientId} onChange={(e) => setInvForm({ ...invForm, clientId: e.target.value })} className="input-field">
              <option value="">-- Sélectionner --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] text-muted font-medium">Services / Produits</label>
              <button onClick={() => setLineItems([...lineItems, { label: "", quantity: 1, unitPrice: 0 }])}
                className="text-[11px] text-accent font-semibold flex items-center gap-0.5"><Plus size={12} /> Ajouter</button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div key={index} className="bg-border-light rounded-xl p-3">
                  <input value={item.label} onChange={(e) => { const u = [...lineItems]; u[index] = { ...u[index], label: e.target.value }; setLineItems(u); }}
                    placeholder="Ex : Manucure gel" className="w-full bg-white rounded-lg px-3 py-2 text-[13px] mb-2 focus:outline-none focus:ring-1 focus:ring-accent/20" />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-muted uppercase mb-0.5 block">Qté</label>
                      <input type="number" value={item.quantity || ""} onChange={(e) => { const u = [...lineItems]; u[index] = { ...u[index], quantity: parseInt(e.target.value) || 0 }; setLineItems(u); }}
                        className="w-full bg-white rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/20" min="1" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-muted uppercase mb-0.5 block">Prix unit. €</label>
                      <input type="number" value={item.unitPrice || ""} onChange={(e) => { const u = [...lineItems]; u[index] = { ...u[index], unitPrice: parseFloat(e.target.value) || 0 }; setLineItems(u); }}
                        placeholder="0" className="w-full bg-white rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/20" />
                    </div>
                    <div className="flex-shrink-0 pt-3">
                      <p className="text-[13px] font-bold text-foreground min-w-[45px] text-right">{(item.quantity * item.unitPrice).toFixed(0)} €</p>
                    </div>
                    {lineItems.length > 1 && (
                      <button onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))} className="text-subtle pt-3"><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-foreground rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[13px] text-white/70">Total</span>
            <span className="text-[22px] font-bold text-white">{lineTotal.toFixed(0)} €</span>
          </div>
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Statut</label>
            <div className="flex gap-2">
              <button onClick={() => setInvForm({ ...invForm, status: "pending" })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 ${invForm.status === "pending" ? "bg-warning text-white" : "bg-border-light text-muted"}`}>
                <Clock size={13} /> En attente
              </button>
              <button onClick={() => setInvForm({ ...invForm, status: "paid" })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 ${invForm.status === "paid" ? "bg-success text-white" : "bg-border-light text-muted"}`}>
                <CheckCircle2 size={13} /> Payé
              </button>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleInvoiceSubmit}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold">Créer la facture</motion.button>
        </div>
      </Modal>

      {/* Invoice detail modal */}
      <Modal open={!!selectedInv} onClose={() => setSelectedInvId(null)} title="Détails facture">
        {selectedInv && (() => {
          const client = getClient(selectedInv.clientId);
          const isPaid = selectedInv.status === "paid";
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`badge ${isPaid ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{isPaid ? "Payée" : "En attente"}</span>
                <span className="text-[24px] font-bold text-foreground">{selectedInv.amount} €</span>
              </div>
              <div className="bg-border-light rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between text-[13px]"><span className="text-muted">Description</span><span className="font-semibold text-right max-w-[60%] truncate">{selectedInv.description}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted">Date</span><span className="font-semibold">{new Date(selectedInv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                {client && <div className="flex justify-between text-[13px]"><span className="text-muted">Client</span><span className="font-semibold">{client.firstName} {client.lastName}</span></div>}
              </div>
              {selectedInv.items && selectedInv.items.length > 0 && (
                <div className="bg-border-light rounded-2xl overflow-hidden">
                  {selectedInv.items.map((item, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i < selectedInv.items!.length - 1 ? "border-b border-white/50" : ""}`}>
                      <div><p className="text-[12px] font-medium">{item.label}</p><p className="text-[10px] text-muted">{item.quantity} x {item.unitPrice.toFixed(2)} €</p></div>
                      <p className="text-[12px] font-bold">{(item.quantity * item.unitPrice).toFixed(0)} €</p>
                    </div>
                  ))}
                </div>
              )}
              {!isPaid && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setInvoiceStatus(selectedInv.id, "paid"); setSelectedInvId(null); }}
                  className="w-full bg-success text-white py-3.5 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} /> Marquer comme payée
                </motion.button>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* New product modal */}
      <Modal open={showNewProduct} onClose={() => setShowNewProduct(false)} title="Nouveau produit">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Nom</label>
            <input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} placeholder="Gel UV transparent" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[12px] text-muted font-medium mb-1.5 block">Catégorie</label><input value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })} placeholder="Gel" className="input-field" /></div>
            <div><label className="text-[12px] text-muted font-medium mb-1.5 block">Emoji</label><input value={prodForm.emoji} onChange={(e) => setProdForm({ ...prodForm, emoji: e.target.value })} className="input-field text-center text-xl" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["Quantité", "quantity", "0"], ["Seuil min", "minQuantity", "3"], ["Prix €", "price", "0"]].map(([l, k, ph]) => (
              <div key={k}><label className="text-[12px] text-muted font-medium mb-1.5 block">{l}</label>
                <input type="number" value={(prodForm as Record<string, string>)[k]} onChange={(e) => setProdForm({ ...prodForm, [k]: e.target.value })} placeholder={ph} className="input-field" /></div>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleProductSubmit}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold">Ajouter</motion.button>
        </div>
      </Modal>
    </div>
  );
}
