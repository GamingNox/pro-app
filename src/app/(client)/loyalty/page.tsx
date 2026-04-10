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
          {/* Cards */}
          {cards.length > 0 ? (
            <div className="space-y-4 mb-6">
              {cards.map((card, i) => (
                <motion.div key={card.id} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ backgroundColor: card.color }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[14px] font-bold">{card.name}</p>
                      <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{card.program}</p>
                    </div>
                    <span className="text-[18px]">{card.emoji || "💎"}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-[28px] font-bold leading-none">
                      {card.isPoints ? `${card.progress} pts` : `${card.progress}/${card.goal}`}
                    </p>
                    <p className="text-[10px] text-white/70 font-semibold text-right max-w-[140px]">{card.reward}</p>
                  </div>
                  {!card.isPoints && card.goal > 0 && (
                    <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
                      <motion.div className="h-full bg-white rounded-full"
                        initial={{ width: "0%" }} animate={{ width: `${Math.min((card.progress / card.goal) * 100, 100)}%` }}
                        transition={{ duration: 0.8 }} />
                    </div>
                  )}
                  {card.code && <p className="text-[9px] text-white/30 mt-2 tracking-wider">{card.code}</p>}
                </motion.div>
              ))}
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
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="w-16 h-16 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} className="text-success" /></motion.div>
                <h3 className="text-[20px] font-bold text-foreground">Carte ajoutée !</h3>
                <p className="text-[14px] text-muted mt-2"><span className="font-bold text-foreground">{addedName}</span> est maintenant dans votre compte.</p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddCard(false)}
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
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddCard} disabled={!code.trim()}
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
