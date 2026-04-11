"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Package, Plus, Trash2, Lock } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SettingsRow } from "@/components/SettingsPage";
import Modal from "@/components/Modal";
import { hasAccess } from "@/lib/types";
import Link from "next/link";

export default function SettingsStockPage() {
  const { user, products, addProduct, updateProduct, deleteProduct, getLowStockProducts } = useApp();
  const plan = user.plan || "essentiel";
  const canAccess = hasAccess("stock_management", plan);
  const lowStock = getLowStockProducts();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "10", minQuantity: "3", price: "0", category: "", emoji: "📦" });

  async function handleAdd() {
    if (!form.name.trim()) return;
    await addProduct({
      name: form.name.trim(),
      quantity: parseInt(form.quantity) || 0,
      minQuantity: parseInt(form.minQuantity) || 3,
      price: parseFloat(form.price) || 0,
      category: form.category.trim() || "Général",
      emoji: form.emoji || "📦",
    });
    setForm({ name: "", quantity: "10", minQuantity: "3", price: "0", category: "", emoji: "📦" });
    setShowAdd(false);
  }

  if (!canAccess) {
    return (
      <SettingsPage category="Gestion de l'atelier" title="Stock & Inventaire"
        description="Gérez votre inventaire et configurez les alertes de stock.">
        <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4"><Lock size={28} className="text-accent" /></div>
          <h3 className="text-[20px] font-bold text-foreground">Fonctionnalité Pro</h3>
          <p className="text-[13px] text-muted mt-2 leading-relaxed max-w-[260px] mx-auto">
            La gestion de stock est disponible avec le plan Pro à 9,99€/mois.
          </p>
          <Link href="/subscription">
            <motion.button whileTap={{ scale: 0.97 }} className="mt-5 bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold w-full fab-shadow">
              Passer au plan Pro
            </motion.button>
          </Link>
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage category="Gestion de l'atelier" title="Stock & Inventaire"
      description="Gérez votre inventaire, configurez les alertes et ajoutez des produits.">

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
        className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-5">
        <Plus size={16} /> Nouveau produit
      </motion.button>

      {/* Alerts */}
      <SettingsSection title="Alertes">
        <SettingsRow label="Alerte stock bas" hint="Notification quand un produit passe sous le seuil.">
          <SettingsToggle on={true} onToggle={() => {}} />
        </SettingsRow>
        <SettingsRow label="Produits en alerte" last>
          <span className={`text-[14px] font-bold ${lowStock.length > 0 ? "text-danger" : "text-success"}`}>{lowStock.length}</span>
        </SettingsRow>
      </SettingsSection>

      {/* Product list */}
      <SettingsSection title="Produits">
        {products.length === 0 ? (
          <div className="text-center py-6">
            <Package size={28} className="text-muted mx-auto mb-2" />
            <p className="text-[13px] font-bold text-foreground">Aucun produit</p>
            <p className="text-[11px] text-muted mt-1">Ajoutez votre premier produit.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-[20px]">{p.emoji}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted">{p.category} · Seuil : {p.minQuantity}</p>
                </div>
                <div className="text-right mr-2">
                  <p className={`text-[14px] font-bold ${p.quantity <= p.minQuantity ? "text-danger" : "text-foreground"}`}>{p.quantity}</p>
                  <p className="text-[9px] text-muted">unités</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteProduct(p.id)}
                  className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center"><Trash2 size={12} className="text-danger" /></motion.button>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nouveau produit">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom du produit</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Shampoing bio" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Quantité</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Seuil d&apos;alerte</label>
              <input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Catégorie</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Soins" className="input-field" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd} disabled={!form.name.trim()}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold ${form.name.trim() ? "bg-accent text-white fab-shadow" : "bg-border-light text-muted"}`}>
            Enregistrer
          </motion.button>
        </div>
      </Modal>
    </SettingsPage>
  );
}
