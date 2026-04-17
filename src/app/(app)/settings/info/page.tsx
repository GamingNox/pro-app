"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function SettingsInfoPage() {
  const { user, updateUser } = useApp();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    company: user.business || "",
    address: user.address || "",
    email: user.email || "",
    phone: user.phone || "",
  });

  function handleSave() {
    updateUser({
      business: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <SettingsPage
      category="Mon établissement"
      title="Mes informations"
      description="Les informations que vos clients voient sur leurs factures et vos emails."
    >
      <SettingsSection title="Identité">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom de l&apos;établissement</label>
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Ex : Cabinet Noah Pascual"
              className="input-field"
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Coordonnées">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Email</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <Mail size={16} className="text-subtle" />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@exemple.fr"
                className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Téléphone</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <Phone size={16} className="text-subtle" />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                type="tel"
                placeholder="06 12 34 56 78"
                className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Adresse</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <MapPin size={16} className="text-subtle" />
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="12 rue Exemple, 75001 Paris"
                className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        className="w-full text-white py-4 rounded-2xl text-[15px] font-bold fab-shadow"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
          boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
        }}
      >
        {saved ? "Enregistré !" : "Enregistrer"}
      </motion.button>
    </SettingsPage>
  );
}
