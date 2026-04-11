"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import Modal from "@/components/Modal";
import Link from "next/link";
import {
  ArrowLeft, Plus, CreditCard, Copy, Check, Trash2, ChevronRight,
  Users, Sparkles, Star, Edit3, CheckCircle2, X,
} from "lucide-react";
import type { LoyaltyTemplate } from "@/lib/types";
import { hasAccess } from "@/lib/types";
import { Lock } from "lucide-react";

const CARD_COLORS = ["#007AFF", "#1D1D1F", "#7C3AED", "#10B981", "#DC2626", "#F59E0B"];
const EMOJIS = ["💎", "⭐", "🎁", "💅", "✨", "🌟", "💫", "🏆"];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CLT-";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function LoyaltyManagePage() {
  const { user, clients, loyaltyTemplates, addLoyaltyTemplate, deleteLoyaltyTemplate, loyaltyCards, addLoyaltyCard, updateLoyaltyCard, deleteLoyaltyCard, getClient, appointments } = useApp();

  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [tplForm, setTplForm] = useState({ name: "", color: "#007AFF", emoji: "💎", mode: "visits" as "visits" | "points", goal: "10", reward: "Service gratuit", message: "Merci de votre fidélité !" });
  const [cardForm, setCardForm] = useState({ templateId: "", clientId: "" });
  const [copied, setCopied] = useState<string | null>(null);

  function handleCreateTemplate() {
    if (!tplForm.name.trim()) return;
    addLoyaltyTemplate({
      name: tplForm.name.trim(), color: tplForm.color, emoji: tplForm.emoji,
      mode: tplForm.mode, goal: parseInt(tplForm.goal) || 10,
      reward: tplForm.reward.trim(), message: tplForm.message.trim(),
    });
    setShowNewTemplate(false);
    setTplForm({ name: "", color: "#007AFF", emoji: "💎", mode: "visits", goal: "10", reward: "Service gratuit", message: "Merci de votre fidélité !" });
  }

  function handleCreateCard() {
    if (!cardForm.templateId || !cardForm.clientId) return;
    addLoyaltyCard({ templateId: cardForm.templateId, clientId: cardForm.clientId, code: generateCode(), progress: 0 });
    setShowNewCard(false);
    setCardForm({ templateId: "", clientId: "" });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  // Auto-update: count done appointments for each client card
  const autoProgress = useMemo(() => {
    const m: Record<string, number> = {};
    loyaltyCards.forEach((card) => {
      const tpl = loyaltyTemplates.find((t) => t.id === card.templateId);
      if (tpl?.mode === "visits") {
        const doneCount = appointments.filter((a) => a.clientId === card.clientId && a.status === "done").length;
        m[card.id] = doneCount;
      }
    });
    return m;
  }, [loyaltyCards, loyaltyTemplates, appointments]);

  const viewedCard = selectedCard ? loyaltyCards.find((c) => c.id === selectedCard) : null;
  const viewedTemplate = viewedCard ? loyaltyTemplates.find((t) => t.id === viewedCard.templateId) : null;
  const viewedClient = viewedCard ? getClient(viewedCard.clientId) : null;

  const plan = user?.plan || "essentiel";
  const canAccess = hasAccess("loyalty_system", plan);

  if (!canAccess) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
          <Link href="/profile"><motion.div whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-xl bg-white shadow-sm-apple flex items-center justify-center"><ArrowLeft size={17} /></motion.div></Link>
          <div className="flex-1"><h1 className="text-[22px] font-bold text-foreground tracking-tight">Fidélité</h1></div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-32">
          <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mt-4">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4"><Lock size={28} className="text-accent" /></div>
            <h3 className="text-[20px] font-bold text-foreground">Fonctionnalité Pro</h3>
            <p className="text-[13px] text-muted mt-2 leading-relaxed max-w-[260px] mx-auto">
              Le programme de fidélité est disponible avec le plan Pro à 9,99€/mois.
            </p>
            <Link href="/subscription">
              <motion.button whileTap={{ scale: 0.97 }} className="mt-5 bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold w-full fab-shadow">
                Passer au plan Pro
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
        <Link href="/profile"><motion.div whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-xl bg-white shadow-sm-apple flex items-center justify-center"><ArrowLeft size={17} /></motion.div></Link>
        <div className="flex-1"><h1 className="text-[22px] font-bold text-foreground tracking-tight">Fidélité</h1><p className="text-[11px] text-muted">Gérez vos programmes et cartes clients.</p></div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ── Templates section ─────────────────────── */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-foreground">Mes programmes</h2>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewTemplate(true)}
              className="text-[11px] font-bold text-white bg-accent px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Plus size={12} /> Créer
            </motion.button>
          </div>

          {loyaltyTemplates.length === 0 ? (
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowNewTemplate(true)}
              className="w-full bg-white rounded-[22px] p-6 shadow-card-premium text-center mb-5 border-2 border-dashed border-accent/20">
              <div className="w-14 h-14 rounded-xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-accent" />
              </div>
              <p className="text-[15px] font-bold text-foreground">Créez votre premier programme</p>
              <p className="text-[12px] text-muted mt-1">Définissez les règles, puis générez des cartes pour vos clients.</p>
            </motion.button>
          ) : (
            <div className="space-y-3 mb-5">
              {loyaltyTemplates.map((tpl) => {
                const cardCount = loyaltyCards.filter((c) => c.templateId === tpl.id).length;
                return (
                  <div key={tpl.id} className="bg-white rounded-2xl shadow-card-premium overflow-hidden">
                    <div className="p-4 flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[20px]" style={{ backgroundColor: tpl.color + "20" }}>
                        {tpl.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground">{tpl.name}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {tpl.mode === "visits" ? `${tpl.goal} visites` : `${tpl.goal} points`} → {tpl.reward} · {cardCount} carte{cardCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteLoyaltyTemplate(tpl.id)} className="text-subtle p-1"><Trash2 size={14} /></motion.button>
                    </div>
                    {/* Preview bar */}
                    <div className="h-2 w-full" style={{ backgroundColor: tpl.color }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Cards section ─────────────────────────── */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-foreground">Cartes clients</h2>
            {loyaltyTemplates.length > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewCard(true)}
                className="text-[11px] font-bold text-white bg-accent px-3 py-1.5 rounded-lg flex items-center gap-1">
                <CreditCard size={12} /> Générer
              </motion.button>
            )}
          </div>

          {loyaltyCards.length === 0 ? (
            <div className="bg-white rounded-[22px] p-6 shadow-card-premium text-center">
              <CreditCard size={24} className="text-muted mx-auto mb-2" />
              <p className="text-[14px] font-bold text-foreground">Aucune carte générée</p>
              <p className="text-[12px] text-muted mt-1">Créez un programme puis générez des cartes.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {loyaltyCards.map((card) => {
                const tpl = loyaltyTemplates.find((t) => t.id === card.templateId);
                const client = getClient(card.clientId);
                if (!tpl || !client) return null;
                const effectiveProgress = autoProgress[card.id] !== undefined ? Math.max(card.progress, autoProgress[card.id]) : card.progress;
                return (
                  <motion.button key={card.id} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCard(card.id)}
                    className="w-full bg-white rounded-2xl p-4 shadow-card-interactive flex items-center gap-3.5 text-left">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-bold" style={{ backgroundColor: client.avatar }}>
                      {getInitials(client.firstName, client.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-foreground truncate">{client.firstName} {client.lastName}</p>
                      <p className="text-[11px] text-muted mt-0.5">{tpl.emoji} {tpl.name} · {effectiveProgress}/{tpl.goal}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-muted bg-border-light px-2 py-1 rounded-md tracking-wider">{card.code}</span>
                      <ChevronRight size={14} className="text-border" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Create Template Modal ═══ */}
      <Modal open={showNewTemplate} onClose={() => setShowNewTemplate(false)} title="Nouveau programme" size="large">
        <div className="space-y-4">
          {/* Preview card */}
          <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: tplForm.color }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[20px]">{tplForm.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{tplForm.mode === "visits" ? "FIDÉLITÉ" : "POINTS"}</span>
            </div>
            <p className="text-[17px] font-bold">{tplForm.name || "Nom du programme"}</p>
            <p className="text-[11px] text-white/60 mt-1">{tplForm.goal} {tplForm.mode === "visits" ? "visites" : "points"} → {tplForm.reward}</p>
          </div>

          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Nom du programme</label>
            <input value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} placeholder="Ex : Carte Fidélité" className="input-field" /></div>

          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Couleur</label>
            <div className="flex gap-3">{CARD_COLORS.map((c) => (
              <motion.button key={c} whileTap={{ scale: 0.9 }} onClick={() => setTplForm({ ...tplForm, color: c })}
                className={`w-10 h-10 rounded-full ${tplForm.color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`} style={{ backgroundColor: c }} />
            ))}</div></div>

          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Icône</label>
            <div className="flex gap-2 flex-wrap">{EMOJIS.map((e) => (
              <motion.button key={e} whileTap={{ scale: 0.9 }} onClick={() => setTplForm({ ...tplForm, emoji: e })}
                className={`w-10 h-10 rounded-xl text-[18px] flex items-center justify-center ${tplForm.emoji === e ? "bg-accent-soft ring-1 ring-accent" : "bg-border-light"}`}>{e}</motion.button>
            ))}</div></div>

          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Type</label>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setTplForm({ ...tplForm, mode: "visits" })} className={`flex-1 py-3 rounded-xl text-[13px] font-bold ${tplForm.mode === "visits" ? "bg-accent text-white" : "bg-border-light text-muted"}`}>Visites</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setTplForm({ ...tplForm, mode: "points" })} className={`flex-1 py-3 rounded-xl text-[13px] font-bold ${tplForm.mode === "points" ? "bg-accent text-white" : "bg-border-light text-muted"}`}>Points</motion.button>
            </div></div>

          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Objectif</label>
            <div className="flex gap-2">{(tplForm.mode === "visits" ? ["5", "8", "10", "15", "20"] : ["50", "100", "200", "500"]).map((n) => (
              <motion.button key={n} whileTap={{ scale: 0.9 }} onClick={() => setTplForm({ ...tplForm, goal: n })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${tplForm.goal === n ? "bg-accent text-white" : "bg-border-light text-muted"}`}>{n}</motion.button>
            ))}</div></div>

          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Récompense</label>
            <input value={tplForm.reward} onChange={(e) => setTplForm({ ...tplForm, reward: e.target.value })} className="input-field" /></div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateTemplate}
            className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold fab-shadow flex items-center justify-center gap-2">
            <Sparkles size={16} /> Créer le programme
          </motion.button>
        </div>
      </Modal>

      {/* ═══ Generate Card Modal ═══ */}
      <Modal open={showNewCard} onClose={() => setShowNewCard(false)} title="Générer une carte">
        <div className="space-y-4">
          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Programme</label>
            <select value={cardForm.templateId} onChange={(e) => setCardForm({ ...cardForm, templateId: e.target.value })} className="input-field">
              <option value="">-- Choisir --</option>
              {loyaltyTemplates.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
            </select></div>

          <div><label className="text-[12px] text-muted font-semibold mb-1.5 block">Client</label>
            <select value={cardForm.clientId} onChange={(e) => setCardForm({ ...cardForm, clientId: e.target.value })} className="input-field">
              <option value="">-- Choisir --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select></div>

          {cardForm.templateId && cardForm.clientId && (() => {
            const tpl = loyaltyTemplates.find((t) => t.id === cardForm.templateId);
            const cl = getClient(cardForm.clientId);
            if (!tpl || !cl) return null;
            return (
              <div className="bg-border-light rounded-2xl p-4">
                <p className="text-[12px] font-bold text-foreground mb-1">Aperçu</p>
                <div className="rounded-xl p-3 text-white text-[12px]" style={{ backgroundColor: tpl.color }}>
                  <p className="font-bold">{tpl.emoji} {tpl.name}</p>
                  <p className="text-white/70 mt-0.5">{cl.firstName} {cl.lastName} · {tpl.goal} {tpl.mode === "visits" ? "visites" : "pts"}</p>
                </div>
                <p className="text-[10px] text-muted mt-2">Un code unique sera généré automatiquement.</p>
              </div>
            );
          })()}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateCard}
            disabled={!cardForm.templateId || !cardForm.clientId}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 ${cardForm.templateId && cardForm.clientId ? "bg-accent-gradient text-white fab-shadow" : "bg-border-light text-muted"}`}>
            <CreditCard size={16} /> Générer la carte
          </motion.button>
        </div>
      </Modal>

      {/* ═══ Card Detail Modal ═══ */}
      <Modal open={!!viewedCard} onClose={() => setSelectedCard(null)} title="Détails carte">
        {viewedCard && viewedTemplate && viewedClient && (() => {
          const effectiveProgress = autoProgress[viewedCard.id] !== undefined ? Math.max(viewedCard.progress, autoProgress[viewedCard.id]) : viewedCard.progress;
          return (
            <div className="space-y-4">
              {/* Card visual */}
              <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: viewedTemplate.color }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[18px]">{viewedTemplate.emoji}</span>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{viewedTemplate.mode === "visits" ? "FIDÉLITÉ" : "POINTS"}</span>
                </div>
                <p className="text-[16px] font-bold">{viewedTemplate.name}</p>
                <p className="text-[12px] text-white/60 mt-0.5">{viewedClient.firstName} {viewedClient.lastName}</p>
                <div className="flex items-end justify-between mt-4">
                  <p className="text-[24px] font-bold">{effectiveProgress}/{viewedTemplate.goal}</p>
                  <p className="text-[10px] text-white/50 tracking-wider">{viewedCard.code}</p>
                </div>
                {viewedTemplate.mode === "visits" && (
                  <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${Math.min((effectiveProgress / viewedTemplate.goal) * 100, 100)}%` }} />
                  </div>
                )}
              </div>

              {/* Code share */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-border-light rounded-xl px-4 py-3 text-[15px] font-bold text-foreground tracking-wider text-center">{viewedCard.code}</div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => copyCode(viewedCard.code)}
                  className={`px-4 py-3 rounded-xl text-[12px] font-bold ${copied === viewedCard.code ? "bg-success text-white" : "bg-accent text-white"}`}>
                  {copied === viewedCard.code ? <><Check size={13} /> Copié</> : <><Copy size={13} /> Copier</>}
                </motion.button>
              </div>
              <p className="text-[10px] text-muted text-center">Le client entre ce code dans son app pour voir sa carte.</p>

              {/* Manual controls */}
              <div className="bg-border-light rounded-2xl p-4">
                <p className="text-[12px] font-bold text-foreground mb-3">Progression manuelle</p>
                <div className="flex items-center justify-center gap-4">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateLoyaltyCard(viewedCard.id, { progress: Math.max(0, viewedCard.progress - 1) })}
                    className="w-11 h-11 rounded-xl bg-white shadow-sm-apple flex items-center justify-center text-[18px] font-bold text-muted">−</motion.button>
                  <div className="text-center w-20">
                    <p className="text-[22px] font-bold text-foreground">{effectiveProgress}</p>
                    <p className="text-[10px] text-muted">{viewedTemplate.mode === "visits" ? "visites" : "points"}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateLoyaltyCard(viewedCard.id, { progress: viewedCard.progress + 1 })}
                    className="w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center text-[18px] font-bold">+</motion.button>
                </div>
                {viewedTemplate.mode === "visits" && autoProgress[viewedCard.id] !== undefined && (
                  <p className="text-[10px] text-accent text-center mt-2">Auto : {autoProgress[viewedCard.id]} RDV terminés détectés.</p>
                )}
              </div>

              {/* Info */}
              <div className="bg-border-light rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-[13px]"><span className="text-muted">Récompense</span><span className="font-semibold">{viewedTemplate.reward}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted">Créée le</span><span className="font-semibold">{new Date(viewedCard.createdAt).toLocaleDateString("fr-FR")}</span></div>
              </div>

              {effectiveProgress >= viewedTemplate.goal && (
                <div className="bg-success-soft rounded-2xl p-4 text-center">
                  <CheckCircle2 size={24} className="text-success mx-auto mb-2" />
                  <p className="text-[14px] font-bold text-success">Récompense débloquée !</p>
                  <p className="text-[12px] text-muted mt-1">{viewedTemplate.reward}</p>
                </div>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { deleteLoyaltyCard(viewedCard.id); setSelectedCard(null); }}
                className="w-full text-danger text-[12px] py-2 flex items-center justify-center gap-1.5 opacity-40 hover:opacity-60">
                <Trash2 size={12} /> Supprimer cette carte
              </motion.button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
