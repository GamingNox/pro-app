"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_INFO } from "@/lib/legal-info";

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
      <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted mb-8 hover:text-foreground">
        <ArrowLeft size={16} /> Retour
      </Link>

      <h1 className="text-[28px] font-bold text-foreground tracking-tight mb-2">Mentions légales</h1>
      <p className="text-[13px] text-muted mb-8">Conformément à l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 (LCEN).</p>

      <div className="prose-legal space-y-8 text-[13px] text-foreground leading-relaxed">

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">Éditeur du site</h2>
          <p>
            Le site <strong>{LEGAL_INFO.domain}</strong> est édité par <strong>{LEGAL_INFO.companyName}</strong>.
          </p>
          <ul className="mt-3 space-y-1.5 text-muted">
            <li>Forme juridique : <span className="text-foreground font-medium">{LEGAL_INFO.legalForm}</span></li>
            <li>SIRET : <span className="text-foreground font-medium">{LEGAL_INFO.siret}</span></li>
            <li>Adresse : <span className="text-foreground font-medium">{LEGAL_INFO.address}</span></li>
            <li>Téléphone : <span className="text-foreground font-medium">{LEGAL_INFO.phone}</span></li>
            <li>Email : <a href={`mailto:${LEGAL_INFO.contactEmail}`} className="text-accent underline font-medium">{LEGAL_INFO.contactEmail}</a></li>
            <li>Directeur de la publication : <span className="text-foreground font-medium">{LEGAL_INFO.publicationDirector}</span></li>
          </ul>
          <p className="mt-3 text-muted">
            TVA : <span className="text-foreground font-medium">{LEGAL_INFO.vat}</span>
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">Hébergement</h2>
          <ul className="space-y-1.5 text-muted">
            <li>
              <strong className="text-foreground">Application web</strong> : {LEGAL_INFO.host.name} — {LEGAL_INFO.host.address} —{" "}
              <a href={LEGAL_INFO.host.website} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                {LEGAL_INFO.host.website.replace(/^https?:\/\//, "")}
              </a>
            </li>
            <li><strong className="text-foreground">Base de données</strong> : Supabase Inc. — Région UE (AWS eu-west-1, Irlande)</li>
            <li><strong className="text-foreground">Emails transactionnels</strong> : Resend Inc.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des éléments du site (code source, design, textes, logos, marques, fonctionnalités)
            est la propriété exclusive de l&apos;éditeur ou de ses concédants de licence. Toute reproduction,
            représentation ou exploitation non autorisée est interdite au sens des articles L. 335-2 et suivants
            du Code de la propriété intellectuelle.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">Données personnelles</h2>
          <p>
            Les traitements de données personnelles sont décrits dans notre{" "}
            <Link href="/confidentialite" className="text-accent underline font-medium">Politique de confidentialité</Link>.
            <br />
            Point de contact données : <a href={`mailto:${LEGAL_INFO.dpoEmail}`} className="text-accent underline font-medium">{LEGAL_INFO.dpoEmail}</a>
            <br />
            Autorité de contrôle : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-accent underline">CNIL</a> — 3, Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">Cookies et stockage local</h2>
          <p>
            Ce site utilise exclusivement des cookies et du stockage local <strong>strictement nécessaires</strong> au
            fonctionnement du service (authentification, maintien de session). Aucun cookie publicitaire, analytique
            ou de profilage n&apos;est utilisé. Conformément à l&apos;article 82 de la loi Informatique et Libertés
            et aux recommandations de la CNIL du 17 septembre 2020, ces cookies ne requièrent pas de consentement préalable.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">Liens utiles</h2>
          <ul className="space-y-1.5">
            <li><Link href="/confidentialite" className="text-accent underline">Politique de confidentialité</Link></li>
            <li><Link href="/cgu" className="text-accent underline">Conditions générales d&apos;utilisation</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
