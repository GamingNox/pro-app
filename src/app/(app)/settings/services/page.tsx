"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  CreditCard,
  Sparkles,
  Trash2,
  Edit3,
  X,
  Check,
  Eye,
  EyeOff,
  Tag,
  FileText,
  Lock,
} from "lucide-react";
import SettingsPage, {
  SettingsToggle,
  PrimaryButton,
} from "@/components/SettingsPage";
import Link from "next/link";
import { tabContentVariants, tabContentTransition } from "@/lib/motion";

// ── Extra fields persisted locally (not in Service schema) ─────────────
interface ServiceMeta {
  notes: string;
  category: string;
  published: boolean;
}
const DEFAULT_META: ServiceMeta = { notes: "", category: "Prestation", published: true };

function metaKey(id: string) {
  return `services_meta_${id}`;
}
function loadMeta(id: string): ServiceMeta {
  if (typeof window === "undefined") return DEFAULT_META;
  try {
    const raw = window.localStorage.getItem(metaKey(id));
    if (!raw) return DEFAULT_META;
    return { ...DEFAULT_META, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_META;
  }
}
function saveMeta(id: string, meta: ServiceMeta) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(metaKey(id), JSON.stringify(meta));
  } catch {
    /* ignore quota */
  }
}
function deleteMeta(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(metaKey(id));
  } catch {
    /* ignore */
  }
}

const DURATION_CHIPS = [15, 30, 45, 60, 90, 120];
const CATEGORY_CHIPS = ["Prestation", "Forfait", "Consultation", "Atelier", "Autre"];

interface FormState {
  name: string;
  description: string;
  duration: string;
  price: string;
  notes: string;
  category: string;
  published: boolean;
}
const BLANK_FORM: FormState = {
  name: "",
  description: "",
  duration: "60",
  price: "50",
  notes: "",
  category: "Prestation",
  published: true,
};

export default function SettingsServicesPage() {
  const { services, addService, updateService, deleteService } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);

  // Keep a local mirror of meta for every service so list cards can read it.
  const [metaMap, setMetaMap] = useState<Record<string, ServiceMeta>>({});
  useEffect(() => {
    const next: Record<string, ServiceMeta> = {};
    services.forEach((s) => {
      next[s.id] = loadMeta(s.id);
    });
    setMetaMap(next);
  }, [services]);

  function resetForm() {
    setForm(BLANK_FORM);
  }

  function openCreate() {
    resetForm();
    setEditId(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
  }

  async function handleAdd() {
    const name = form.name.trim();
    if (!name) return;
    const duration = parseInt(form.duration) || 60;
    const price = parseFloat(form.price) || 0;
    await addService({
      name,
      duration,
      price,
      description: form.description.trim(),
      active: form.published,
    });
    // Persist extra meta on the newest service (match by name + duration +
    // price; picks the most recently-added matching record).
    setTimeout(() => {
      const match = [...services].reverse().find((s) => s.name === name);
      if (match) {
        const meta: ServiceMeta = {
          notes: form.notes.trim(),
          category: form.category,
          published: form.published,
        };
        saveMeta(match.id, meta);
        setMetaMap((m) => ({ ...m, [match.id]: meta }));
      }
    }, 50);
    resetForm();
    closeForm();
  }

  function startEdit(id: string) {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    const meta = loadMeta(id);
    setForm({
      name: svc.name,
      description: svc.description,
      duration: String(svc.duration),
      price: String(svc.price),
      notes: meta.notes,
      category: meta.category,
      published: meta.published && svc.active,
    });
    setEditId(id);
    setShowForm(true);
  }

  function handleEdit() {
    if (!editId || !form.name.trim()) return;
    updateService(editId, {
      name: form.name.trim(),
      duration: parseInt(form.duration) || 60,
      price: parseFloat(form.price) || 0,
      description: form.description.trim(),
      active: form.published,
    });
    const meta: ServiceMeta = {
      notes: form.notes.trim(),
      category: form.category,
      published: form.published,
    };
    saveMeta(editId, meta);
    setMetaMap((m) => ({ ...m, [editId]: meta }));
    resetForm();
    closeForm();
  }

  function handleDelete(id: string) {
    deleteService(id);
    deleteMeta(id);
    setMetaMap((m) => {
      const clone = { ...m };
      delete clone[id];
      return clone;
    });
  }

  const publishedCount = useMemo(
    () => services.filter((s) => (metaMap[s.id]?.published ?? true) && s.active).length,
    [services, metaMap]
  );

  return (
    <SettingsPage
      category="Catalogue"
      title="Gestion des Services"
      description="Organisez votre catalogue de prestations. Définissez vos tarifs, durées, catégories et visibilité pour la réservation en ligne."
    >
      {/* ── Summary strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Total</p>
          <p className="text-[22px] font-bold text-foreground leading-tight mt-1">{services.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Publiés</p>
          <p
            className="text-[22px] font-bold leading-tight mt-1"
            style={{ color: "var(--color-primary)" }}
          >
            {publishedCount}
          </p>
        </div>
      </div>

      {/* ── Toggle "new service" ─────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => (showForm ? closeForm() : openCreate())}
        className={`w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 mb-5 ${
          showForm ? "bg-border-light text-muted" : "text-white fab-shadow"
        }`}
        style={
          !showForm
            ? {
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                boxShadow:
                  "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
              }
            : undefined
        }
      >
        {showForm ? (
          <>
            <X size={16} /> Annuler
          </>
        ) : (
          <>
            <Plus size={16} /> Nouveau service
          </>
        )}
      </motion.button>

      {/* ── Inline form ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            key="form"
            initial={tabContentVariants.initial}
            animate={tabContentVariants.animate}
            exit={tabContentVariants.exit}
            transition={tabContentTransition}
            className="bg-white rounded-2xl p-5 shadow-card-premium mb-5"
          >
            <h3 className="text-[16px] font-bold text-foreground mb-4">
              {editId ? "Modifier le service" : "Nouveau service"}
            </h3>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                  Nom du service
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Consultation"
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value.slice(0, 200) })
                  }
                  rows={3}
                  maxLength={200}
                  placeholder="Décrivez la prestation en quelques mots..."
                  className="input-field resize-none"
                />
                <p className="text-[10px] text-muted mt-1 text-right">
                  {form.description.length} / 200
                </p>
              </div>

              {/* Duration chips */}
              <div>
                <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                  Durée
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_CHIPS.map((d) => {
                    const active = form.duration === String(d);
                    return (
                      <motion.button
                        key={d}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setForm({ ...form, duration: String(d) })}
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
                        {d} min
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
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

              {/* Category chips */}
              <div>
                <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                  Catégorie
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CATEGORY_CHIPS.map((c) => {
                    const active = form.category === c;
                    return (
                      <motion.button
                        key={c}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setForm({ ...form, category: c })}
                        className="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors"
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
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="... ou saisissez votre propre catégorie"
                  className="input-field"
                />
              </div>

              {/* Private notes */}
              <div>
                <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                  <Lock size={11} /> Notes privées
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Visible uniquement par vous"
                  className="input-field resize-none"
                />
              </div>

              {/* Visibility toggle */}
              <div
                className="flex items-center justify-between py-2 px-3 rounded-xl"
                style={{
                  background: "color-mix(in srgb, var(--color-primary-soft) 60%, white)",
                }}
              >
                <div className="flex-1 mr-3">
                  <p className="text-[13px] font-bold text-foreground">
                    Visibilité publique
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    {form.published
                      ? "Affiché sur votre page de réservation"
                      : "Masqué du public"}
                  </p>
                </div>
                <SettingsToggle
                  on={form.published}
                  onToggle={() => setForm({ ...form, published: !form.published })}
                />
              </div>

              <PrimaryButton
                onClick={editId ? handleEdit : handleAdd}
                disabled={!form.name.trim()}
              >
                <Check size={16} />{" "}
                {editId ? "Enregistrer les modifications" : "Créer le service"}
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── List ─────────────────────────────────────────────────── */}
      <div className="space-y-3 mb-5">
        {services.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
            <Sparkles size={28} className="text-muted mx-auto mb-3" />
            <p className="text-[15px] font-bold text-foreground">Aucun service</p>
            <p className="text-[12px] text-muted mt-1">
              Créez votre premier service pour commencer.
            </p>
          </div>
        ) : (
          services.map((svc) => {
            const meta = metaMap[svc.id] ?? DEFAULT_META;
            const published = meta.published && svc.active;
            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 shadow-card-premium"
              >
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-foreground truncate">
                      {svc.name}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-[12px] text-muted flex items-center gap-1">
                        <Clock size={12} className="text-accent" /> {svc.duration} min
                      </span>
                      <span className="text-[12px] text-muted flex items-center gap-1">
                        <CreditCard size={12} className="text-accent" /> {svc.price} €
                      </span>
                    </div>
                  </div>

                  {/* Visibility indicator — violet */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                    style={
                      published
                        ? {
                            background: "var(--color-primary-soft)",
                            color: "var(--color-primary)",
                          }
                        : {
                            background: "var(--color-border-light, #F4F4F5)",
                            color: "var(--color-muted, #71717A)",
                          }
                    }
                  >
                    {published ? <Eye size={11} /> : <EyeOff size={11} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {published ? "Publié" : "Masqué"}
                    </span>
                  </div>
                </div>

                {svc.description && (
                  <p className="text-[11px] text-muted mb-2 leading-relaxed">
                    {svc.description}
                  </p>
                )}

                {/* Violet category badge + private notes indicator */}
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{
                      background: "var(--color-primary-soft)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Tag size={10} /> {meta.category || "Prestation"}
                  </span>
                  {meta.notes && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{
                        background: "var(--color-primary-soft)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <FileText size={10} /> Notes
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-light">
                  <SettingsToggle
                    on={svc.active}
                    onToggle={() => {
                      updateService(svc.id, { active: !svc.active });
                      const next = { ...meta, published: !svc.active };
                      saveMeta(svc.id, next);
                      setMetaMap((m) => ({ ...m, [svc.id]: next }));
                    }}
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => startEdit(svc.id)}
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
                      onClick={() => handleDelete(svc.id)}
                      className="w-9 h-9 rounded-xl bg-danger-soft flex items-center justify-center"
                    >
                      <Trash2 size={14} className="text-danger" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

    </SettingsPage>
  );
}
