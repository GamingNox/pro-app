"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_INFO } from "@/lib/legal-info";

export default function ConfidentialitePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
      <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted mb-8 hover:text-foreground">
        <ArrowLeft size={16} /> Retour
      </Link>

      <h1 className="text-[28px] font-bold text-foreground tracking-tight mb-2">Politique de confidentialité</h1>
      <p className="text-[13px] text-muted mb-8">
        Règlement (UE) 2016/679 (RGPD) — Articles 13 et 14.
        <br />Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
      </p>

      <div className="prose-legal space-y-8 text-[13px] text-foreground leading-relaxed">

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">1. Responsable du traitement</h2>
          <p>
            <strong>{LEGAL_INFO.companyName}</strong><br />
            Adresse : {LEGAL_INFO.address}<br />
            Email : <a href={`mailto:${LEGAL_INFO.dpoEmail}`} className="text-accent underline font-medium">{LEGAL_INFO.dpoEmail}</a> (point de contact données personnelles)
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">2. Données collectées et finalités</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-bold text-muted">Données</th>
                  <th className="text-left py-2 pr-3 font-bold text-muted">Finalité</th>
                  <th className="text-left py-2 font-bold text-muted">Base légale</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-3 text-foreground">Nom, prénom, email, téléphone</td>
                  <td className="py-2 pr-3">Création et gestion du compte</td>
                  <td className="py-2">Exécution du contrat (Art. 6.1.b)</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-3 text-foreground">Historique RDV, préférences</td>
                  <td className="py-2 pr-3">Fourniture du service de réservation</td>
                  <td className="py-2">Exécution du contrat (Art. 6.1.b)</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-3 text-foreground">Données de facturation</td>
                  <td className="py-2 pr-3">Émission et suivi des factures</td>
                  <td className="py-2">Obligation légale (Art. 6.1.c)</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-3 text-foreground">Données de connexion (IP, user-agent)</td>
                  <td className="py-2 pr-3">Sécurité et diagnostic</td>
                  <td className="py-2">Intérêt légitime (Art. 6.1.f)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-foreground">Jeton de session</td>
                  <td className="py-2 pr-3">Authentification</td>
                  <td className="py-2">Exécution du contrat (Art. 6.1.b)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">3. Destinataires et sous-traitants</h2>
          <ul className="space-y-1.5 text-muted">
            <li><strong className="text-foreground">Supabase Inc.</strong> — Hébergement et base de données (UE, région eu-west-1, Irlande). DPA en place.</li>
            <li><strong className="text-foreground">Vercel Inc.</strong> — Hébergement de l&apos;application web. Clauses contractuelles types (SCCs).</li>
            <li><strong className="text-foreground">Resend Inc.</strong> — Envoi d&apos;emails transactionnels. SCCs en place.</li>
          </ul>
          <p className="mt-3 text-muted">
            Aucune donnée n&apos;est vendue ni cédée à des tiers à des fins commerciales.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">4. Transferts hors UE</h2>
          <p className="text-muted">
            Les transferts vers les États-Unis (Vercel, Resend) sont encadrés par les clauses contractuelles types
            de la Commission européenne (décision 2021/914) et, le cas échéant, par le EU-US Data Privacy Framework.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">5. Durées de conservation</h2>
          <ul className="space-y-1.5 text-muted">
            <li><strong className="text-foreground">Compte actif</strong> : durée de la relation contractuelle + 3 ans après la dernière activité.</li>
            <li><strong className="text-foreground">Facturation</strong> : 10 ans (obligation comptable, art. L. 123-22 Code de commerce).</li>
            <li><strong className="text-foreground">Logs de connexion</strong> : 12 mois (décret n° 2011-219).</li>
            <li><strong className="text-foreground">Après suppression du compte</strong> : anonymisation sous 30 jours, sauf obligations légales.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">6. Vos droits (Art. 15 à 22 RGPD)</h2>
          <ul className="space-y-1.5 text-muted">
            <li><strong className="text-foreground">Accès</strong> : obtenir confirmation du traitement et copie de vos données.</li>
            <li><strong className="text-foreground">Rectification</strong> : corriger des données inexactes ou incomplètes.</li>
            <li><strong className="text-foreground">Effacement</strong> : demander la suppression, sous réserve des obligations légales.</li>
            <li><strong className="text-foreground">Limitation</strong> : restreindre le traitement dans les cas prévus à l&apos;article 18.</li>
            <li><strong className="text-foreground">Portabilité</strong> : recevoir vos données dans un format structuré et lisible par machine.</li>
            <li><strong className="text-foreground">Opposition</strong> : vous opposer au traitement fondé sur l&apos;intérêt légitime.</li>
            <li><strong className="text-foreground">Retrait du consentement</strong> : à tout moment, sans affecter la licéité du traitement antérieur.</li>
          </ul>
          <p className="mt-3 text-muted">
            Pour exercer vos droits : <a href={`mailto:${LEGAL_INFO.dpoEmail}`} className="text-accent underline font-medium">{LEGAL_INFO.dpoEmail}</a>. Réponse sous 30 jours.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">7. Réclamation</h2>
          <p className="text-muted">
            Vous pouvez introduire une réclamation auprès de la{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-accent underline">CNIL</a>{" "}
            — 3, Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground mb-3">Liens utiles</h2>
          <ul className="space-y-1.5">
            <li><Link href="/mentions-legales" className="text-accent underline">Mentions légales</Link></li>
            <li><Link href="/cgu" className="text-accent underline">Conditions générales d&apos;utilisation</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
