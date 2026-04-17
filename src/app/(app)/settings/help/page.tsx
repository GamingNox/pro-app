"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Send, Headphones, MessageCircle } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  label: string;
  items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    label: "Démarrer",
    items: [
      {
        q: "Comment créer mon compte ?",
        a: "Lors de votre première ouverture, cliquez sur « Créer un compte », choisissez « Professionnel » ou « Client », remplissez le formulaire et validez. Aucune carte bancaire n'est requise.",
      },
      {
        q: "Comment personnaliser mon profil ?",
        a: "Allez dans Profil → Modifier. Vous pouvez ajouter une photo, votre nom, votre activité, votre téléphone et votre email. Ces informations seront affichées sur votre page publique.",
      },
      {
        q: "Comment ajouter mon premier client ?",
        a: "Depuis l'onglet Clients, tapez sur « Nouveau client », renseignez les coordonnées et validez. Vous pouvez aussi laisser vos clients se créer un compte depuis votre lien de réservation.",
      },
    ],
  },
  {
    label: "Rendez-vous",
    items: [
      {
        q: "Comment modifier mes horaires ?",
        a: "Paramètres → Disponibilités & Horaires. Activez/désactivez chaque jour, ajoutez des créneaux, et configurez vos pauses. Les changements sont instantanés côté réservation.",
      },
      {
        q: "Comment partager mon lien de réservation ?",
        a: "Paramètres → Lien de réservation. Copiez l'URL unique ou téléchargez le QR code pour vos supports papier, votre signature email ou vos réseaux sociaux.",
      },
      {
        q: "Un client peut-il annuler son rendez-vous ?",
        a: "Oui, depuis son compte ou via le lien de confirmation reçu. Vous êtes notifié immédiatement et le créneau redevient disponible.",
      },
      {
        q: "Comment bloquer une journée ?",
        a: "Agenda → cliquez sur le jour → « Bloquer le créneau ». Vous pouvez bloquer toute la journée ou un créneau précis (pause déjeuner, absence, etc.).",
      },
    ],
  },
  {
    label: "Services & tarifs",
    items: [
      {
        q: "Comment ajouter un nouveau service ?",
        a: "Paramètres → Gestion des services → Nouveau service. Renseignez le nom, la durée et le prix. Votre service devient immédiatement disponible à la réservation.",
      },
      {
        q: "Puis-je proposer des forfaits ?",
        a: "Oui, créez un service avec un prix fixe et une description qui mentionne le nombre de séances incluses. Vous pouvez aussi créer des promotions limitées dans Marketing → Promotions.",
      },
    ],
  },
  {
    label: "Paiements & facturation",
    items: [
      {
        q: "Comment encaisser un paiement ?",
        a: "Gestion → Encaisser. Créez un lien de paiement externe (Stripe, PayPal, SumUp…) dans Paramètres → Paiements, puis partagez-le avec votre client. L'app ne traite jamais l'argent directement.",
      },
      {
        q: "Comment exporter mes factures pour mon comptable ?",
        a: "Paramètres → Comptabilité & Exports. Sélectionnez la période et le format (PDF, Excel, CSV), puis cliquez sur « Télécharger ».",
      },
      {
        q: "Puis-je créer une facture manuellement ?",
        a: "Oui, depuis Gestion → Facturer. Choisissez le client, ajoutez les lignes et enregistrez. La facture est comptabilisée automatiquement dans vos statistiques.",
      },
    ],
  },
  {
    label: "Fidélité & marketing",
    items: [
      {
        q: "Comment fonctionne le programme de fidélité ?",
        a: "Créez un programme depuis Fidélité → Nouveau programme. Choisissez le mode (visites ou points), définissez l'objectif et la récompense, puis distribuez les codes à vos clients. La progression se met à jour automatiquement.",
      },
      {
        q: "Comment lancer une promotion ?",
        a: "Paramètres → Promotions → choisissez un modèle (17 disponibles) et personnalisez-le. L'offre apparaît aussitôt sur votre page publique.",
      },
    ],
  },
  {
    label: "Compte & sécurité",
    items: [
      {
        q: "Comment changer mon mot de passe ?",
        a: "Depuis la page de connexion, cliquez sur « Mot de passe oublié ». Un email de réinitialisation vous sera envoyé immédiatement.",
      },
      {
        q: "Mes données sont-elles sauvegardées ?",
        a: "Oui, toutes vos données sont chiffrées et sauvegardées en continu sur des serveurs européens (RGPD). Vous pouvez les exporter à tout moment depuis Paramètres → Préférences.",
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Paramètres → Préférences → Zone danger → Supprimer mon compte. L'action est irréversible et supprime définitivement toutes vos données.",
      },
    ],
  },
];

export default function SettingsHelpPage() {
  const { user } = useApp();
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const filtered = search.trim()
    ? FAQ_CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (f) =>
            f.q.toLowerCase().includes(search.toLowerCase()) ||
            f.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : FAQ_CATEGORIES;

  function handleSendMessage() {
    if (!message.trim()) return;
    const key = "chat_" + (user.email || "pro-user");
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({ id: Date.now().toString(36), text: message.trim(), from: "user", time: Date.now() });
    localStorage.setItem(key, JSON.stringify(existing));
    const idx: string[] = JSON.parse(localStorage.getItem("chat_index") || "[]");
    if (!idx.includes(user.email || "pro-user")) {
      idx.push(user.email || "pro-user");
      localStorage.setItem("chat_index", JSON.stringify(idx));
    }
    const notifs = JSON.parse(localStorage.getItem("notif_admin") || "[]");
    notifs.unshift({ text: `${user.name || "Utilisateur"} a envoyé un message`, time: Date.now(), read: false });
    localStorage.setItem("notif_admin", JSON.stringify(notifs.slice(0, 20)));
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <SettingsPage
      category="Centre d'aide"
      title="Besoin d'aide ?"
      description="Trouvez des réponses instantanées ou contactez directement notre équipe."
    >
      {/* ── Contact hero — moved to the very top ── */}
      <motion.div
        className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
          boxShadow: "0 14px 36px color-mix(in srgb, var(--color-accent) 35%, transparent)",
        }}
      >
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle size={14} className="text-white" strokeWidth={2.5} />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Support direct</p>
          </div>
          <h3 className="text-[18px] font-bold tracking-tight leading-tight">Vous ne trouvez pas de réponse ?</h3>
          <p className="text-[12px] text-white/85 mt-1.5 leading-relaxed max-w-[280px]">
            Notre équipe est disponible 7j/7. Envoyez votre question, on revient vers vous sous 24h.
          </p>

          {sent ? (
            <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-xl py-3 px-4 flex items-center gap-2">
              <Send size={14} className="text-white" strokeWidth={2.5} />
              <p className="text-[12px] font-bold text-white">Message envoyé — réponse sous 24h</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre question ou problème…"
                rows={2}
                className="w-full bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5 text-[12px] text-white placeholder:text-white/60 outline-none resize-none"
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="w-full bg-white rounded-xl py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ color: "var(--color-accent-deep)" }}
              >
                <Headphones size={13} strokeWidth={2.5} /> Envoyer au support
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Search ── */}
      <div className="bg-white rounded-2xl px-4 py-3.5 shadow-card-premium flex items-center gap-3 mb-4">
        <Search size={16} className="text-subtle flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans la FAQ…"
          className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-subtle"
        />
      </div>

      {/* ── FAQ by category ── */}
      {filtered.length === 0 ? (
        <SettingsSection>
          <p className="text-[13px] text-muted text-center py-6">
            Aucun résultat pour « {search} ». Utilisez le support ci-dessus pour poser votre question.
          </p>
        </SettingsSection>
      ) : (
        filtered.map((cat) => (
          <SettingsSection key={cat.label} title={cat.label}>
            <div className="space-y-1">
              {cat.items.map((faq, i) => {
                const key = `${cat.label}-${i}`;
                const isOpen = openKey === key;
                return (
                  <div key={key}>
                    <motion.button
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setOpenKey(isOpen ? null : key)}
                      className="w-full flex items-center justify-between py-3.5 text-left border-b border-border-light last:border-0"
                    >
                      <p className="text-[13px] font-semibold text-foreground flex-1 pr-2">{faq.q}</p>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} className="text-muted" />
                      </motion.div>
                    </motion.button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-[12px] text-muted leading-relaxed pb-3 pl-1">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </SettingsSection>
        ))
      )}
    </SettingsPage>
  );
}
