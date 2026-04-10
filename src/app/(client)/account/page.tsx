"use client";

import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { User, Bell, CreditCard, Shield, LogOut, ChevronRight, Camera, Edit3, Headphones } from "lucide-react";
import { useRef, useState } from "react";
import SupportChat, { UnreadBadge } from "@/components/SupportChat";

export default function ClientAccountPage() {
  const { user, logout } = useApp();
  const [photo, setPhoto] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { const s = ev.target?.result as string; if (!s) return; const i = new Image(); i.onload = () => { const c = document.createElement("canvas"); const m = 200; let w = i.width, h = i.height; if (w > h) { h = (h/w)*m; w = m; } else { w = (w/h)*m; h = m; } c.width = w; c.height = h; c.getContext("2d")!.drawImage(i,0,0,w,h); setPhoto(c.toDataURL("image/jpeg",0.8)); }; i.src = s; };
    r.readAsDataURL(f); e.target.value = "";
  }

  const menuItems = [
    { icon: User, label: "Informations personnelles", sub: "Nom, email, numéro de téléphone", color: "bg-accent-soft", iconColor: "text-accent" },
    { icon: Bell, label: "Préférences de notification", sub: "Alertes, emails et push messages", color: "bg-border-light", iconColor: "text-muted" },
    { icon: CreditCard, label: "Moyens de paiement", sub: "Visa terminaison •••• 4242", color: "bg-border-light", iconColor: "text-muted" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Profil</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center pt-4 pb-6">
            <div className="relative mb-4">
              <div className="w-[120px] h-[120px] rounded-full overflow-hidden shadow-apple-lg">
                {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full bg-border-light flex items-center justify-center"><User size={48} className="text-muted" /></div>
                )}
              </div>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => photoRef.current?.click()}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-sm border-[3px] border-background">
                <Edit3 size={14} className="text-white" />
              </motion.button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
            <h2 className="text-[24px] font-bold text-foreground tracking-tight">{user.name || "Client"}</h2>
            <p className="text-[13px] text-muted mt-1">Membre Privilège depuis 2024</p>
          </div>

          {/* Menu */}
          <div className="space-y-3 mb-8">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.button key={i} whileTap={{ scale: 0.98 }}
                  className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5 text-left">
                  <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={item.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-border flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>

          {/* Support — above Mentions légales */}
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowChat(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5 text-left mb-3">
            <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center"><Headphones size={18} className="text-accent" /></div>
            <div className="flex-1"><p className="text-[14px] font-bold text-foreground">Contacter le support</p><p className="text-[11px] text-muted mt-0.5">Envoyez un message à notre équipe.</p></div>
            <UnreadBadge userId={user.email || "client-user"} />
            <ChevronRight size={16} className="text-border" />
          </motion.button>

          {/* Mentions légales */}
          <motion.button whileTap={{ scale: 0.98 }}
            className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5 text-left mb-3">
            <div className="w-11 h-11 rounded-xl bg-border-light flex items-center justify-center"><Shield size={18} className="text-muted" /></div>
            <div className="flex-1"><p className="text-[14px] font-bold text-foreground">Mentions légales</p><p className="text-[11px] text-muted mt-0.5">Confidentialité et conditions</p></div>
            <ChevronRight size={16} className="text-border" />
          </motion.button>

          {/* Logout */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={logout}
            className="w-full bg-danger-soft rounded-2xl py-4 flex items-center justify-center gap-2 mb-5">
            <LogOut size={17} className="text-danger" />
            <span className="text-[15px] font-bold text-danger">Se déconnecter</span>
          </motion.button>

          <div className="text-center">
            <p className="text-[10px] text-subtle">Version 2.4.1 (Build 108)</p>
          </div>
        </div>
      </div>

      <SupportChat open={showChat} onClose={() => setShowChat(false)} userId={user.email || "client-user"} userName={user.name || "Client"} />
    </div>
  );
}
