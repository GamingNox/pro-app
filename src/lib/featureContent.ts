// ═══ Premium feature content ═══════════════════════════
// Central source of truth for every locked/premium feature page.
// Each entry defines the marketing content shown to users who
// don't yet have access to the feature.

import {
  Package, Bell, BarChart3, MessageSquare, CalendarDays, Heart,
  Palette, Camera, Globe, TrendingUp, Sparkles, CreditCard, Gift,
  Lock, type LucideIcon,
} from "lucide-react";
import type { Feature } from "./types";

export interface Benefit {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}

export interface FeatureContent {
  category: string;          // Uppercase pill label
  title: string;             // Large 1-3 line title
  description: string;       // 1-2 sentence value description
  benefits: [Benefit, Benefit, Benefit];
  showcaseIcon: LucideIcon;  // Large icon in the gold showcase card
  showcaseLabel: string;     // Small label inside showcase card
}

// Fallback content when a feature has no dedicated entry
const FALLBACK: FeatureContent = {
  category: "EXCLUSIVITE MEMBRES",
  title: "Debloquez cette fonctionnalite",
  description: "Accedez a toutes les fonctionnalites premium pour faire passer votre activite au niveau superieur.",
  benefits: [
    { icon: Sparkles, title: "Outils avances", desc: "Des fonctionnalites pensees pour les professionnels exigeants.", color: "#5B4FE9" },
    { icon: TrendingUp, title: "Gagnez du temps", desc: "Automatisez les taches repetitives et concentrez-vous sur votre metier.", color: "#10B981" },
    { icon: Lock, title: "Support prioritaire", desc: "Une equipe dediee pour vous accompagner.", color: "#F59E0B" },
  ],
  showcaseIcon: Sparkles,
  showcaseLabel: "Premium",
};

const CONTENT: Partial<Record<Feature, FeatureContent>> = {
  loyalty_system: {
    category: "EXCLUSIVITE MEMBRES",
    title: "Recompensez vos meilleurs clients",
    description: "Activez votre programme de fidelite et augmentez votre retention client. Transformez chaque visite en opportunite de croissance durable.",
    benefits: [
      { icon: CreditCard, title: "Cartes de fidelite personnalisees", desc: "Un design qui reflete le prestige de votre etablissement.", color: "#8B5CF6" },
      { icon: Gift, title: "Bonus d'anniversaire automatiques", desc: "Marquez les moments importants sans effort.", color: "#EC4899" },
      { icon: BarChart3, title: "Statistiques de fidelite", desc: "Identifiez vos meilleurs ambassadeurs et relancez les autres.", color: "#10B981" },
    ],
    showcaseIcon: Heart,
    showcaseLabel: "Loyalty Gold",
  },

  stock_management: {
    category: "GESTION AVANCEE",
    title: "Gerez votre stock sans effort",
    description: "Suivi automatique de votre inventaire, alertes en temps reel et historique des mouvements. Ne manquez plus jamais une vente.",
    benefits: [
      { icon: Package, title: "Inventaire en temps reel", desc: "Suivez chaque produit et categorie en un coup d'oeil.", color: "#0891B2" },
      { icon: Bell, title: "Alertes de stock bas", desc: "Recevez une notification avant rupture.", color: "#F59E0B" },
      { icon: BarChart3, title: "Historique des mouvements", desc: "Analysez vos ventes et optimisez vos achats.", color: "#10B981" },
    ],
    showcaseIcon: Package,
    showcaseLabel: "Stock Pro",
  },

  auto_reminders: {
    category: "COMMUNICATION AUTO",
    title: "Automatisez vos rappels clients",
    description: "SMS et emails de confirmation, rappel et remerciement envoyes automatiquement. Reduisez drastiquement vos rendez-vous manques.",
    benefits: [
      { icon: MessageSquare, title: "SMS et email personnalises", desc: "Vos messages, votre ton, envoyes au bon moment.", color: "#8B5CF6" },
      { icon: CalendarDays, title: "Rappels 24h avant le RDV", desc: "Divisez vos no-shows par deux sans lever le petit doigt.", color: "#8B5CF6" },
      { icon: Heart, title: "Messages de remerciement", desc: "Fidelisez vos clients apres chaque prestation.", color: "#EC4899" },
    ],
    showcaseIcon: MessageSquare,
    showcaseLabel: "Auto Messages",
  },

  custom_branding: {
    category: "IDENTITE DE MARQUE",
    title: "Votre marque, votre vitrine",
    description: "Personnalisez entierement votre page de reservation publique. Logo, couleurs, photos — creez une experience client a votre image.",
    benefits: [
      { icon: Palette, title: "Couleurs et logo personnalises", desc: "Un branding parfaitement coherent avec votre identite.", color: "#EC4899" },
      { icon: Camera, title: "Photos et galerie", desc: "Mettez en valeur vos prestations avec des visuels professionnels.", color: "#8B5CF6" },
      { icon: Globe, title: "Profil public optimise", desc: "Apparaissez dans les recherches Google locales.", color: "#0891B2" },
    ],
    showcaseIcon: Palette,
    showcaseLabel: "Brand Studio",
  },

  analytics_advanced: {
    category: "INTELLIGENCE METIER",
    title: "Pilotez votre activite en data",
    description: "Tableaux de bord avances, previsions et insights en temps reel. Prenez les bonnes decisions au bon moment, avec les bons chiffres.",
    benefits: [
      { icon: TrendingUp, title: "KPIs et previsions", desc: "Visualisez vos tendances et anticipez votre croissance.", color: "#10B981" },
      { icon: BarChart3, title: "Rapports detailles", desc: "CA, occupation, retention, panier moyen — tout y est.", color: "#8B5CF6" },
      { icon: Sparkles, title: "Insights automatiques", desc: "Notre IA detecte les opportunites cachees pour vous.", color: "#F59E0B" },
    ],
    showcaseIcon: BarChart3,
    showcaseLabel: "Data Insights",
  },
};

export function getFeatureContent(feature: Feature): FeatureContent {
  return CONTENT[feature] || FALLBACK;
}
