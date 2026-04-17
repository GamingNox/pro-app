"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_INFO } from "@/lib/legal-info";

export default function CGUPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
      <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted mb-8 hover:text-foreground">
        <ArrowLeft size={16} /> Retour
      </Link>

      <h1 className="text-[28px] font-bold text-foreground tracking-tight mb-2">Conditions générales d&apos;utilisation</h1>
      <p className="text-[13px] text-muted mb-8">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
      </p>

        <div className="prose-legal space-y-8 text-[13px] text-foreground leading-relaxed">

          {/* 1. Objet */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">1. Objet</h2>
            <p>
              Les présentes CGU régissent l&apos;utilisation de la plateforme <strong>{LEGAL_INFO.domain}</strong>{" "}
              (ci-après «&nbsp;le Service&nbsp;»), accessible via navigateur web et en tant qu&apos;application
              web progressive (PWA). Le Service permet aux professionnels («&nbsp;Utilisateurs Pro&nbsp;»)
              de gérer leur activité (rendez-vous, clients, factures) et aux consommateurs
              («&nbsp;Clients&nbsp;») de réserver des prestations.
            </p>
          </section>

          {/* 2. Acceptation */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">2. Acceptation</h2>
            <p>
              L&apos;utilisation du Service vaut acceptation pleine et entiere des presentes CGU.
              En cas de desaccord, l&apos;utilisateur doit cesser toute utilisation.
            </p>
          </section>

          {/* 3. Description */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">3. Description du Service</h2>
            <ul className="space-y-1.5 text-muted">
              <li><strong className="text-foreground">Cote Pro</strong> : gestion de calendrier, fiches clients, facturation, envoi de rappels, programme de fidelite.</li>
              <li><strong className="text-foreground">Cote Client</strong> : consultation des disponibilites, reservation en ligne, historique, fidelite.</li>
            </ul>
            <p className="mt-3 text-muted">
              Le Service ne realise aucun encaissement direct. Les paiements sont traites par des
              prestataires tiers (Stripe, PayPal). L&apos;Editeur n&apos;est pas partie aux transactions
              financieres entre l&apos;Utilisateur Pro et ses Clients.
            </p>
          </section>

          {/* 4. Inscription */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">4. Inscription et compte</h2>
            <p>
              L&apos;utilisateur s&apos;engage a fournir des informations exactes et a jour. Il est
              responsable de la confidentialite de ses identifiants. Toute activite effectuee depuis
              son compte est reputee effectuee par lui.
            </p>
          </section>

          {/* 5. Propriete intellectuelle */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">5. Propriete intellectuelle</h2>
            <p>
              L&apos;ensemble des elements du Service (code, design, textes, logos, marques) est la
              propriete exclusive de l&apos;Editeur ou de ses concedants. Toute reproduction,
              representation ou exploitation non autorisee est interdite (articles L. 335-2 et
              suivants du Code de la propriete intellectuelle).
            </p>
            <p className="mt-3 text-muted">
              Les contenus publies par les Utilisateurs Pro restent leur propriete. Ils concedent
              a l&apos;Editeur une licence non exclusive, mondiale et gratuite de reproduction et
              d&apos;affichage aux seules fins du fonctionnement du Service.
            </p>
          </section>

          {/* 6. Obligations */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">6. Obligations de l&apos;utilisateur</h2>
            <p>L&apos;utilisateur s&apos;interdit de :</p>
            <ul className="mt-2 space-y-1.5 text-muted list-disc list-inside">
              <li>utiliser le Service a des fins illicites ou contraires aux presentes CGU ;</li>
              <li>tenter d&apos;acceder aux donnees d&apos;autres utilisateurs de maniere non autorisee ;</li>
              <li>introduire du contenu illicite, injurieux ou portant atteinte aux droits de tiers ;</li>
              <li>realiser toute operation susceptible de perturber le fonctionnement du Service.</li>
            </ul>
          </section>

          {/* 7. Limitation de responsabilite */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">7. Limitation de responsabilite</h2>

            <p className="font-semibold mb-2">a) Disponibilite et interruptions</p>
            <p className="text-muted mb-4">
              Le Service est fourni &laquo; en l&apos;etat &raquo; et &laquo; selon disponibilite &raquo;.
              L&apos;Editeur s&apos;efforce d&apos;assurer un acces continu mais ne garantit pas l&apos;absence
              d&apos;interruptions, d&apos;erreurs ou de dysfonctionnements. L&apos;Editeur n&apos;est pas
              responsable des dommages resultant d&apos;une indisponibilite temporaire, y compris pour
              maintenance programmee ou urgente.
            </p>

            <p className="font-semibold mb-2">b) Perte de donnees</p>
            <p className="text-muted mb-4">
              L&apos;Editeur met en oeuvre des mesures raisonnables de sauvegarde. Toutefois, il ne
              saurait etre tenu responsable de toute perte de donnees resultant d&apos;un cas de force
              majeure, d&apos;une defaillance d&apos;un sous-traitant technique, ou d&apos;une action
              de l&apos;utilisateur.
            </p>

            <p className="font-semibold mb-2">c) Integrations et services tiers</p>
            <p className="text-muted mb-4">
              Le Service peut contenir des liens vers ou s&apos;integrer a des services tiers
              (Stripe, PayPal, Google Calendar, etc.). L&apos;Editeur n&apos;est pas responsable
              du contenu, de la disponibilite ou des pratiques de ces tiers. L&apos;utilisation de
              ces services est soumise a leurs propres conditions.
            </p>

            <p className="font-semibold mb-2">d) Contenu utilisateur</p>
            <p className="text-muted mb-4">
              L&apos;Editeur n&apos;exerce pas de controle editorial prealable sur les contenus publies
              par les Utilisateurs Pro. La responsabilite du contenu incombe a l&apos;utilisateur qui
              le publie, conformement a l&apos;article 6.I.2 de la LCEN.
            </p>

            <p className="font-semibold mb-2">e) Resultat des reservations</p>
            <p className="text-muted mb-4">
              L&apos;Editeur fournit un outil de mise en relation. Il ne garantit pas la realisation
              effective des prestations reservees ni leur qualite. Les litiges entre l&apos;Utilisateur
              Pro et ses Clients sont regles directement entre eux.
            </p>

            <p className="font-semibold mb-2">f) Plafond d&apos;indemnisation</p>
            <p className="text-muted mb-4">
              Dans les limites autorisees par la loi, la responsabilite totale de l&apos;Editeur,
              toutes causes confondues, est limitee au montant des sommes effectivement versees par
              l&apos;utilisateur au cours des douze (12) mois precedant le fait generateur.
            </p>

            <p className="font-semibold mb-2">g) Clauses non excludables</p>
            <p className="text-muted">
              Conformement au droit francais, rien dans les presentes CGU n&apos;exclut ni ne limite
              la responsabilite de l&apos;Editeur en cas de dol, de faute lourde, de dommage corporel,
              ou dans les cas ou la limitation de responsabilite est interdite par le Code de la
              consommation (articles L. 211-1 et suivants, L. 241-5 relatif aux clauses abusives).
            </p>
          </section>

          {/* 8. Suspension */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">8. Suspension et resiliation</h2>
            <p className="text-muted">
              L&apos;Editeur se reserve le droit de suspendre ou supprimer tout compte en cas de
              violation des presentes CGU, apres notification prealable de 15 jours sauf urgence
              (atteinte a la securite, activite frauduleuse).
            </p>
            <p className="mt-3 text-muted">
              L&apos;utilisateur peut supprimer son compte à tout moment depuis les paramètres de
              l&apos;application ou par email à <a href={`mailto:${LEGAL_INFO.contactEmail}`} className="text-accent underline">{LEGAL_INFO.contactEmail}</a>.
            </p>
            <p className="mt-3 text-muted">
              En cas de resiliation, les donnees sont traitees conformement a la{" "}
              <Link href="/confidentialite" className="text-accent underline">Politique de confidentialite</Link>{" "}
              (section 5).
            </p>
          </section>

          {/* 9. Modification */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">9. Modification des CGU</h2>
            <p className="text-muted">
              L&apos;Editeur se reserve le droit de modifier les presentes CGU. Les utilisateurs
              seront informes par notification dans l&apos;application au moins 30 jours avant
              l&apos;entree en vigueur des modifications. La poursuite de l&apos;utilisation apres
              cette date vaut acceptation.
            </p>
          </section>

          {/* 10. Droit applicable */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">10. Droit applicable et litiges</h2>
            <p className="text-muted">
              Les presentes CGU sont soumises au droit francais.
            </p>
            <p className="mt-3 text-muted">
              <strong className="text-foreground">Utilisateurs Pro (professionnels)</strong> : tout litige non
              resolu a l&apos;amiable sera soumis aux tribunaux competents du ressort du siege de l&apos;Editeur.
            </p>
            <p className="mt-3 text-muted">
              <strong className="text-foreground">Clients (consommateurs)</strong> : conformement a l&apos;article
              L. 612-1 du Code de la consommation, le consommateur peut recourir gratuitement a un mediateur.
              Plateforme de mediation en ligne :{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                ec.europa.eu/consumers/odr
              </a>.
              Le consommateur conserve le droit de saisir la juridiction competente de son domicile
              (art. R. 631-3 Code de la consommation).
            </p>
          </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">Liens utiles</h2>
          <ul className="space-y-1.5">
            <li><Link href="/mentions-legales" className="text-accent underline">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="text-accent underline">Politique de confidentialité</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
