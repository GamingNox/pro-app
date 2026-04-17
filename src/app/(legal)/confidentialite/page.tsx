"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted mb-8 hover:text-foreground">
          <ArrowLeft size={16} /> Retour
        </Link>

        <h1 className="text-[28px] font-bold text-foreground tracking-tight mb-2">Politique de confidentialite</h1>
        <p className="text-[13px] text-muted mb-8">
          Reglement (UE) 2016/679 (RGPD) — Articles 13 et 14.
          <br />Derniere mise a jour : 16 avril 2026.
        </p>

        <div className="prose-legal space-y-8 text-[13px] text-foreground leading-relaxed">

          {/* 1. Responsable */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">1. Responsable du traitement</h2>
            <p>
              <strong>Jodie Music</strong>, micro-entrepreneur<br />
              Adresse : [A COMPLETER]<br />
              Email : <strong>dpo@clientbase.fr</strong> (point de contact donnees personnelles)
            </p>
          </section>

          {/* 2. Donnees collectees */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">2. Donnees collectees et finalites</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-bold text-muted">Donnees</th>
                    <th className="text-left py-2 pr-3 font-bold text-muted">Finalite</th>
                    <th className="text-left py-2 font-bold text-muted">Base legale</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-border-light">
                    <td className="py-2 pr-3 text-foreground">Nom, prenom, email, telephone</td>
                    <td className="py-2 pr-3">Creation et gestion du compte</td>
                    <td className="py-2">Execution du contrat (Art. 6.1.b)</td>
                  </tr>
                  <tr className="border-b border-border-light">
                    <td className="py-2 pr-3 text-foreground">Historique RDV, preferences</td>
                    <td className="py-2 pr-3">Fourniture du service de reservation</td>
                    <td className="py-2">Execution du contrat (Art. 6.1.b)</td>
                  </tr>
                  <tr className="border-b border-border-light">
                    <td className="py-2 pr-3 text-foreground">Donnees de facturation</td>
                    <td className="py-2 pr-3">Emission et suivi des factures</td>
                    <td className="py-2">Obligation legale (Art. 6.1.c)</td>
                  </tr>
                  <tr className="border-b border-border-light">
                    <td className="py-2 pr-3 text-foreground">Donnees de connexion (IP, user-agent)</td>
                    <td className="py-2 pr-3">Securite et diagnostic</td>
                    <td className="py-2">Interet legitime (Art. 6.1.f)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-foreground">Jeton de session</td>
                    <td className="py-2 pr-3">Authentification</td>
                    <td className="py-2">Execution du contrat (Art. 6.1.b)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Destinataires */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">3. Destinataires et sous-traitants</h2>
            <ul className="space-y-1.5 text-muted">
              <li><strong className="text-foreground">Supabase Inc.</strong> — Hebergement et base de donnees (UE, region eu-west-1, Irlande). DPA en place.</li>
              <li><strong className="text-foreground">Vercel Inc.</strong> — Hebergement de l&apos;application web. Clauses contractuelles types (SCCs).</li>
              <li><strong className="text-foreground">Resend Inc.</strong> — Envoi d&apos;emails transactionnels. SCCs en place.</li>
              <li><strong className="text-foreground">Stripe / PayPal</strong> — Traitement des paiements. Aucune donnee bancaire ne transite par clientbase.fr.</li>
            </ul>
            <p className="mt-3 text-muted">
              Aucune donnee n&apos;est vendue ni cedee a des tiers a des fins commerciales.
            </p>
          </section>

          {/* 4. Transferts */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">4. Transferts hors UE</h2>
            <p className="text-muted">
              Les transferts vers les Etats-Unis (Vercel, Resend) sont encadres par les clauses contractuelles types
              de la Commission europeenne (decision 2021/914) et, le cas echeant, par le EU-US Data Privacy Framework.
            </p>
          </section>

          {/* 5. Conservation */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">5. Durees de conservation</h2>
            <ul className="space-y-1.5 text-muted">
              <li><strong className="text-foreground">Compte actif</strong> : duree de la relation contractuelle + 3 ans apres la derniere activite.</li>
              <li><strong className="text-foreground">Facturation</strong> : 10 ans (obligation comptable, art. L. 123-22 Code de commerce).</li>
              <li><strong className="text-foreground">Logs de connexion</strong> : 12 mois (decret n 2011-219).</li>
              <li><strong className="text-foreground">Apres suppression du compte</strong> : anonymisation sous 30 jours, sauf obligations legales.</li>
            </ul>
          </section>

          {/* 6. Droits */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">6. Vos droits (Art. 15 a 22 RGPD)</h2>
            <ul className="space-y-1.5 text-muted">
              <li><strong className="text-foreground">Acces</strong> : obtenir confirmation du traitement et copie de vos donnees.</li>
              <li><strong className="text-foreground">Rectification</strong> : corriger des donnees inexactes ou incompletes.</li>
              <li><strong className="text-foreground">Effacement</strong> : demander la suppression, sous reserve des obligations legales.</li>
              <li><strong className="text-foreground">Limitation</strong> : restreindre le traitement dans les cas prevus a l&apos;article 18.</li>
              <li><strong className="text-foreground">Portabilite</strong> : recevoir vos donnees dans un format structure et lisible par machine.</li>
              <li><strong className="text-foreground">Opposition</strong> : vous opposer au traitement fonde sur l&apos;interet legitime.</li>
              <li><strong className="text-foreground">Retrait du consentement</strong> : a tout moment, sans affecter la licite du traitement anterieur.</li>
            </ul>
            <p className="mt-3 text-muted">
              Pour exercer vos droits : <strong className="text-foreground">dpo@clientbase.fr</strong>. Reponse sous 30 jours.
            </p>
          </section>

          {/* 7. Reclamation */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">7. Reclamation</h2>
            <p className="text-muted">
              Vous pouvez introduire une reclamation aupres de la{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-accent underline">CNIL</a>{" "}
              — 3, Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
            </p>
          </section>

          {/* Links */}
          <section>
            <h2 className="text-[16px] font-bold text-foreground mb-3">Liens utiles</h2>
            <ul className="space-y-1.5">
              <li><Link href="/mentions-legales" className="text-accent underline">Mentions legales</Link></li>
              <li><Link href="/cgu" className="text-accent underline">Conditions generales d&apos;utilisation</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
