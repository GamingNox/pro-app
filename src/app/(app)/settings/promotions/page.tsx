"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, Sparkles } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";
import Modal from "@/components/Modal";

interface Promo { id: string; name: string; type: "percent" | "fixed"; value: string; desc: string; }

export default function SettingsPromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "percent" as "percent" | "fixed", value: "", desc: "" });

  function handleAdd() {
    if (!form.name.trim() || !form.value.trim()) return;
    setPromos([...promos, { ...form, id: Date.now().toString(36) }]);
    setForm({ name: "", type: "percent", value: "", desc: "" });
    setShowAdd(false);
  }

  function handleDelete(id: string) {
    setPromos(promos.filter((p) => p.id !== id));
  }

  return (
    <SettingsPage category="Marketing" title="Gestionnaire de Promotions"
      description="Créez des offres pour attirer de nouveaux clients et fidéliser les existants.">

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
        className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-5">
        <Plus size={16} /> Créer une offre
      </motion.button>

      {/* Active promos */}
      {promos.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-5">
          <Tag size={32} className="text-muted mx-auto mb-3" />
          <p className="text-[16px] font-bold text-foreground">Aucune promotion</p>
          <p className="text-[12px] text-muted mt-1.5 max-w-[240px] mx-auto leading-relaxed">
            Créez votre première offre pour commencer à attirer des clients.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {promos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[16px] font-bold text-foreground">{p.name}</p>
                  <p className="text-[13px] text-accent font-bold mt-0.5">
                    {p.type === "percent" ? `-${p.value}%` : `-${p.value}€`}
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(p.id)}
                  className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center"><Trash2 size={12} className="text-danger" /></motion.button>
              </div>
              {p.desc && <p className="text-[11px] text-muted">{p.desc}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Ideas */}
      <SettingsSection title="Idées d'offres">
        <div className="space-y-3">
          {[
            { title: "Offre heures creuses", desc: "Attirez des clients pendant vos créneaux moins demandés." },
            { title: "Offre duo", desc: "Encouragez les réservations à deux avec une remise groupée." },
          ].map((o) => (
            <div key={o.title} className="bg-border-light rounded-xl p-3.5">
              <p className="text-[13px] font-bold text-foreground">{o.title}</p>
              <p className="text-[11px] text-muted mt-0.5">{o.desc}</p>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nouvelle promotion">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom de l&apos;offre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Happy Hour" className="input-field" />
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Type de réduction</label>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setForm({ ...form, type: "percent" })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${form.type === "percent" ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                Pourcentage (%)
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setForm({ ...form, type: "fixed" })}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${form.type === "fixed" ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                Montant fixe (€)
              </motion.button>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Valeur</label>
            <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={form.type === "percent" ? "Ex: 20" : "Ex: 10"} className="input-field" />
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={2} placeholder="Optionnel" className="input-field resize-none" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd} disabled={!form.name.trim() || !form.value.trim()}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold ${form.name.trim() && form.value.trim() ? "bg-accent text-white fab-shadow" : "bg-border-light text-muted"}`}>
            Créer l&apos;offre
          </motion.button>
        </div>
      </Modal>
    </SettingsPage>
  );
}
