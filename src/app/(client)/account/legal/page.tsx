"use client";

import { Shield, FileText, Lock, Mail } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function ClientLegalPage() {
  return (
    <SettingsPage
      category="Informations"
      title="Mentions legales"
      description="Informations juridiques, confidentialite et utilisation de vos donnees."
    >
      <SettingsSection title="Confidentialite" description="Comment nous protegeons vos donnees.">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center flex-shrink-0">
              <Lock size={15} className="text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-foreground">Donnees chiffrees</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Toutes vos donnees personnelles sont chiffrees et stockees sur des serveurs securises en Europe.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center flex-shrink-0">
              <Shield size={15} className="text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-foreground">Conforme RGPD</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Vous pouvez demander a tout moment l&apos;acces, la rectification ou la suppression de vos donnees.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Documents">
        <div className="space-y-3">
          <a
            href="/cgu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-border-light rounded-xl hover:bg-border transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <FileText size={15} className="text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-foreground">Conditions generales d&apos;utilisation</p>
              <p className="text-[10px] text-muted mt-0.5">Mise a jour le {new Date().toLocaleDateString("fr-FR")}</p>
            </div>
          </a>
          <a
            href="/confidentialite"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-border-light rounded-xl hover:bg-border transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Lock size={15} className="text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-foreground">Politique de confidentialite</p>
              <p className="text-[10px] text-muted mt-0.5">Comment vos donnees sont traitees</p>
            </div>
          </a>
        </div>
      </SettingsSection>

      <SettingsSection title="Contact">
        <a
          href="mailto:support@clientbase.app"
          className="flex items-center gap-3 p-3 bg-border-light rounded-xl hover:bg-border transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
            <Mail size={15} className="text-muted" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-foreground">support@clientbase.app</p>
            <p className="text-[10px] text-muted mt-0.5">Pour toute question sur vos donnees</p>
          </div>
        </a>
      </SettingsSection>

      <div className="text-center pb-4">
        <p className="text-[10px] text-subtle">&copy; {new Date().getFullYear()} Client Base · v1.0</p>
      </div>
    </SettingsPage>
  );
}
