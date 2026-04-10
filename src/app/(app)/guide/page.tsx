"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, CalendarDays, Users, BarChart3, Settings, Bell,
  TrendingUp, Plus, Clock, CheckCircle2, Receipt, Package, Palette,
  CreditCard, Link2, MessageSquare, Gift, Shield, BookOpen, Star,
  ChevronRight,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } }),
};

function Section({ title, icon, children, index }: { title: string; icon: React.ReactNode; children: React.ReactNode; index: number }) {
  return (
    <motion.section custom={index} variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
      className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">{icon}</div>
        <h2 className="text-[20px] font-bold text-foreground tracking-tight">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-card-premium mb-2.5">
      <div className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-foreground">{title}</p>
        <p className="text-[12px] text-muted mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="bg-accent-soft rounded-xl p-3.5 flex items-start gap-2.5 mb-3">
      <Sparkles size={14} className="text-accent flex-shrink-0 mt-0.5" />
      <p className="text-[12px] text-accent font-semibold leading-relaxed">{text}</p>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background">
      {/* Fixed header */}
      <div className="flex-shrink-0">
        <header className="px-6 pt-5 pb-3 flex items-center gap-3">
          <Link href="/profile">
            <motion.div whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-xl bg-white shadow-sm-apple flex items-center justify-center">
              <ArrowLeft size={17} className="text-foreground" />
            </motion.div>
          </Link>
          <div>
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Guide</h1>
            <p className="text-[11px] text-muted font-medium">Apprenez à utiliser Lumière Pro</p>
          </div>
        </header>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="bg-accent-gradient rounded-[22px] p-6 text-center mb-8 mt-2">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-white" />
            </div>
            <h2 className="text-[24px] font-bold text-white">Bienvenue dans le guide</h2>
            <p className="text-[14px] text-white/80 mt-2 leading-relaxed max-w-[280px] mx-auto">
              Découvrez toutes les fonctionnalités et apprenez à gérer votre activité efficacement.
            </p>
          </motion.div>

          {/* ═══ 1. DASHBOARD ═══ */}
          <Section title="Tableau de bord" icon={<TrendingUp size={18} className="text-accent" />} index={0}>
            <p className="text-[13px] text-muted mb-4 leading-relaxed">
              Votre page d&apos;accueil personnalisée. Elle affiche une vue complète de votre activité en temps réel.
            </p>

            <Feature icon={<BarChart3 size={16} className="text-accent" />} title="Chiffre d'affaires"
              desc="Visualisez vos revenus par jour, semaine ou mois. Le graphique montre l'évolution sur 7 jours avec le pourcentage de variation." />

            <Feature icon={<Bell size={16} className="text-warning" />} title="Notifications"
              desc="La cloche en haut à droite affiche vos alertes : factures en attente, stock faible, et suggestions personnalisées de l'assistant." />

            <Feature icon={<Plus size={16} className="text-accent" />} title="Actions rapides"
              desc="Quatre raccourcis : Rendez-vous, Clients, Facture, Rapports. Un clic pour accéder à n'importe quelle section." />

            <Feature icon={<Sparkles size={16} className="text-accent" />} title="Assistant intelligent"
              desc="Votre assistant analyse votre activité et propose des suggestions contextuelles : relancer un client, stock faible, créneau libre." />

            <Tip text="Consultez le tableau de bord chaque matin pour avoir une vue claire de votre journée." />
          </Section>

          {/* ═══ 2. RENDEZ-VOUS ═══ */}
          <Section title="Rendez-vous" icon={<CalendarDays size={18} className="text-accent" />} index={1}>
            <p className="text-[13px] text-muted mb-4 leading-relaxed">
              Gérez votre planning complet avec une vue par jour ou par semaine.
            </p>

            <Feature icon={<CalendarDays size={16} className="text-accent" />} title="Vue Planning"
              desc="La vue Jour affiche les créneaux de 08h à 18h. Chaque rendez-vous apparaît avec le nom du client, le service et la plage horaire. Cliquez un créneau vide pour créer un RDV." />

            <Feature icon={<Clock size={16} className="text-muted" />} title="Naviguer entre les jours"
              desc="Utilisez les flèches ← → pour changer de jour. La bande de jours en haut permet de sélectionner rapidement un jour de la semaine. Les points indiquent les jours avec des RDV." />

            <Feature icon={<Plus size={16} className="text-success" />} title="Créer un rendez-vous"
              desc="Cliquez le bouton '+ Nouveau' en bas à droite. Sélectionnez un service rapide pour pré-remplir le titre, la durée et le prix. Choisissez le client, la date et l'heure." />

            <Feature icon={<CheckCircle2 size={16} className="text-success" />} title="Gérer les statuts"
              desc="Cliquez sur un RDV pour voir les détails. Marquez-le comme Terminé ou Annulé. Vous pouvez aussi le supprimer." />

            <div className="bg-border-light rounded-2xl p-4 mt-3">
              <p className="text-[12px] font-bold text-foreground mb-2">Où configurer les horaires ?</p>
              <p className="text-[11px] text-muted leading-relaxed">Profil → Réservations → Disponibilités. Définissez vos heures de début/fin, pause déjeuner, et jours de travail.</p>
            </div>
          </Section>

          {/* ═══ 3. CLIENTS ═══ */}
          <Section title="Clients" icon={<Users size={18} className="text-accent" />} index={2}>
            <p className="text-[13px] text-muted mb-4 leading-relaxed">
              Votre carnet d&apos;adresses professionnel avec historique complet et badges.
            </p>

            <Feature icon={<Users size={16} className="text-accent" />} title="Liste clients"
              desc="Vos clients sont affichés avec leur nom, la date de dernière visite, et leurs badges (VIP, Nouveau, Fidèle). Utilisez la recherche et les filtres pour trouver rapidement un client." />

            <Feature icon={<Star size={16} className="text-warning" />} title="Badges & tags"
              desc="Attribuez des badges (VIP, Fidèle, Nouveau) pour organiser votre clientèle. Les badges sont visibles dans la liste et sur la fiche client." />

            <Feature icon={<Receipt size={16} className="text-accent" />} title="Fiche client"
              desc="Cliquez sur un client pour voir sa fiche complète : informations de contact, historique des rendez-vous, paiements, notes. Vous pouvez l'appeler, lui envoyer un email, ou créer un RDV directement." />

            <Feature icon={<Users size={16} className="text-muted" />} title="Photo de profil"
              desc="Ajoutez une photo pour chaque client depuis sa fiche. Cliquez sur l'icône caméra pour télécharger une image." />

            <Tip text="Utilisez le filtre VIP pour identifier rapidement vos meilleurs clients." />
          </Section>

          {/* ═══ 4. GESTION ═══ */}
          <Section title="Gestion" icon={<Receipt size={18} className="text-accent" />} index={3}>
            <p className="text-[13px] text-muted mb-4 leading-relaxed">
              Centre de pilotage pour vos factures, paiements, stock et analyse financière.
            </p>

            <Feature icon={<Star size={16} className="text-warning" />} title="Objectif mensuel"
              desc="La page d'accueil Gestion affiche votre progression vers l'objectif de chiffre d'affaires du mois avec une barre de progression." />

            <Feature icon={<Receipt size={16} className="text-accent" />} title="Factures"
              desc="Créez des factures avec des lignes détaillées (service, quantité, prix). Dupliquez une facture existante en un clic. Les factures en retard sont signalées en rouge." />

            <Feature icon={<CreditCard size={16} className="text-success" />} title="Paiements"
              desc="Suivez les paiements en attente, en retard et payés. Le bouton 'Encaisser' permet de créer un paiement rapide avec sélection du client et du produit/service. Le stock est mis à jour automatiquement." />

            <Feature icon={<Package size={16} className="text-info" />} title="Stock"
              desc="Gérez vos produits avec des alertes de stock bas. Les barres de progression montrent le niveau de chaque produit. Utilisez les boutons +/- pour ajuster les quantités." />

            <Feature icon={<BarChart3 size={16} className="text-accent" />} title="Analyse"
              desc="L'onglet Analyse affiche un graphique des revenus sur 6 mois, les KPI clés (revenu, dépenses, bénéfice net) et le classement de vos meilleurs clients." />

            <Tip text="Créez une dépense depuis l'onglet Factures pour suivre vos coûts (fournitures, loyer, transport)." />
          </Section>

          {/* ═══ 5. PARAMÈTRES ═══ */}
          <Section title="Paramètres" icon={<Settings size={18} className="text-accent" />} index={4}>
            <p className="text-[13px] text-muted mb-4 leading-relaxed">
              Configurez chaque aspect de votre activité depuis votre profil.
            </p>

            <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden mb-4">
              {[
                { cat: "Compte & Informations", items: "Nom, description, adresse, réseaux sociaux, page publique." },
                { cat: "Activité", items: "Statistiques de performance, historique, messages automatisés (rappels, confirmations)." },
                { cat: "Réservations", items: "Horaires de travail, jours, pauses, congés, politique d'annulation, lien de réservation." },
                { cat: "Clients & Fidélisation", items: "Badges personnalisés, acomptes, programme fidélité, système de parrainage." },
                { cat: "Paiements & Comptabilité", items: "Moyens de paiement (espèces, carte, virement), terminal, TVA, SIRET, export." },
                { cat: "Application", items: "Couleur de l'app, style de l'assistant, notifications, données." },
              ].map((s, i, arr) => (
                <div key={i} className={`px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-border-light" : ""}`}>
                  <p className="text-[13px] font-bold text-foreground">{s.cat}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{s.items}</p>
                </div>
              ))}
            </div>

            <Feature icon={<Palette size={16} className="text-accent" />} title="Personnaliser l'app"
              desc="Changez la couleur de toute l'application dans Profil → Application → Personnalisation. Le changement s'applique instantanément sur tous les écrans." />

            <Feature icon={<Link2 size={16} className="text-accent" />} title="Lien de réservation"
              desc="Copiez et partagez votre lien unique pour que vos clients réservent en ligne. Personnalisez le titre et la description de la page." />

            <Feature icon={<Gift size={16} className="text-warning" />} title="Fidélité & Parrainage"
              desc="Créez une carte de fidélité personnalisée (couleur, nom, type points/visites). Le parrainage génère un code unique avec des récompenses par paliers." />

            <Feature icon={<MessageSquare size={16} className="text-accent" />} title="Messages automatisés"
              desc="Configurez des messages envoyés automatiquement après réservation, avant le RDV, et après la visite. Activez/désactivez chacun individuellement." />
          </Section>

          {/* ═══ TIPS SECTION ═══ */}
          <Section title="Astuces" icon={<Sparkles size={18} className="text-accent" />} index={5}>
            <div className="space-y-3">
              {[
                "Consultez le tableau de bord chaque matin pour voir vos RDV et actions à faire.",
                "Utilisez les services rapides pour créer un RDV en 3 secondes.",
                "Marquez vos meilleurs clients comme VIP pour les identifier rapidement.",
                "Activez les alertes de stock pour ne jamais être en rupture.",
                "Personnalisez la couleur de l'app pour qu'elle vous ressemble.",
                "Partagez votre lien de réservation sur vos réseaux sociaux.",
                "Utilisez le parrainage pour développer votre clientèle.",
              ].map((tip, i) => (
                <motion.div key={i} custom={i} variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="flex items-start gap-3 bg-border-light rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-accent">{i + 1}</span>
                  </div>
                  <p className="text-[13px] text-foreground leading-relaxed">{tip}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* CTA */}
          <motion.div custom={6} variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-accent" />
            </div>
            <h3 className="text-[22px] font-bold text-foreground">Vous êtes prêt !</h3>
            <p className="text-[14px] text-muted mt-2 max-w-[260px] mx-auto leading-relaxed">
              Lancez-vous et transformez la gestion de votre activité.
            </p>
            <Link href="/">
              <motion.div whileTap={{ scale: 0.97 }}
                className="mt-5 bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow max-w-[300px] mx-auto">
                Commencer <ChevronRight size={18} />
              </motion.div>
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
