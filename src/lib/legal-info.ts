// ── Legal & company info ─────────────────────────────────
// Single source of truth for the legal pages (mentions légales,
// CGU, politique de confidentialité). When any of these change,
// update here and all three pages reflect it automatically.

export const LEGAL_INFO = {
  companyName: "Clientbase",
  legalForm: "En cours d'immatriculation",
  siret: "En cours d'immatriculation",
  address: "2 rue des Brefordes, 91720 Maisse, France",
  phone: "07 79 29 28 10",
  contactEmail: "clientbase.fr@gmail.com",
  dpoEmail: "clientbase.fr@gmail.com",
  vat: "Non applicable (en cours)",
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, USA",
    website: "https://vercel.com",
  },
  publicationDirector: "Noah Pascual",
  domain: "clientbase.fr",
} as const;
