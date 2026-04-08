"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import Modal from "@/components/Modal";
import Link from "next/link";
import {
  Plus, Search, AlertTriangle, Package, Minus, Trash2,
  Crown, ChevronRight, User, TrendingDown,
} from "lucide-react";

export default function StockPage() {
  const { products, addProduct, updateProduct, deleteProduct, getLowStockProducts } = useApp();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "", minQuantity: "", price: "", category: "", emoji: "📦" });

  const lowStock = getLowStockProducts();
  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof products>();
    filtered.forEach((p) => { const l = m.get(p.category) || []; l.push(p); m.set(p.category, l); });
    return Array.from(m.entries());
  }, [filtered]);

  function handleSubmit() {
    if (!form.name.trim()) return;
    addProduct({
      name: form.name.trim(),
      quantity: parseInt(form.quantity) || 0,
      minQuantity: parseInt(form.minQuantity) || 3,
      price: parseFloat(form.price) || 0,
      category: form.category.trim() || "Autre",
      emoji: form.emoji || "📦",
    });
    setShowNew(false);
    setForm({ name: "", quantity: "", minQuantity: "", price: "", category: "", emoji: "📦" });
  }

  return (
    <div className="flex-1 flex flex-col animate-in">
      {/* Header */}
      <header className="px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Stock</h1>
          <p className="text-[12px] text-muted">{products.length} produit{products.length !== 1 && "s"}</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNew(true)}
          className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center fab-shadow">
          <Plus size={18} strokeWidth={2} />
        </motion.button>
      </header>

      {/* Quick links */}
      <div className="px-6 pb-3 flex gap-2">
        <Link href="/profile" className="flex-1">
          <motion.div whileTap={{ scale: 0.97 }}
            className="bg-white rounded-2xl p-3 shadow-sm-apple flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center"><User size={15} className="text-muted" /></div>
            <span className="text-[12px] font-medium text-foreground flex-1">Profil</span>
            <ChevronRight size={14} className="text-border" />
          </motion.div>
        </Link>
        <Link href="/subscription" className="flex-1">
          <motion.div whileTap={{ scale: 0.97 }}
            className="bg-white rounded-2xl p-3 shadow-sm-apple flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warning-soft flex items-center justify-center"><Crown size={15} className="text-warning" /></div>
            <span className="text-[12px] font-medium text-foreground flex-1">Pro</span>
            <ChevronRight size={14} className="text-border" />
          </motion.div>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="px-6 pb-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-apple"
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: products.length, l: "Produits", emoji: "📦" },
              { v: lowStock.length, l: "Stock bas", emoji: "⚠️", highlight: lowStock.length > 0 },
              { v: `${totalValue.toFixed(0)} €`, l: "Valeur", emoji: "💰" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] mb-1">{s.emoji}</p>
                <p className={`text-[18px] font-bold ${s.highlight ? "text-warning" : "text-foreground"}`}>{s.v}</p>
                <p className="text-[10px] text-muted mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="px-6 pb-3">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-warning-soft rounded-2xl p-3.5 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingDown size={15} className="text-warning" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-0.5">Stock faible</p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{lowStock.map((p) => p.name).join(", ")}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search */}
      <div className="px-6 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..."
            className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-[14px] placeholder:text-subtle shadow-sm-apple focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all" />
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 custom-scroll px-6 pb-4">
        {grouped.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-apple text-center mt-2">
            <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
              <Package size={24} className="text-accent" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">Aucun produit</p>
            <p className="text-[12px] text-muted mb-4">Ajoutez vos premiers produits.</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-1.5 bg-accent text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl">
              <Plus size={15} />
              Ajouter un produit
            </motion.button>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([cat, items]) => (
              <div key={cat}>
                <p className="section-label mb-2">{cat}</p>
                <div className="flex flex-col gap-1.5">
                  {items.map((p, i) => {
                    const isLow = p.quantity <= p.minQuantity;
                    const isOut = p.quantity === 0;
                    const pct = p.minQuantity > 0 ? Math.min((p.quantity / (p.minQuantity * 3)) * 100, 100) : 100;
                    return (
                      <motion.div key={p.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-white rounded-2xl p-4 shadow-sm-apple"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl w-8 text-center">{p.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{p.name}</p>
                            <p className="text-[11px] text-muted mt-0.5">
                              {p.price.toFixed(2)} €
                              {isOut && <span className="text-danger font-semibold ml-1.5">· Rupture</span>}
                              {isLow && !isOut && <span className="text-warning font-semibold ml-1.5">· Bas</span>}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <motion.button whileTap={{ scale: 0.85 }}
                              onClick={() => updateProduct(p.id, { quantity: Math.max(0, p.quantity - 1) })}
                              className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center">
                              <Minus size={13} className="text-muted" />
                            </motion.button>
                            <span className={`w-8 text-center text-[14px] font-bold ${isOut ? "text-danger" : isLow ? "text-warning" : "text-foreground"}`}>
                              {p.quantity}
                            </span>
                            <motion.button whileTap={{ scale: 0.85 }}
                              onClick={() => updateProduct(p.id, { quantity: p.quantity + 1 })}
                              className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
                              <Plus size={13} />
                            </motion.button>
                          </div>

                          <motion.button whileTap={{ scale: 0.85 }} onClick={() => deleteProduct(p.id)}
                            className="p-1.5 text-subtle hover:text-danger transition-colors">
                            <Trash2 size={13} />
                          </motion.button>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 h-[3px] bg-border-light rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${isOut ? "bg-danger" : isLow ? "bg-warning" : "bg-success"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New product modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouveau produit">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Nom</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Gel UV transparent" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Catégorie</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Gel" className="input-field" />
            </div>
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Emoji</label>
              <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="input-field text-center text-xl" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["Quantité", "quantity", "0"], ["Seuil min", "minQuantity", "3"], ["Prix €", "price", "0"]].map(([l, k, ph]) => (
              <div key={k}>
                <label className="text-[12px] text-muted font-medium mb-1.5 block">{l}</label>
                <input type="number" value={(form as Record<string, string>)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  placeholder={ph} className="input-field" />
              </div>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold shadow-sm">
            Ajouter le produit
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
