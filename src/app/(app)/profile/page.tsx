"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { APP_NAME } from "@/lib/constants";
import Modal from "@/components/Modal";
import Link from "next/link";
import {
  User, Edit3, CalendarDays, Users, Wallet, Package, Settings, HelpCircle,
  LogOut, ChevronRight, Save, Crown, Phone, Mail, Link2, Copy, Check,
  Plus, Trash2, Clock, Briefcase, FileText, Shield,
} from "lucide-react";

export default function ProfilePage() {
  const {
    user, updateUser, clients, appointments, invoices, products, getMonthRevenue,
    services, addService, updateService, deleteService,
  } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: user.name, business: user.business, phone: user.phone, email: user.email });
  const [svcForm, setSvcForm] = useState({ name: "", duration: "60", price: "", description: "" });

  const stats = [
    { label: "Clients", value: clients.length, icon: Users, color: "bg-accent-soft", iconColor: "text-accent" },
    { label: "RDV", value: appointments.length, icon: CalendarDays, color: "bg-success-soft", iconColor: "text-success" },
    { label: "Factures", value: invoices.length, icon: Wallet, color: "bg-warning-soft", iconColor: "text-warning" },
    { label: "Produits", value: products.length, icon: Package, color: "bg-info-soft", iconColor: "text-info" },
  ];

  const bookingUrl = user.bookingSlug ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${user.bookingSlug}` : null;

  function handleSave() {
    updateUser({ name: form.name.trim(), business: form.business.trim(), phone: form.phone.trim(), email: form.email.trim() });
    setShowEdit(false);
  }

  function handleAddService() {
    if (!svcForm.name.trim()) return;
    addService({ name: svcForm.name.trim(), duration: parseInt(svcForm.duration) || 60, price: parseFloat(svcForm.price) || 0, description: svcForm.description.trim(), active: true });
    setShowServiceModal(false);
    setSvcForm({ name: "", duration: "60", price: "", description: "" });
  }

  function copyBookingLink() {
    if (bookingUrl) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex-1 custom-scroll animate-in">
      {/* Avatar */}
      <div className="px-6 pt-8 pb-5 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-[80px] h-[80px] rounded-[22px] bg-foreground flex items-center justify-center mb-3 shadow-apple-lg">
          <User size={32} className="text-white" />
        </motion.div>
        <h2 className="text-[20px] font-bold text-foreground tracking-tight">{user.name || APP_NAME}</h2>
        {user.business && <p className="text-[13px] text-muted mt-0.5">{user.business}</p>}
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => { setForm({ name: user.name, business: user.business, phone: user.phone, email: user.email }); setShowEdit(true); }}
          className="mt-3 text-[12px] text-accent font-semibold flex items-center gap-1.5 bg-accent-soft px-4 py-2 rounded-xl">
          <Edit3 size={12} /> Modifier
        </motion.button>
      </div>

      {/* Booking link */}
      {bookingUrl && (
        <div className="px-6 pb-5">
          <div className="bg-white rounded-2xl p-4 shadow-apple">
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={14} className="text-accent" />
              <p className="text-[13px] font-semibold text-foreground">Lien de réservation</p>
            </div>
            <p className="text-[11px] text-muted mb-3">Partagez ce lien pour que vos clients réservent en ligne.</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-border-light rounded-xl px-3 py-2.5 text-[11px] text-muted truncate">{bookingUrl}</div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={copyBookingLink}
                className={`px-3 py-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 ${copied ? "bg-success text-white" : "bg-accent text-white"}`}>
                {copied ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="px-6 pb-5">
        <div className="bg-white rounded-2xl p-4 shadow-apple">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-foreground">Activité</p>
            <span className="text-[12px] text-accent font-bold">{getMonthRevenue().toFixed(0)} € / mois</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="text-center">
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-1.5`}>
                    <Icon size={16} className={s.iconColor} />
                  </div>
                  <p className="text-[17px] font-bold text-foreground leading-none">{s.value}</p>
                  <p className="text-[9px] text-muted mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Services management */}
      <div className="px-6 pb-5">
        <div className="bg-white rounded-2xl p-4 shadow-apple">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-accent" />
              <p className="text-[13px] font-bold text-foreground">Mes services</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowServiceModal(true)}
              className="text-[11px] text-accent font-semibold flex items-center gap-0.5"><Plus size={13} /> Ajouter</motion.button>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[12px] text-muted">Aucun service configuré.</p>
              <p className="text-[11px] text-subtle">Ajoutez vos services pour la réservation en ligne.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {services.map((svc) => (
                <div key={svc.id} className="flex items-center justify-between bg-border-light rounded-xl px-3.5 py-3">
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">{svc.name}</p>
                    <p className="text-[10px] text-muted">{svc.duration}min · {svc.price} €</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => deleteService(svc.id)} className="text-subtle"><Trash2 size={13} /></motion.button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact info */}
      {(user.phone || user.email) && (
        <div className="px-6 pb-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm-apple space-y-2.5">
            {user.phone && (
              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center"><Phone size={14} className="text-muted" /></div>
                <div><p className="text-[10px] text-muted">Téléphone</p><p className="font-medium">{user.phone}</p></div>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center"><Mail size={14} className="text-muted" /></div>
                <div><p className="text-[10px] text-muted">Email</p><p className="font-medium">{user.email}</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="px-6 pb-5">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm-apple">
          {[
            { label: "Abonnement", icon: Crown, href: "/subscription", iconColor: "text-warning" },
            { label: "Paramètres", icon: Settings, iconColor: "text-muted" },
            { label: "Aide", icon: HelpCircle, iconColor: "text-muted" },
            { label: "Déconnexion", icon: LogOut, danger: true, iconColor: "text-danger" },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            const inner = (
              <motion.div whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-border-light" : ""}`}>
                <div className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center"><Icon size={15} className={item.iconColor} /></div>
                <span className={`text-[13px] font-medium flex-1 ${item.danger ? "text-danger" : "text-foreground"}`}>{item.label}</span>
                <ChevronRight size={14} className="text-border" />
              </motion.div>
            );
            return item.href ? <Link key={item.label} href={item.href}>{inner}</Link> : <button key={item.label} className="w-full text-left">{inner}</button>;
          })}
        </div>
      </div>

      {/* Legal footer */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-center gap-4">
          {["Mentions légales", "Conditions", "Confidentialité"].map((label) => (
            <button key={label} className="text-[10px] text-subtle">{label}</button>
          ))}
        </div>
      </div>

      {/* Edit profile modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier le profil">
        <div className="space-y-4">
          {[
            ["Nom", "name", "Votre nom", "text"],
            ["Activité", "business", "Coach, prothésiste, freelance...", "text"],
            ["Téléphone", "phone", "06 12 34 56 78", "tel"],
            ["Email", "email", "marie@email.com", "email"],
          ].map(([l, k, ph, type]) => (
            <div key={k}>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">{l}</label>
              <input value={(form as Record<string, string>)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                placeholder={ph} type={type} className="input-field" />
            </div>
          ))}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2">
            <Save size={15} /> Enregistrer
          </motion.button>
        </div>
      </Modal>

      {/* Add service modal */}
      <Modal open={showServiceModal} onClose={() => setShowServiceModal(false)} title="Nouveau service">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Nom du service</label>
            <input value={svcForm.name} onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })} placeholder="Ex : Manucure gel" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Durée (min)</label>
              <div className="flex gap-1.5">
                {["30", "45", "60", "90"].map((d) => (
                  <button key={d} onClick={() => setSvcForm({ ...svcForm, duration: d })}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-semibold ${svcForm.duration === d ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Prix (€)</label>
              <input type="number" value={svcForm.price} onChange={(e) => setSvcForm({ ...svcForm, price: e.target.value })} placeholder="0" className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Description (optionnel)</label>
            <textarea value={svcForm.description} onChange={(e) => setSvcForm({ ...svcForm, description: e.target.value })}
              placeholder="Décrivez le service..." rows={2} className="input-field resize-none" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddService}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold">Ajouter le service</motion.button>
        </div>
      </Modal>
    </div>
  );
}
