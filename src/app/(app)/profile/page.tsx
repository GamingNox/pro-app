"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { APP_NAME } from "@/lib/constants";
import Modal from "@/components/Modal";
import Link from "next/link";
import {
  User, Edit3, CalendarDays, Users, Wallet, Package,
  Settings, HelpCircle, LogOut, ChevronRight, Save, Crown,
  Phone, Mail,
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser, clients, appointments, invoices, products, getMonthRevenue } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ name: user.name, business: user.business, phone: user.phone, email: user.email });

  const stats = [
    { label: "Clients", value: clients.length, icon: Users, color: "bg-accent-soft", iconColor: "text-accent" },
    { label: "RDV", value: appointments.length, icon: CalendarDays, color: "bg-success-soft", iconColor: "text-success" },
    { label: "Factures", value: invoices.length, icon: Wallet, color: "bg-warning-soft", iconColor: "text-warning" },
    { label: "Produits", value: products.length, icon: Package, color: "bg-info-soft", iconColor: "text-info" },
  ];

  function handleSave() {
    updateUser({ name: form.name.trim(), business: form.business.trim(), phone: form.phone.trim(), email: form.email.trim() });
    setShowEdit(false);
  }

  return (
    <div className="flex-1 custom-scroll animate-in">
      {/* Avatar section */}
      <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-[88px] h-[88px] rounded-[24px] bg-foreground flex items-center justify-center mb-4 shadow-apple-lg"
        >
          <User size={36} className="text-white" />
        </motion.div>
        <h2 className="text-[20px] font-bold text-foreground tracking-tight">{user.name || APP_NAME}</h2>
        {user.business && <p className="text-[13px] text-muted mt-1">{user.business}</p>}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setForm({ name: user.name, business: user.business, phone: user.phone, email: user.email }); setShowEdit(true); }}
          className="mt-3 text-[12px] text-accent font-semibold flex items-center gap-1.5 bg-accent-soft px-4 py-2 rounded-xl"
        >
          <Edit3 size={12} /> Modifier le profil
        </motion.button>
      </div>

      {/* Upgrade CTA */}
      <div className="px-6 pb-5">
        <Link href="/subscription">
          <motion.div whileTap={{ scale: 0.97 }}
            className="bg-foreground rounded-2xl p-4 flex items-center gap-3.5 shadow-apple-lg">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              <Crown size={20} className="text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-white">Passer au Pro</p>
              <p className="text-[11px] text-white/60 mt-0.5">Débloquez toutes les fonctionnalités</p>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </motion.div>
        </Link>
      </div>

      {/* Stats */}
      <div className="px-6 pb-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-apple"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-bold text-foreground">Activité</p>
            <span className="text-[13px] text-accent font-bold">{getMonthRevenue().toFixed(0)} € / mois</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="text-center"
                >
                  <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                    <Icon size={17} className={s.iconColor} />
                  </div>
                  <p className="text-[18px] font-bold text-foreground leading-none">{s.value}</p>
                  <p className="text-[9px] text-muted mt-1">{s.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Contact info */}
      {(user.phone || user.email) && (
        <div className="px-6 pb-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm-apple space-y-3">
            {user.phone && (
              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center">
                  <Phone size={14} className="text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted">Téléphone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center">
                  <Mail size={14} className="text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="px-6 pb-8">
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
                className={`flex items-center gap-3.5 px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-border-light" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center">
                  <Icon size={16} className={item.iconColor} />
                </div>
                <span className={`text-[13px] font-medium flex-1 ${item.danger ? "text-danger" : "text-foreground"}`}>
                  {item.label}
                </span>
                <ChevronRight size={14} className="text-border" />
              </motion.div>
            );
            return item.href ? <Link key={item.label} href={item.href}>{inner}</Link> : <button key={item.label} className="w-full text-left">{inner}</button>;
          })}
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
              <input value={(form as Record<string, string>)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                placeholder={ph} type={type} className="input-field" />
            </div>
          ))}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm">
            <Save size={15} /> Enregistrer
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
