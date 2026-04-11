"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Search, HelpCircle, BookOpen, FileText, Headphones, ChevronRight, ChevronDown, Send, MessageCircle } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

const FAQ = [
  { q: "Comment ajouter un nouveau service ?", a: "Allez dans Paramètres → Gestion des services → Nouveau service. Renseignez le nom, la durée, le prix et enregistrez." },
  { q: "Comment modifier mes horaires ?", a: "Allez dans Paramètres → Disponibilités & Horaires. Vous pouvez activer/désactiver chaque jour et ajouter des créneaux." },
  { q: "Comment partager mon lien de réservation ?", a: "Allez dans Paramètres → Lien de réservation. Copiez l'URL ou téléchargez le QR code pour vos supports." },
  { q: "Comment fonctionne le programme de fidélité ?", a: "Créez un programme dans Fidélité, définissez les règles (visites ou points), et partagez le code avec vos clients." },
  { q: "Comment exporter mes données comptables ?", a: "Allez dans Comptabilité & Exports, sélectionnez le format (PDF, Excel, CSV) et cliquez sur Télécharger." },
  { q: "Comment changer mon mot de passe ?", a: "Depuis la page de connexion, cliquez sur 'Oublié ?' pour réinitialiser votre mot de passe par email." },
];

const TUTORIALS = [
  { title: "Premiers pas avec Lumière Pro", desc: "Configurez votre profil, ajoutez vos services et commencez à recevoir des réservations." },
  { title: "Gérer vos rendez-vous", desc: "Confirmez, modifiez ou annulez vos rendez-vous directement depuis le tableau de bord." },
  { title: "Suivre vos finances", desc: "Créez des factures, suivez vos paiements et exportez vos rapports comptables." },
  { title: "Fidéliser vos clients", desc: "Mettez en place un programme de fidélité et suivez la progression de vos clients." },
];

export default function SettingsHelpPage() {
  const { user } = useApp();
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const filteredFaq = search.trim()
    ? FAQ.filter((f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
    : FAQ;

  function handleSendMessage() {
    if (!message.trim()) return;
    // Save to localStorage notifications (same system as SupportChat)
    const key = "chat_" + (user.email || "pro-user");
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({ id: Date.now().toString(36), text: message.trim(), from: "user", time: Date.now() });
    localStorage.setItem(key, JSON.stringify(existing));
    // Add to chat index
    const idx: string[] = JSON.parse(localStorage.getItem("chat_index") || "[]");
    if (!idx.includes(user.email || "pro-user")) { idx.push(user.email || "pro-user"); localStorage.setItem("chat_index", JSON.stringify(idx)); }
    // Notify admin
    const notifs = JSON.parse(localStorage.getItem("notif_admin") || "[]");
    notifs.unshift({ text: `${user.name || "Utilisateur"} a envoyé un message`, time: Date.now(), read: false });
    localStorage.setItem("notif_admin", JSON.stringify(notifs.slice(0, 20)));
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <SettingsPage category="Centre d'aide" title="Besoin d'aide ?"
      description="Trouvez des réponses instantanées ou contactez notre équipe d'experts pour un accompagnement personnalisé.">

      {/* Search */}
      <div className="bg-white rounded-2xl px-4 py-3.5 shadow-card-premium flex items-center gap-3 mb-6">
        <Search size={16} className="text-subtle" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un tutoriel, une question..."
          className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-subtle" />
      </div>

      {/* FAQ */}
      <SettingsSection title="FAQ" description="Les questions les plus fréquentes.">
        <div className="space-y-1">
          {filteredFaq.map((faq, i) => (
            <div key={i}>
              <motion.button whileTap={{ scale: 0.99 }} onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-3.5 text-left border-b border-border-light last:border-0">
                <p className="text-[13px] font-medium text-foreground flex-1 pr-2">{faq.q}</p>
                <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-muted" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <p className="text-[12px] text-muted leading-relaxed pb-3 pl-1">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {filteredFaq.length === 0 && <p className="text-[13px] text-muted text-center py-4">Aucun résultat pour &quot;{search}&quot;</p>}
        </div>
      </SettingsSection>

      {/* Tutorials */}
      <SettingsSection title="Tutoriels" description="Guides étape par étape pour maîtriser toutes nos fonctionnalités.">
        <div className="space-y-3">
          {TUTORIALS.map((t, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border-light last:border-0 last:pb-0">
              <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                <BookOpen size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-foreground">{t.title}</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
              <ChevronRight size={14} className="text-muted mt-2" />
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Contact support */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <p className="text-[16px] font-bold">Vous ne trouvez pas de réponse ?</p>
        <p className="text-[12px] text-white/70 mt-1 leading-relaxed">
          Notre équipe de support est disponible 7j/7 pour vous aider.
        </p>
      </div>

      <SettingsSection title="Contacter le support">
        {sent ? (
          <div className="text-center py-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="w-14 h-14 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-3">
              <Send size={22} className="text-success" />
            </motion.div>
            <p className="text-[15px] font-bold text-foreground">Message envoyé !</p>
            <p className="text-[12px] text-muted mt-1">Nous vous répondrons dans les plus brefs délais.</p>
          </div>
        ) : (
          <>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre problème ou posez votre question..."
              rows={3} className="input-field resize-none mb-3" />
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSendMessage} disabled={!message.trim()}
              className={`w-full py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 ${message.trim() ? "bg-accent text-white fab-shadow" : "bg-border-light text-muted"}`}>
              <Headphones size={15} /> Contacter le support
            </motion.button>
          </>
        )}
      </SettingsSection>

      {/* Popular articles */}
      <div className="mb-5">
        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-3">Articles populaires</p>
        <div className="space-y-2">
          {[
            "Comment changer mon mot de passe ?",
            "Exporter mes données clients",
            "Intégration avec des outils externes",
          ].map((a, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm-apple flex items-center gap-3">
              <FileText size={16} className="text-muted" />
              <p className="text-[13px] font-medium text-foreground flex-1">{a}</p>
              <ChevronRight size={14} className="text-muted" />
            </div>
          ))}
        </div>
      </div>
    </SettingsPage>
  );
}
