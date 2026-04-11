"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, CreditCard, Globe, Sparkles, Trash2, Edit3, X } from "lucide-react";
import SettingsPage, { SettingsToggle } from "@/components/SettingsPage";
import Modal from "@/components/Modal";
import Link from "next/link";

export default function SettingsServicesPage() {
  const { services, addService, updateService, deleteService } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", duration: "60", price: "50", description: "" });

  function resetForm() { setForm({ name: "", duration: "60", price: "50", description: "" }); }

  async function handleAdd() {
    if (!form.name.trim()) return;
    await addService({ name: form.name.trim(), duration: parseInt(form.duration) || 60, price: parseFloat(form.price) || 0, description: form.description.trim(), active: true });
    resetForm();
    setShowAdd(false);
  }

  function startEdit(id: string) {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    setForm({ name: svc.name, duration: String(svc.duration), price: String(svc.price), description: svc.description });
    setEditId(id);
    setShowAdd(true);
  }

  function handleEdit() {
    if (!editId || !form.name.trim()) return;
    updateService(editId, { name: form.name.trim(), duration: parseInt(form.duration) || 60, price: parseFloat(form.price) || 0, description: form.description.trim() });
    resetForm();
    setEditId(null);
    setShowAdd(false);
  }

  function handleToggle(id: string, active: boolean) {
    updateService(id, { active: !active });
  }

  function handleDelete(id: string) {
    deleteService(id);
  }

  return (
    <SettingsPage category="Catalogue" title="Gestion des Services"
      description="Organisez votre catalogue de prestations. Définissez vos tarifs, durées et visibilité pour la réservation en ligne.">

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { resetForm(); setEditId(null); setShowAdd(true); }}
        className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-5">
        <Plus size={16} /> Nouveau service
      </motion.button>

      <div className="space-y-3 mb-5">
        {services.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
            <Sparkles size={28} className="text-muted mx-auto mb-3" />
            <p className="text-[15px] font-bold text-foreground">Aucun service</p>
            <p className="text-[12px] text-muted mt-1">Créez votre premier service pour commencer.</p>
          </div>
        ) : (
          services.map((svc) => (
            <div key={svc.id} className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-[16px] font-bold text-foreground">{svc.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[12px] text-muted flex items-center gap-1"><Clock size={12} /> {svc.duration} min</span>
                    <span className="text-[12px] text-muted flex items-center gap-1"><CreditCard size={12} /> {svc.price} €</span>
                  </div>
                </div>
                <SettingsToggle on={svc.active} onToggle={() => handleToggle(svc.id, svc.active)} />
              </div>
              {svc.description && <p className="text-[11px] text-muted mb-2">{svc.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-border-light">
                <div className="flex items-center gap-2">
                  <Globe size={12} className={svc.active ? "text-accent" : "text-muted"} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${svc.active ? "text-accent" : "text-muted"}`}>
                    {svc.active ? "En ligne" : "Hors ligne"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => startEdit(svc.id)}
                    className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center"><Edit3 size={13} className="text-muted" /></motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(svc.id)}
                    className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center"><Trash2 size={13} className="text-danger" /></motion.button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Premium CTA */}
      <Link href="/subscription">
        <div className="bg-accent-gradient rounded-2xl p-5 text-white text-center mb-5">
          <Sparkles size={22} className="text-white/80 mx-auto mb-2" />
          <p className="text-[15px] font-bold">Boostez votre visibilité avec le pack Premium</p>
          <p className="text-[11px] text-white/70 mt-1 leading-relaxed">Indexation prioritaire et badges de certification.</p>
        </div>
      </Link>

      {/* Add/Edit modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditId(null); }} title={editId ? "Modifier le service" : "Nouveau service"}>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom du service</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Consultation" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Durée (min)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Prix (€)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optionnel" className="input-field resize-none" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={editId ? handleEdit : handleAdd}
            disabled={!form.name.trim()}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold ${form.name.trim() ? "bg-accent text-white fab-shadow" : "bg-border-light text-muted"}`}>
            {editId ? "Enregistrer" : "Créer le service"}
          </motion.button>
        </div>
      </Modal>
    </SettingsPage>
  );
}
