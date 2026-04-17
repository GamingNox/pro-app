"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Gift, Copy, Check, Trash2, X, Sparkles, Percent, CalendarDays,
} from "lucide-react";
import {
  listGiftCodes, createGiftCode, deleteGiftCode, generateGiftCode,
  type GiftCode, type GiftRewardType,
} from "@/lib/giftCodes";
import { tabContentVariants, tabContentTransition } from "@/lib/motion";

export default function AdminGiftsPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    rewardType: "free_month" as GiftRewardType,
    rewardValue: "1",
    expiresAt: "",
  });

  async function load() {
    setLoading(true);
    const list = await listGiftCodes();
    setCodes(list);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function autoGenerate() {
    setForm((f) => ({ ...f, code: generateGiftCode() }));
  }

  async function handleCreate() {
    if (!form.code.trim()) return;
    const value = parseFloat(form.rewardValue) || 1;
    if (value <= 0) return;
    await createGiftCode({
      code: form.code.trim(),
      rewardType: form.rewardType,
      rewardValue: value,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    });
    setForm({ code: "", rewardType: "free_month", rewardValue: "1", expiresAt: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    await deleteGiftCode(id);
    load();
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const stats = useMemo(() => {
    const total = codes.length;
    const active = codes.filter((c) => !c.redeemed && (!c.expiresAt || new Date(c.expiresAt).getTime() > Date.now())).length;
    const redeemed = codes.filter((c) => c.redeemed).length;
    return { total, active, redeemed };
  }, [codes]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center" style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={17} className="text-foreground" />
          </motion.button>
          <span className="text-[15px] font-semibold text-foreground">Admin</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#8B5CF6" }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "#8B5CF6" }}>Premium</p>
          </div>
          <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight mb-2">Codes cadeaux</h1>
          <p className="text-[13px] text-muted leading-relaxed mb-5">
            Creez des codes que vos utilisateurs peuvent echanger contre des mois offerts ou des reductions.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
              <p className="text-[20px] font-bold text-foreground">{stats.total}</p>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider mt-1">Total</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
              <p className="text-[20px] font-bold text-success">{stats.active}</p>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider mt-1">Actifs</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
              <p className="text-[20px] font-bold text-muted">{stats.redeemed}</p>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider mt-1">Utilises</p>
            </div>
          </div>

          {/* Add / Cancel toggle */}
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => {
            if (showForm) { setShowForm(false); } else { autoGenerate(); setShowForm(true); }
          }}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 mb-5 ${
              showForm ? "bg-border-light text-muted" : "text-white fab-shadow"
            }`}
            style={!showForm ? { background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)" } : undefined}>
            {showForm ? <><X size={16} /> Annuler</> : <><Plus size={16} /> Creer un code</>}
          </motion.button>

          {/* Form */}
          <AnimatePresence mode="wait">
            {showForm && (
              <motion.div key="form" initial={tabContentVariants.initial} animate={tabContentVariants.animate} exit={tabContentVariants.exit} transition={tabContentTransition}
                className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
                <h3 className="text-[16px] font-bold text-foreground mb-4">Nouveau code cadeau</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Code</label>
                    <div className="flex gap-2">
                      <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        placeholder="GIFT-ABC123" className="input-field tracking-wider font-bold" />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={autoGenerate}
                        className="px-3 bg-border-light rounded-xl text-[11px] font-bold text-muted flex-shrink-0">
                        Generer
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Type de recompense</label>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setForm({ ...form, rewardType: "free_month", rewardValue: "1" })}
                        className={`flex-1 py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 ${
                          form.rewardType === "free_month" ? "bg-accent text-white" : "bg-border-light text-muted"
                        }`}>
                        <Gift size={13} /> Mois offerts
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setForm({ ...form, rewardType: "discount_percent", rewardValue: "10" })}
                        className={`flex-1 py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 ${
                          form.rewardType === "discount_percent" ? "bg-accent text-white" : "bg-border-light text-muted"
                        }`}>
                        <Percent size={13} /> Reduction %
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                      {form.rewardType === "free_month" ? "Nombre de mois" : "Pourcentage"}
                    </label>
                    <input type="number" min="1" value={form.rewardValue}
                      onChange={(e) => setForm({ ...form, rewardValue: e.target.value })}
                      placeholder={form.rewardType === "free_month" ? "1" : "10"}
                      className="input-field" />
                  </div>

                  <div>
                    <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Expiration (optionnelle)</label>
                    <input type="date" value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      className="input-field" />
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleCreate}
                    disabled={!form.code.trim()}
                    className={`w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 ${
                      form.code.trim() ? "bg-accent text-white fab-shadow" : "bg-border-light text-muted"
                    }`}>
                    <Check size={16} /> Creer le code
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Codes list */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#8B5CF6" }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#8B5CF6" }}>Codes existants</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <p className="text-[12px] text-muted">Chargement...</p>
            </div>
          ) : codes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <Sparkles size={28} className="text-muted mx-auto mb-3" />
              <p className="text-[14px] font-bold text-foreground">Aucun code cadeau</p>
              <p className="text-[11px] text-muted mt-1">Creez votre premier code pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {codes.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
                const status = c.redeemed ? "redeemed" : expired ? "expired" : "active";
                const statusColors = {
                  active: { bg: "#ECFDF5", text: "#15803D", label: "Actif" },
                  redeemed: { bg: "#F4F4F5", text: "#71717A", label: "Utilise" },
                  expired: { bg: "#FEF2F2", text: "#DC2626", label: "Expire" },
                };
                const s = statusColors[status];
                return (
                  <div key={c.id} className="bg-white rounded-2xl p-4 shadow-card-premium">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[16px] font-bold text-foreground tracking-wider">{c.code}</p>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ backgroundColor: s.bg, color: s.text }}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">
                          {c.rewardType === "free_month"
                            ? `${c.rewardValue} mois offert${c.rewardValue > 1 ? "s" : ""}`
                            : `Reduction de ${c.rewardValue}%`}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => copyCode(c.id, c.code)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${copiedId === c.id ? "bg-success" : "bg-border-light"}`}>
                          {copiedId === c.id ? <Check size={13} className="text-white" /> : <Copy size={13} className="text-muted" />}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDelete(c.id)}
                          className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center">
                          <Trash2 size={13} className="text-danger" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted pt-2 border-t border-border-light">
                      <div className="flex items-center gap-1">
                        <CalendarDays size={10} /> Cree le {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </div>
                      {c.expiresAt && (
                        <div className="flex items-center gap-1">
                          <span>· Expire le {new Date(c.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
