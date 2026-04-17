"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { User, Mail, Phone, Check } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function ClientAccountInfoPage() {
  const { user, updateUser } = useApp();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  });

  const hasChanges =
    form.name !== (user.name || "") ||
    form.email !== (user.email || "") ||
    form.phone !== (user.phone || "");

  function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    updateUser({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <SettingsPage
      category="Compte client"
      title="Informations personnelles"
      description="Vos coordonnees sont utilisees pour vos reservations et la communication avec vos professionnels."
    >
      <SettingsSection title="Identite" description="Ces informations sont visibles par les professionnels chez qui vous reservez.">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom complet</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <User size={16} className="text-subtle" />
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jean Dupont"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Adresse email</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <Mail size={16} className="text-subtle" />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                placeholder="nom@exemple.com"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Telephone</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <Phone size={16} className="text-subtle" />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                type="tel"
                placeholder="+33 6 12 34 56 78"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={!hasChanges || !form.name.trim() || !form.email.trim()}
        className={`w-full py-4 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 mb-5 ${
          hasChanges && form.name.trim() && form.email.trim()
            ? "bg-accent text-white fab-shadow"
            : "bg-border-light text-muted"
        }`}
      >
        {saved ? (
          <>
            <Check size={16} /> Enregistre !
          </>
        ) : (
          "Enregistrer"
        )}
      </motion.button>
    </SettingsPage>
  );
}
