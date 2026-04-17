"use client";

import SettingsPage from "@/components/SettingsPage";
import ChangelogView from "@/components/ChangelogView";

export default function SettingsUpdatesPage() {
  return (
    <SettingsPage
      category="Nouveautés"
      title="Mises à jour"
      description="Découvrez les dernières améliorations et ce qui arrive prochainement sur Client Base."
    >
      <ChangelogView />
    </SettingsPage>
  );
}
