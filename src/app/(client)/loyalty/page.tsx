"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, ChevronRight, CheckCircle2, X, Keyboard, Gift } from "lucide-react";
import Modal from "@/components/Modal";

export default function ClientLoyaltyPage() {
  const { loyaltyTemplates, loyaltyCards, getLoyaltyCardByCode } = useApp();
  const [showAddCard, setShowAddCard] = useState(false);
  const [code, setCode] = useState("");
  const [addResult, setAddResult] = useState<"success" | "error" | null>(null);
  const [addedName, setAddedName] = useState("");

  // Build client-visible cards from REAL store data only
  const cards = loyaltyCards.map((card) => {
    const tpl = loyaltyTemplates.find((t) => t.id === card.templateId);
    if (!tpl) return null;
    return { id: card.id, name: tpl.name, program: tpl.mode === "visits" ? "Fidélité" : "Points", progress: card.progress, goal: tpl.goal, reward: tpl.reward, color: tpl.color, emoji: tpl.emoji, isPoints: tpl.mode === "points", code: card.code };
  }).filter(Boolean) as { id: string; name: string; program: string; progress: number; goal: number; reward: string; color: string; emoji: string; isPoints?: boolean; code: string }[];

  function handleAddCard() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 5) { setAddResult("error"); return; }

    // Check if this code exists in the store
    const existing = getLoyaltyCardByCode(trimmed);
    if (existing) {
      const tpl = loyaltyTemplates.find((t) => t.id === existing.templateId);
      setAddedName(tpl?.name || "Programme");
      setAddResult("success");
      setCode("");
    } else {
      setAddResult("error");
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[24px] font-bold text-foreground tracking-tight">Fidélité</h1>
        <p className="text-[13px] text-muted mt-0.5">Gérez vos privilèges et suivez vos récompenses.</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* Cards — bank-card style premium */}
          {cards.length > 0 ? (
            <div className="space-y-4 mb-6">
              {cards.map((card, i) => {
                // Derive a darker variant of the card color for gradient depth
                const baseColor = card.color || "#5B4FE9";
                const gradient = `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}DD 50%, ${baseColor}99 100%)`;
                const pct = !card.isPoints && card.goal > 0 ? Math.min((card.progress / card.goal) * 100, 100) : 0;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ delay: i * 0.08, duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="rounded-[22px] p-5 text-white relative overflow-hidden cursor-pointer"
                    style={{
                      background: gradient,
                      boxShadow: `0 14px 36px ${baseColor}40, 0 4px 12px ${baseColor}30, inset 0 1px 0 rgba(255,255,255,0.18)`,
                      minHeight: "180px",
                    }}
                  >
                    {/* Decorative circles */}
                    <div className="absolute -right-14 -top-14 w-48 h-48 rounded-full bg-white/10" />
                    <div className="absolute -left-8 -bottom-16 w-32 h-32 rounded-full bg-white/8" />
                    <div className="absolute right-5 top-4 flex gap-1 opacity-50">
                      {[0, 1, 2, 3].map((j) => (
                        <div key={j} className="w-1 h-1 rounded-full bg-white/70" />
                      ))}
                    </div>

                    {/* Top row: brand + emoji chip */}
                    <div className="relative z-10 flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/75">{card.program}</p>
                        <p className="text-[16px] font-bold leading-tight mt-1 tracking-tight">{card.name}</p>
                      </div>
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
                      >
                        {card.emoji || "💎"}
                      </div>
                    </div>

                    {/* Middle: progress count */}
                    <div className="relative z-10 mb-3">
                      <p className="text-[32px] font-bold leading-none tracking-tight">
                        {card.isPoints ? card.progress : `${card.progress}`}
                        <span className="text-[14px] font-semibold text-white/60 ml-1">
                          {card.isPoints ? " pts" : `/${card.goal}`}
                        </span>
                      </p>
                      <p className="text-[10px] text-white/70 mt-1 font-medium">
                        Prochaine recompense : <span className="text-white font-bold">{card.reward}</span>
                      </p>
                    </div>

                    {/* Progress bar (visits mode) */}
                    {!card.isPoints && card.goal > 0 && (
                      <div className="relative z-10 w-full h-[5px] bg-white/20 rounded-full overflow-hidden mb-4">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #FFFFFF, rgba(255,255,255,0.8))" }}
                          initial={{ width: "0%" }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 + 0.2, ease: [0.4, 0, 0.2, 1] }}
                        />
                      </div>
                    )}

                    {/* Footer: card code (bank-style) */}
                    <div className="relative z-10 flex items-center justify-between mt-2 pt-3 border-t border-white/15">
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Membre</p>
                      {card.code && (
                        <p className="text-[10px] text-white/60 font-mono tracking-[0.2em]">
                          •••• {card.code.slice(-4)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-6">
              <Gift size={32} className="text-muted mx-auto mb-3" />
              <p className="text-[16px] font-bold text-foreground">Aucune carte fidélité</p>
              <p className="text-[12px] text-muted mt-1.5 leading-relaxed max-w-[240px] mx-auto">
                Demandez un code à votre professionnel pour ajouter votre première carte.
              </p>
            </div>
          )}

          {/* Add card */}
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setShowAddCard(true); setAddResult(null); setCode(""); }}
            className="w-full bg-white rounded-2xl p-5 shadow-card-premium flex flex-col items-center gap-2.5 mb-6 border-2 border-dashed border-accent/20">
            <div className="w-14 h-14 rounded-xl bg-accent-soft flex items-center justify-center">
              <Plus size={24} className="text-accent" />
            </div>
            <p className="text-[15px] font-bold text-foreground">Ajouter une carte</p>
            <p className="text-[12px] text-muted text-center">Entrez le code fourni par votre professionnel.</p>
          </motion.button>
        </div>
      </div>

      {/* Add card modal */}
      <Modal open={showAddCard} onClose={() => setShowAddCard(false)} title="Ajouter une carte">
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {addResult === "success" ? (
              <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="w-16 h-16 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} className="text-success" /></motion.div>
                <h3 className="text-[20px] font-bold text-foreground">Carte ajoutée !</h3>
                <p className="text-[14px] text-muted mt-2"><span className="font-bold text-foreground">{addedName}</span> est maintenant dans votre compte.</p>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAddCard(false)}
                  className="mt-6 w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold fab-shadow">Parfait !</motion.button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="w-14 h-14 rounded-xl bg-accent-soft flex items-center justify-center mb-3"><Keyboard size={24} className="text-accent" /></div>
                  <p className="text-[14px] text-muted leading-relaxed max-w-[260px]">Entrez le code reçu de votre professionnel.</p>
                </div>
                <div>
                  <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Code carte</label>
                  <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setAddResult(null); }}
                    placeholder="Ex : CLT-8392X" className="input-field text-[18px] font-bold tracking-wider text-center" />
                </div>
                {addResult === "error" && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-danger text-[12px] font-semibold bg-danger-soft rounded-xl px-4 py-3">
                    <X size={14} /> Code invalide ou non reconnu.
                  </motion.div>
                )}
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddCard} disabled={!code.trim()}
                  className={`w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 mt-2 ${code.trim() ? "bg-accent-gradient text-white fab-shadow" : "bg-border-light text-muted"}`}>
                  <Plus size={16} /> Ajouter
                </motion.button>
                <p className="text-[10px] text-muted text-center mt-3">Le code est fourni par votre professionnel (format CLT-XXXXX).</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
    </div>
  );
}
