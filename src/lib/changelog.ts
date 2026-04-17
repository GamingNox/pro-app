// ══ Changelog entries — single source of truth ══════════════
// Edit this file when you ship a new release. The /settings/updates
// page and /account/updates page both read from here.

export type ChangelogStatus = "new" | "shipped" | "upcoming";

export interface ChangelogEntry {
  id: string;
  date: string; // ISO "YYYY-MM-DD"
  title: string;
  description: string;
  status: ChangelogStatus;
  /** Free-form tag shown as a pill (e.g., "Fidélité", "Marketing") */
  tag?: string;
}

// Ordered most-recent first
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "beta-program",
    date: "2026-04-14",
    title: "Programme bêta testeur",
    description: "Devenez bêta testeur et obtenez un accès anticipé aux nouvelles fonctionnalités. Plan premium offert pour les membres du programme.",
    status: "new",
    tag: "Exclusivité",
  },
  {
    id: "loyalty-v2",
    date: "2026-04-12",
    title: "Nouveau système de fidélité amélioré",
    description: "Cartes style bancaire avec gradients premium, aperçu visuel dès la première visite, et 3 types de récompenses.",
    status: "new",
    tag: "Fidélité",
  },
  {
    id: "dark-mode",
    date: "2026-04-10",
    title: "Mode sombre & thème automatique",
    description: "Choisissez clair, sombre ou automatique depuis les paramètres de personnalisation.",
    status: "new",
    tag: "Personnalisation",
  },
  {
    id: "calendar-swipe",
    date: "2026-04-10",
    title: "Navigation par swipe dans l'agenda",
    description: "Glissez horizontalement sur la vue jour pour passer au jour suivant ou précédent — plus fluide, plus rapide.",
    status: "shipped",
    tag: "Agenda",
  },
  {
    id: "referral",
    date: "2026-04-08",
    title: "Programme de parrainage",
    description: "Invitez d'autres professionnels et gagnez 1 mois Premium offert par inscription validée.",
    status: "shipped",
    tag: "Croissance",
  },
  {
    id: "promotions",
    date: "2026-04-05",
    title: "17 modèles de promotions",
    description: "Offres saisonnières, événements et promotions commerciales prêtes à l'emploi, personnalisables en quelques clics.",
    status: "shipped",
    tag: "Marketing",
  },
  {
    id: "booking-sync",
    date: "2026-04-02",
    title: "Synchronisation réservations en temps réel",
    description: "Les réservations publiques apparaissent instantanément dans votre agenda sans aucun refresh.",
    status: "shipped",
    tag: "Agenda",
  },

  // ── Upcoming ────────────────────────────────────────────
  {
    id: "sms-reminders",
    date: "2026-05-01",
    title: "Rappels SMS automatisés",
    description: "Relancez vos clients 24h avant leur rendez-vous pour réduire vos no-shows de 40%.",
    status: "upcoming",
    tag: "Communication",
  },
  {
    id: "ai-insights",
    date: "2026-05-15",
    title: "Assistant IA & recommandations",
    description: "Notre IA analyse votre activité et vous suggère les meilleures opportunités commerciales.",
    status: "upcoming",
    tag: "Intelligence",
  },
  {
    id: "multi-staff",
    date: "2026-06-01",
    title: "Gestion multi-collaborateurs",
    description: "Ajoutez plusieurs membres à votre équipe, assignez les rendez-vous, suivez la performance de chacun.",
    status: "upcoming",
    tag: "Équipe",
  },
];

export function getRecentChangelog(limit = 10): ChangelogEntry[] {
  return CHANGELOG.filter((c) => c.status !== "upcoming").slice(0, limit);
}

export function getUpcomingChangelog(): ChangelogEntry[] {
  return CHANGELOG.filter((c) => c.status === "upcoming");
}
