"use client";

import SettingsPage from "@/components/SettingsPage";
import ChangelogView from "@/components/ChangelogView";

export default function ClientUpdatesPage() {
  return (
    <SettingsPage
      category="Nouveautés"
      title="Mises à jour"
      description="Découvrez les dernières améliorations de l'application et ce qui arrive prochainement."
    >
      <ChangelogView />
    </SettingsPage>
  );
}
