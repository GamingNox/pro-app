"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Bell, Users, CreditCard, LogOut, ChevronRight, Settings, Globe, Lock, MessageCircle } from "lucide-react";
import { useState } from "react";
import { AdminChatPanel, UnreadBadge } from "@/components/SupportChat";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [showChat, setShowChat] = useState(false);

  function handleLogout() {
    localStorage.removeItem("admin-auth");
    router.replace("/admin-login");
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[24px] font-bold text-foreground tracking-tight">Réglages</h1>
        <p className="text-[12px] text-muted mt-0.5">Configuration et contrôle de la plateforme.</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* Admin profile */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center"><Shield size={24} className="text-accent" /></div>
            <div>
              <p className="text-[16px] font-bold text-foreground">Administrateur</p>
              <p className="text-[12px] text-muted">noah.pscl.08@gmail.com</p>
              <p className="text-[10px] text-accent font-bold mt-0.5">Super Admin · Accès complet</p>
            </div>
          </div>

          {/* Settings categories */}
          <div className="space-y-3 mb-5">
            {[
              { icon: Globe, label: "Plateforme", sub: "Paramètres généraux, branding", color: "bg-accent-soft", ic: "text-accent" },
              { icon: Users, label: "Politiques utilisateurs", sub: "Règles d'inscription, vérification", color: "bg-accent-soft", ic: "text-accent" },
              { icon: CreditCard, label: "Facturation", sub: "Passerelle de paiement, tarifs", color: "bg-warning-soft", ic: "text-warning" },
              { icon: Bell, label: "Notifications", sub: "Modèles d'email, alertes push", color: "bg-border-light", ic: "text-muted" },
              { icon: Lock, label: "Sécurité", sub: "2FA, gestion des sessions", color: "bg-danger-soft", ic: "text-danger" },
              { icon: Settings, label: "Avancé", sub: "Clés API, webhooks, intégrations", color: "bg-border-light", ic: "text-muted" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.button key={i} whileTap={{ scale: 0.98 }}
                  className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5 text-left">
                  <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}><Icon size={18} className={item.ic} /></div>
                  <div className="flex-1"><p className="text-[14px] font-bold text-foreground">{item.label}</p><p className="text-[11px] text-muted mt-0.5">{item.sub}</p></div>
                  <ChevronRight size={16} className="text-border" />
                </motion.button>
              );
            })}
          </div>

          {/* Support messages */}
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowChat(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5 text-left mb-5">
            <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center"><MessageCircle size={18} className="text-accent" /></div>
            <div className="flex-1"><p className="text-[14px] font-bold text-foreground">Messages support</p><p className="text-[11px] text-muted mt-0.5">Voir et répondre aux conversations.</p></div>
            <UnreadBadge userId="admin" />
            <ChevronRight size={16} className="text-border" />
          </motion.button>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
            className="w-full bg-danger-soft rounded-2xl py-4 flex items-center justify-center gap-2">
            <LogOut size={17} className="text-danger" /><span className="text-[15px] font-bold text-danger">Déconnexion admin</span>
          </motion.button>

          <div className="text-center mt-4"><p className="text-[10px] text-subtle">Lumière Pro Admin · v1.0</p></div>
        </div>
      </div>

      <AdminChatPanel open={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
}
