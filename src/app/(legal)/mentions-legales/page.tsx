"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted mb-8 hover:text-foreground">
          <ArrowLeft size={16} /> Retour
        </Link>

        <h1 className="text-[28px] font-bold text-foreground tracking-tight mb-2">Mentions legales</h1>
        <p className="text-[13px] text-muted mb-8">Conformement a l&apos;article 6 de la loi n 2004-575 du 21 juin 2004 (LCEN).</p>

        <div className="prose-legal space-y-8 text-[13px] text-foreground leading-relaxed">

          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">Editeur du site</h2>
            <p>
              Le site <strong>clientbase.fr</strong> est edite par <strong>Jodie Music</strong>, micro-entrepreneur
              au sens de l&apos;article L. 613-7 du Code de commerce.
            </p>
            <ul className="mt-3 space-y-1.5 text-muted">
              <li>SIRET : <span className="text-foreground font-medium">[A COMPLETER]</span></li>
              <li>Adresse : <span className="text-foreground font-medium">[A COMPLETER]</span></li>
              <li>Telephone : <span className="text-foreground font-medium">[A COMPLETER]</span></li>
              <li>Email : <span className="text-foreground font-medium">contact@clientbase.fr</span></li>
              <li>Directeur de la publication : <span className="text-foreground font-medium">Jodie Music</span></li>
            </ul>
            <p className="mt-3 text-muted">
              Dispense d&apos;immatriculation au RCS et au RM conformement a l&apos;article L. 123-1-1 du Code de commerce.
              <br />
              TVA : non applicable (franchise en base, article 293 B du CGI).
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">Hebergement</h2>
            <ul className="space-y-1.5 text-muted">
              <li><strong className="text-foreground">Application web</strong> : Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">vercel.com</a></li>
              <li><strong className="text-foreground">Base de donnees</strong> : Supabase Inc. — Region UE (AWS eu-west-1, Irlande)</li>
              <li><strong className="text-foreground">Emails transactionnels</strong> : Resend Inc.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">Propriete intellectuelle</h2>
            <p>
              L&apos;ensemble des elements du site (code source, design, textes, logos, marques, fonctionnalites)
              est la propriete exclusive de l&apos;editeur ou de ses concedants de licence. Toute reproduction,
              representation ou exploitation non autorisee est interdite au sens des articles L. 335-2 et suivants
              du Code de la propriete intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">Donnees personnelles</h2>
            <p>
              Les traitements de donnees personnelles sont decrits dans notre{" "}
              <Link href="/confidentialite" className="text-accent underline font-medium">Politique de confidentialite</Link>.
              <br />
              Point de contact donnees : <strong>dpo@clientbase.fr</strong>
              <br />
              Autorite de controle : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-accent underline">CNIL</a> — 3, Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">Cookies et stockage local</h2>
            <p>
              Ce site utilise exclusivement des cookies et du stockage local <strong>strictement necessaires</strong> au
              fonctionnement du service (authentification, maintien de session). Aucun cookie publicitaire, analytique
              ou de profilage n&apos;est utilise. Conformement a l&apos;article 82 de la loi Informatique et Libertes
              et aux recommandations de la CNIL du 17 septembre 2020, ces cookies ne requierent pas de consentement prealable.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">Liens utiles</h2>
            <ul className="space-y-1.5">
              <li><Link href="/confidentialite" className="text-accent underline">Politique de confidentialite</Link></li>
              <li><Link href="/cgu" className="text-accent underline">Conditions generales d&apos;utilisation</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
