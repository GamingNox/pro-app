"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Trash2,
  Minus,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Edit3,
  X,
  Check,
  Boxes,
} from "lucide-react";
import SettingsPage, {
  SettingsSection,
  SettingsToggle,
  SettingsRow,
  PrimaryButton,
} from "@/components/SettingsPage";
import Modal from "@/components/Modal";
import { hasAccess, type Product } from "@/lib/types";
import PremiumLockScreen from "@/components/PremiumLockScreen";
import { tabContentVariants, tabContentTransition } from "@/lib/motion";

type StockLevel = "ok" | "warning" | "alert";
function levelFor(p: Product): StockLevel {
  if (p.quantity <= p.minQuantity) return "alert";
  if (p.quantity <= p.minQuantity * 2) return "warning";
  return "ok";
}

interface FormState {
  name: string;
  quantity: string;
  minQuantity: string;
  price: string;
  category: string;
  emoji: string;
}
const BLANK_FORM: FormState = {
  name: "",
  quantity: "10",
  minQuantity: "3",
  price: "0",
  category: "",
  emoji: "📦",
};

const EMOJI_SUGGESTIONS = ["📦", "🧴", "💄", "🧼", "✂️", "🛠️", "🍃", "💊"];

export default function SettingsStockPage() {
  const {
    user,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
  } = useApp();
  const plan = user.plan || "essentiel";
  const canAccess = hasAccess("stock_management", plan);
  const lowStock = getLowStockProducts();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);

  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState("10");

  const [activeCategory, setActiveCategory] = useState<string>("Tous");
  const [alertsOn, setAlertsOn] = useState(true);

  // Derived: category list from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category || "Général"));
    return ["Tous", ...Array.from(set).sort()];
  }, [products]);

  // Derived: filtered products
  const filteredProducts = useMemo(() => {
    if (activeCategory === "Tous") return products;
    return products.filter((p) => (p.category || "Général") === activeCategory);
  }, [products, activeCategory]);

  // Derived: totals
  const totals = useMemo(() => {
    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const alertsCount = products.filter((p) => levelFor(p) === "alert").length;
    const warningsCount = products.filter((p) => levelFor(p) === "warning").length;
    return { totalItems, totalValue, alertsCount, warningsCount };
  }, [products]);

  function resetForm() {
    setForm(BLANK_FORM);
  }

  function openCreate() {
    resetForm();
    setEditId(null);
    setShowAdd(true);
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      quantity: String(p.quantity),
      minQuantity: String(p.minQuantity),
      price: String(p.price),
      category: p.category,
      emoji: p.emoji,
    });
    setEditId(p.id);
    setShowAdd(true);
  }

  function closeForm() {
    setShowAdd(false);
    setEditId(null);
    resetForm();
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      quantity: Math.max(0, parseInt(form.quantity) || 0),
      minQuantity: Math.max(0, parseInt(form.minQuantity) || 0),
      price: parseFloat(form.price) || 0,
      category: form.category.trim() || "Général",
      emoji: form.emoji || "📦",
    };
    if (editId) {
      updateProduct(editId, payload);
    } else {
      await addProduct(payload);
    }
    closeForm();
  }

  // Inline +/- controls on card
  function adjustQty(p: Product, delta: number) {
    const next = Math.max(0, p.quantity + delta);
    updateProduct(p.id, { quantity: next });
  }
  function setQty(p: Product, raw: string) {
    const n = Math.max(0, parseInt(raw) || 0);
    updateProduct(p.id, { quantity: n });
  }
  function adjustMin(p: Product, delta: number) {
    const next = Math.max(0, p.minQuantity + delta);
    updateProduct(p.id, { minQuantity: next });
  }

  function openRestock(id: string) {
    setRestockAmount("10");
    setRestockId(id);
  }
  function confirmRestock() {
    if (!restockId) return;
    const p = products.find((x) => x.id === restockId);
    if (!p) return;
    const add = Math.max(0, parseInt(restockAmount) || 0);
    updateProduct(p.id, { quantity: p.quantity + add });
    setRestockId(null);
  }

  if (!canAccess) {
    return <PremiumLockScreen feature="stock_management" />;
  }

  const restockTarget = products.find((p) => p.id === restockId);

  return (
    <SettingsPage
      category="Gestion de l'atelier"
      title="Stock & Inventaire"
      description="Gérez votre inventaire, suivez vos alertes et réapprovisionnez vos produits en un clic."
    >
      {/* ── Stock summary ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-center gap-1.5 text-muted mb-1">
            <Boxes size={11} className="text-accent" />
            <p className="text-[9px] font-bold uppercase tracking-wider">Unités</p>
          </div>
          <p className="text-[20px] font-bold text-foreground leading-tight">
            {totals.totalItems}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-center gap-1.5 text-muted mb-1">
            <TrendingUp size={11} className="text-accent" />
            <p className="text-[9px] font-bold uppercase tracking-wider">Valeur</p>
          </div>
          <p className="text-[20px] font-bold text-foreground leading-tight">
            {totals.totalValue.toFixed(0)} €
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-center gap-1.5 text-muted mb-1">
            <AlertTriangle size={11} className="text-accent" />
            <p className="text-[9px] font-bold uppercase tracking-wider">Alertes</p>
          </div>
          <p
            className="text-[20px] font-bold leading-tight"
            style={{
              color:
                totals.alertsCount > 0
                  ? "var(--color-danger, #DC2626)"
                  : "var(--color-foreground)",
            }}
          >
            {totals.alertsCount}
          </p>
        </div>
      </div>

      {/* ── New product CTA (violet) ─────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={openCreate}
        className="w-full text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-5"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
          boxShadow:
            "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
        }}
      >
        <Plus size={16} /> Nouveau produit
      </motion.button>

      {/* ── Alerts section ───────────────────────────────────────── */}
      <SettingsSection title="Alertes">
        <SettingsRow
          label="Alerte stock bas"
          hint="Notification quand un produit passe sous le seuil."
        >
          <SettingsToggle on={alertsOn} onToggle={() => setAlertsOn((v) => !v)} />
        </SettingsRow>
        <SettingsRow label="Produits en alerte">
          <span
            className="text-[13px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background:
                totals.alertsCount > 0
                  ? "color-mix(in srgb, var(--color-danger, #DC2626) 14%, white)"
                  : "var(--color-primary-soft)",
              color:
                totals.alertsCount > 0
                  ? "var(--color-danger, #DC2626)"
                  : "var(--color-primary)",
            }}
          >
            {totals.alertsCount}
          </span>
        </SettingsRow>
        <SettingsRow label="Stock faible (avertissement)" last>
          <span
            className="text-[13px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "color-mix(in srgb, #F59E0B 14%, white)",
              color: "#B45309",
            }}
          >
            {totals.warningsCount}
          </span>
        </SettingsRow>
      </SettingsSection>

      {/* ── Category filter pills (violet active) ────────────────── */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => {
            const active = c === activeCategory;
            return (
              <motion.button
                key={c}
                whileTap={{ scale: 0.94 }}
                onClick={() => setActiveCategory(c)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors"
                style={
                  active
                    ? {
                        background: "var(--color-primary)",
                        color: "white",
                        borderColor: "var(--color-primary)",
                      }
                    : {
                        background: "white",
                        color: "var(--color-muted, #71717A)",
                        borderColor: "var(--color-border, #E4E4E7)",
                      }
                }
              >
                {c}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Product list ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-5">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
            <Package size={28} className="text-muted mx-auto mb-2" />
            <p className="text-[13px] font-bold text-foreground">Aucun produit</p>
            <p className="text-[11px] text-muted mt-1">
              {activeCategory === "Tous"
                ? "Ajoutez votre premier produit."
                : "Aucun produit dans cette catégorie."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p) => {
              const level = levelFor(p);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="bg-white rounded-2xl p-4 shadow-card-premium"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[26px] leading-none">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-foreground truncate">
                        {p.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--color-primary-soft)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {p.category || "Général"}
                        </span>
                        <span className="text-[10px] text-muted">
                          {p.price.toFixed(2)} € · seuil {p.minQuantity}
                        </span>
                      </div>
                    </div>

                    {/* Alert chip */}
                    {level === "alert" && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-danger, #DC2626) 14%, white)",
                          color: "var(--color-danger, #DC2626)",
                        }}
                      >
                        <AlertCircle size={10} /> Rupture
                      </span>
                    )}
                    {level === "warning" && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                        style={{
                          background: "color-mix(in srgb, #F59E0B 16%, white)",
                          color: "#B45309",
                        }}
                      >
                        <AlertTriangle size={10} /> Bas
                      </span>
                    )}
                  </div>

                  {/* Quantity +/- row */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-border-light rounded-xl p-1 flex-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => adjustQty(p, -1)}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"
                      >
                        <Minus size={14} className="text-foreground" />
                      </motion.button>
                      <input
                        type="number"
                        value={p.quantity}
                        onChange={(e) => setQty(p, e.target.value)}
                        className="flex-1 bg-transparent text-center text-[14px] font-bold text-foreground focus:outline-none min-w-0"
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => adjustQty(p, 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ background: "var(--color-primary)" }}
                      >
                        <Plus size={14} />
                      </motion.button>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openRestock(p.id)}
                      className="px-3 h-10 rounded-xl text-[12px] font-bold text-white flex items-center gap-1 flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                      }}
                    >
                      <TrendingUp size={12} /> Restocker
                    </motion.button>
                  </div>

                  {/* Min quantity row */}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">
                      Seuil d&apos;alerte
                    </p>
                    <div className="flex items-center gap-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => adjustMin(p, -1)}
                        className="w-7 h-7 rounded-lg bg-border-light flex items-center justify-center"
                      >
                        <Minus size={12} className="text-muted" />
                      </motion.button>
                      <span className="text-[12px] font-bold text-foreground w-7 text-center">
                        {p.minQuantity}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => adjustMin(p, 1)}
                        className="w-7 h-7 rounded-lg bg-border-light flex items-center justify-center"
                      >
                        <Plus size={12} className="text-muted" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-3 pt-3 border-t border-border-light flex justify-end gap-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openEdit(p)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: "var(--color-primary-soft)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <Edit3 size={14} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => deleteProduct(p.id)}
                      className="w-9 h-9 rounded-xl bg-danger-soft flex items-center justify-center"
                    >
                      <Trash2 size={14} className="text-danger" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── Add / Edit modal ─────────────────────────────────────── */}
      <Modal
        open={showAdd}
        onClose={closeForm}
        title={editId ? "Modifier le produit" : "Nouveau produit"}
      >
        <motion.div
          initial={tabContentVariants.initial}
          animate={tabContentVariants.animate}
          transition={tabContentTransition}
          className="space-y-4"
        >
          {/* Emoji picker */}
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
              Icône
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_SUGGESTIONS.map((e) => {
                const active = form.emoji === e;
                return (
                  <motion.button
                    key={e}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setForm({ ...form, emoji: e })}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] border transition-colors"
                    style={
                      active
                        ? {
                            background: "var(--color-primary-soft)",
                            borderColor: "var(--color-primary)",
                            boxShadow:
                              "0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent)",
                          }
                        : {
                            background: "white",
                            borderColor: "var(--color-border, #E4E4E7)",
                          }
                    }
                  >
                    {e}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
              Nom du produit
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Shampoing bio"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                Quantité
              </label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                Seuil d&apos;alerte
              </label>
              <input
                type="number"
                min="0"
                value={form.minQuantity}
                onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                Prix (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                Catégorie
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Soins"
                className="input-field"
              />
            </div>
          </div>

          <PrimaryButton onClick={handleSave} disabled={!form.name.trim()}>
            <Check size={14} /> {editId ? "Enregistrer" : "Créer le produit"}
          </PrimaryButton>
        </motion.div>
      </Modal>

      {/* ── Restock dialog ───────────────────────────────────────── */}
      <Modal
        open={!!restockId}
        onClose={() => setRestockId(null)}
        title="Réapprovisionner"
      >
        {restockTarget && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "var(--color-primary-soft)" }}
            >
              <span className="text-[28px]">{restockTarget.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground truncate">
                  {restockTarget.name}
                </p>
                <p className="text-[11px] text-muted">
                  Stock actuel : {restockTarget.quantity} unités
                </p>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                Quantité à ajouter
              </label>
              <div className="flex items-center gap-1 bg-border-light rounded-xl p-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setRestockAmount(String(Math.max(0, (parseInt(restockAmount) || 0) - 1)))
                  }
                  className="w-9 h-9 rounded-lg bg-white flex items-center justify-center"
                >
                  <Minus size={14} />
                </motion.button>
                <input
                  type="number"
                  min="0"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="flex-1 bg-transparent text-center text-[18px] font-bold text-foreground focus:outline-none"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setRestockAmount(String((parseInt(restockAmount) || 0) + 1))
                  }
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  <Plus size={14} />
                </motion.button>
              </div>
              <div className="flex gap-2 mt-2">
                {[5, 10, 25, 50].map((n) => (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setRestockAmount(String(n))}
                    className="flex-1 py-1.5 rounded-full text-[11px] font-bold border transition-colors"
                    style={
                      restockAmount === String(n)
                        ? {
                            background: "var(--color-primary)",
                            color: "white",
                            borderColor: "var(--color-primary)",
                          }
                        : {
                            background: "white",
                            color: "var(--color-muted, #71717A)",
                            borderColor: "var(--color-border, #E4E4E7)",
                          }
                    }
                  >
                    +{n}
                  </motion.button>
                ))}
              </div>
            </div>

            <p className="text-[12px] text-muted text-center">
              Nouveau stock :{" "}
              <span
                className="font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                {restockTarget.quantity + (parseInt(restockAmount) || 0)} unités
              </span>
            </p>

            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setRestockId(null)}
                className="flex-1 py-3 rounded-2xl text-[13px] font-bold bg-border-light text-muted flex items-center justify-center gap-1"
              >
                <X size={14} /> Annuler
              </motion.button>
              <div className="flex-1">
                <PrimaryButton onClick={confirmRestock}>
                  <Check size={14} /> Valider
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </SettingsPage>
  );
}
