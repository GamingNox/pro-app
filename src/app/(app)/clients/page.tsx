"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import Modal from "@/components/Modal";
import Link from "next/link";
import {
  Plus, Search, Phone, Mail, FileText, CalendarDays, CreditCard,
  ChevronRight, Trash2, UserPlus, Edit3, CheckCircle2, XCircle, Clock,
} from "lucide-react";

type Sort = "recent" | "alpha" | "frequent";
type ProfileTab = "history" | "payments";

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, getClientAppointments, getClientInvoices, appointments, invoices } = useApp();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>("history");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", notes: "" });

  useEffect(() => { if (searchParams.get("new") === "1") setShowNew(true); }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...clients];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => `${c.firstName} ${c.lastName} ${c.phone} ${c.email}`.toLowerCase().includes(q));
    }
    if (sort === "alpha") list.sort((a, b) => a.lastName.localeCompare(b.lastName));
    else if (sort === "frequent") list.sort((a, b) => appointments.filter((x) => x.clientId === b.id).length - appointments.filter((x) => x.clientId === a.id).length);
    else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [clients, search, sort, appointments]);

  const selected = selectedId ? clients.find((c) => c.id === selectedId) : null;
  const selAppts = selectedId ? getClientAppointments(selectedId) : [];
  const selInvoices = selectedId ? getClientInvoices(selectedId) : [];
  const totalSpent = selInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = selInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);

  function handleSubmit() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    addClient({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim(), email: form.email.trim(), notes: form.notes.trim() });
    setShowNew(false);
    setForm({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
  }

  function saveNotes() {
    if (selectedId) {
      updateClient(selectedId, { notes: notesDraft });
      setEditingNotes(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <header className="px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Clients</h1>
          <p className="text-[12px] text-muted">{clients.length} enregistré{clients.length !== 1 && "s"}</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNew(true)}
          className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center fab-shadow">
          <Plus size={18} strokeWidth={2} />
        </motion.button>
      </header>

      {/* Search */}
      <div className="px-6 pb-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client..."
            className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-[14px] placeholder:text-subtle shadow-sm-apple focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all" />
        </div>
      </div>

      {/* Sort pills */}
      <div className="px-6 pb-3 flex gap-1.5">
        {(["recent", "alpha", "frequent"] as Sort[]).map((s) => (
          <button key={s} onClick={() => setSort(s)}
            className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
              sort === s ? "bg-foreground text-white" : "bg-white text-muted shadow-sm-apple"
            }`}>
            {s === "recent" ? "Récents" : s === "alpha" ? "A → Z" : "Fréquents"}
          </button>
        ))}
      </div>

      {/* Client list */}
      <div className="flex-1 custom-scroll px-6 pb-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-apple text-center mt-2">
            <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
              <UserPlus size={24} className="text-accent" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">{search ? "Aucun résultat" : "Aucun client"}</p>
            <p className="text-[12px] text-muted mb-4">{search ? "Essayez un autre terme." : "Ajoutez votre premier client."}</p>
            {!search && (
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNew(true)}
                className="inline-flex items-center gap-1.5 bg-accent text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl">
                <Plus size={15} />
                Ajouter un client
              </motion.button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((client, i) => {
              const apptCount = appointments.filter((a) => a.clientId === client.id).length;
              return (
                <motion.button key={client.id}
                  initial={{ y: 3 }} animate={{ y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => { setSelectedId(client.id); setProfileTab("history"); setEditingNotes(false); }}
                  className="bg-white rounded-2xl p-3.5 shadow-sm-apple flex items-center gap-3.5 text-left w-full tap-scale">
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white text-[14px] font-bold shadow-sm" style={{ backgroundColor: client.avatar }}>
                    {getInitials(client.firstName, client.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{client.firstName} {client.lastName}</p>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {apptCount > 0 ? `${apptCount} RDV` : ""}
                      {apptCount > 0 && (client.phone || client.email) ? " · " : ""}
                      {client.phone || client.email || (apptCount === 0 ? "Pas de contact" : "")}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-border flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* New client modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouveau client">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[["Prénom", "firstName", "Marie"], ["Nom", "lastName", "Dupont"]].map(([label, key, ph]) => (
              <div key={key}>
                <label className="text-[12px] text-muted font-medium mb-1.5 block">{label}</label>
                <input value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={ph} className="input-field" />
              </div>
            ))}
          </div>
          {[["Téléphone", "phone", "06 12 34 56 78", "tel"], ["Email", "email", "marie@email.com", "email"]].map(([label, key, ph, type]) => (
            <div key={key}>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">{label}</label>
              <input value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph} type={type} className="input-field" />
            </div>
          ))}
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optionnel..." rows={2} className="input-field resize-none" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold shadow-sm">
            Ajouter le client
          </motion.button>
        </div>
      </Modal>

      {/* Client profile modal */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="Fiche client" size="large">
        {selected && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-apple" style={{ backgroundColor: selected.avatar }}>
                {getInitials(selected.firstName, selected.lastName)}
              </div>
              <div className="flex-1">
                <p className="text-[18px] font-bold text-foreground">{selected.firstName} {selected.lastName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[12px] text-muted">{selAppts.length} RDV</span>
                  <span className="text-[12px] text-success font-medium">{totalSpent.toFixed(0)} € payé</span>
                  {totalPending > 0 && <span className="text-[12px] text-warning font-medium">{totalPending.toFixed(0)} € en attente</span>}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <Link href="/appointments?new=1" className="flex-1" onClick={() => setSelectedId(null)}>
                <motion.div whileTap={{ scale: 0.96 }} className="bg-accent text-white rounded-xl py-2.5 text-center">
                  <p className="text-[11px] font-semibold">+ RDV</p>
                </motion.div>
              </Link>
              <Link href="/finances?new=1" className="flex-1" onClick={() => setSelectedId(null)}>
                <motion.div whileTap={{ scale: 0.96 }} className="bg-foreground text-white rounded-xl py-2.5 text-center">
                  <p className="text-[11px] font-semibold">+ Facture</p>
                </motion.div>
              </Link>
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="flex-1">
                  <motion.div whileTap={{ scale: 0.96 }} className="bg-success-soft rounded-xl py-2.5 text-center">
                    <p className="text-[11px] font-semibold text-success">Appeler</p>
                  </motion.div>
                </a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex-1">
                  <motion.div whileTap={{ scale: 0.96 }} className="bg-border-light rounded-xl py-2.5 text-center">
                    <p className="text-[11px] font-semibold text-foreground">Email</p>
                  </motion.div>
                </a>
              )}
            </div>

            {/* Contact info */}
            <div className="bg-border-light rounded-2xl p-4 space-y-2.5">
              {selected.phone && (
                <div className="flex items-center gap-3 text-[13px]">
                  <Phone size={14} className="text-muted" /><span className="font-medium">{selected.phone}</span>
                </div>
              )}
              {selected.email && (
                <div className="flex items-center gap-3 text-[13px]">
                  <Mail size={14} className="text-muted" /><span className="font-medium">{selected.email}</span>
                </div>
              )}
            </div>

            {/* Notes section */}
            <div className="bg-border-light rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] text-muted font-medium flex items-center gap-1.5">
                  <FileText size={12} /> Notes
                </p>
                {!editingNotes ? (
                  <button onClick={() => { setNotesDraft(selected.notes); setEditingNotes(true); }}
                    className="text-[11px] text-accent font-medium flex items-center gap-1">
                    <Edit3 size={10} /> Modifier
                  </button>
                ) : (
                  <button onClick={saveNotes}
                    className="text-[11px] text-accent font-semibold">
                    Enregistrer
                  </button>
                )}
              </div>
              {editingNotes ? (
                <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/15 resize-none transition-all"
                  rows={3} placeholder="Ajouter des notes..." autoFocus />
              ) : (
                <p className="text-[13px] text-foreground/70 leading-relaxed">
                  {selected.notes || "Aucune note. Appuyez sur Modifier pour en ajouter."}
                </p>
              )}
            </div>

            {/* Timeline tabs */}
            <div>
              <div className="segment-control mb-3">
                <button onClick={() => setProfileTab("history")}
                  className={`segment-btn flex-1 ${profileTab === "history" ? "segment-btn-active" : ""}`}>
                  Rendez-vous ({selAppts.length})
                </button>
                <button onClick={() => setProfileTab("payments")}
                  className={`segment-btn flex-1 ${profileTab === "payments" ? "segment-btn-active" : ""}`}>
                  Paiements ({selInvoices.length})
                </button>
              </div>

              {profileTab === "history" && (
                <>
                  {selAppts.length === 0 ? (
                    <p className="text-[12px] text-subtle text-center py-6">Aucun rendez-vous</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selAppts.slice(0, 10).map((a) => (
                        <div key={a.id} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-3 shadow-sm-apple">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              a.status === "done" ? "bg-success-soft" : a.status === "canceled" ? "bg-danger-soft" : "bg-accent-soft"
                            }`}>
                              {a.status === "done" ? <CheckCircle2 size={14} className="text-success" /> :
                                a.status === "canceled" ? <XCircle size={14} className="text-danger" /> :
                                <Clock size={14} className="text-accent" />}
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-foreground">{a.title}</p>
                              <p className="text-[10px] text-muted">
                                {new Date(a.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })} · {a.time}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {a.price > 0 && <p className="text-[12px] font-semibold text-foreground">{a.price} €</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {profileTab === "payments" && (
                <>
                  {selInvoices.length === 0 ? (
                    <p className="text-[12px] text-subtle text-center py-6">Aucun paiement</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selInvoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-3 shadow-sm-apple">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              inv.status === "paid" ? "bg-success-soft" : "bg-warning-soft"
                            }`}>
                              {inv.status === "paid" ? <CheckCircle2 size={14} className="text-success" /> :
                                <Clock size={14} className="text-warning" />}
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-foreground">{inv.description}</p>
                              <p className="text-[10px] text-muted">
                                {new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-[13px] font-bold ${inv.status === "paid" ? "text-success" : "text-warning"}`}>
                              {inv.amount} €
                            </p>
                            <p className="text-[9px] text-muted">{inv.status === "paid" ? "Payé" : "En attente"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <button onClick={() => { deleteClient(selected.id); setSelectedId(null); }}
              className="w-full text-danger text-[12px] py-2 flex items-center justify-center gap-1.5 opacity-40 hover:opacity-60 transition-opacity">
              <Trash2 size={12} />
              Supprimer ce client
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
