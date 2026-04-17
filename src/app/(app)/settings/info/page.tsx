"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Camera, Mail, Phone, MapPin, Globe, Link2 } from "lucide-react";
import SettingsPage, { SettingsSection, SaveButton } from "@/components/SettingsPage";

export default function SettingsInfoPage() {
  const { user, updateUser } = useApp();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    company: user.business || "",
    desc: "",
    address: "",
    email: user.email || "",
    phone: user.phone || "",
    insta: "",
    web: "",
  });

  function handleSave() {
    updateUser({ business: form.company, email: form.email, phone: form.phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <SettingsPage
      category="Administration"
      title="Informations Établissement"
      description="Gérez l'identité visuelle et les coordonnées publiques de votre établissement pour une expérience client cohérente."
    >
      {/* Identity */}
      <SettingsSection title="Identité" description="Ces informations seront visibles sur vos factures, emails et portail client.">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-border-light flex items-center justify-center">
            <Camera size={24} className="text-muted" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-foreground">Logo de l&apos;établissement</p>
            <p className="text-[11px] text-muted mt-0.5">PNG, JPG ou SVG. Max 2MB</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Nom de l&apos;établissement</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="ex: Mon Etablissement" className="input-field" />
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Slogan ou description courte</label>
            <input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder="Le design au service de vos idées" className="input-field" />
          </div>
        </div>
      </SettingsSection>

      {/* Contact */}
      <SettingsSection title="Coordonnées" description="Comment vos clients peuvent-ils vous joindre directement ?">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Email professionnel</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <Mail size={16} className="text-subtle" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@studio.fr" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Téléphone</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <Phone size={16} className="text-subtle" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                type="tel" placeholder="+33 1 23 45 67 89" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Adresse physique</label>
            <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
              <MapPin size={16} className="text-subtle" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="12 Avenue des Champs-Élysées, 75008 Paris" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Social */}
      <SettingsSection title="Réseaux Sociaux" description="Connectez vos profils pour renforcer votre présence numérique.">
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center"><Globe size={14} className="text-accent" /></div>
            <input value={form.insta} onChange={(e) => setForm({ ...form, insta: e.target.value })}
              placeholder="instagram.com/studio" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
          </div>
          <div className="flex items-center gap-3 bg-border-light rounded-2xl px-4 py-3.5">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center"><Link2 size={14} className="text-accent" /></div>
            <input value={form.web} onChange={(e) => setForm({ ...form, web: e.target.value })}
              placeholder="linkedin.com/company/studio" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
          </div>
          <p className="text-[11px] text-muted">D&apos;autres liens pourront etre ajoutes prochainement.</p>
        </div>
      </SettingsSection>

      {/* Actions */}
      <div className="flex gap-3 mb-5">
        <button onClick={() => history.back()} className="flex-1 bg-white border-2 border-border py-3.5 rounded-2xl text-[14px] font-bold text-foreground">Annuler</button>
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave}
          className="flex-1 text-white py-3.5 rounded-2xl text-[14px] font-bold fab-shadow"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
            boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
          }}>
          {saved ? "Enregistré !" : "Enregistrer"}
        </motion.button>
      </div>

      <div className="text-center text-[10px] text-muted pb-4">
        <span>Confidentialité</span> · <span>Conditions</span> · <span>Support</span>
      </div>
    </SettingsPage>
  );
}
