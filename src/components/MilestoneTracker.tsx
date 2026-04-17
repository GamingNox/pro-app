"use client";

import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/lib/store";
import { MilestoneToast } from "./Confetti";

interface Milestone {
  key: string;
  title: string;
  subtitle: string;
}

const MILESTONES: { check: (c: number, a: number, r: number) => Milestone | null }[] = [
  { check: (c) => c >= 1 && { key: "client_1", title: "Premier client !", subtitle: "Votre aventure commence." } || null },
  { check: (c) => c >= 10 && { key: "client_10", title: "10 clients !", subtitle: "Votre carnet d'adresses grandit." } || null },
  { check: (c) => c >= 25 && { key: "client_25", title: "25 clients !", subtitle: "Un quart de centaine, bravo." } || null },
  { check: (c) => c >= 50 && { key: "client_50", title: "50 clients !", subtitle: "La communauté s'agrandit." } || null },
  { check: (c) => c >= 100 && { key: "client_100", title: "100 clients !", subtitle: "Le cap symbolique. Félicitations." } || null },
  { check: (_, a) => a >= 1 && { key: "appt_1", title: "Premier rendez-vous !", subtitle: "C'est parti." } || null },
  { check: (_, a) => a >= 10 && { key: "appt_10", title: "10 rendez-vous !", subtitle: "L'agenda se remplit." } || null },
  { check: (_, a) => a >= 50 && { key: "appt_50", title: "50 rendez-vous !", subtitle: "Vous êtes en pleine forme." } || null },
  { check: (_, a) => a >= 100 && { key: "appt_100", title: "100 rendez-vous !", subtitle: "Impressionnant." } || null },
  { check: (_, __, r) => r >= 1 && { key: "rev_1", title: "Première facture payée !", subtitle: "Les revenus commencent." } || null },
];

const STORAGE_KEY = "milestones_seen";

/**
 * Non-invasive milestone detector. Sits in the layout, reads counts from
 * the store, and triggers confetti + toast when a new milestone is reached.
 * Already-seen milestones are stored in localStorage.
 */
export default function MilestoneTracker() {
  const { clients, appointments, invoices, isDemo } = useApp();
  const [active, setActive] = useState<Milestone | null>(null);
  const [queue, setQueue] = useState<Milestone[]>([]);

  useEffect(() => {
    // Disable on demo account — seeded data triggers a confetti storm
    if (isDemo) return;
    // Don't trigger on initial empty state (before hydration)
    if (clients.length === 0 && appointments.length === 0) return;

    const seen: string[] = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();

    const doneCount = appointments.filter((a) => a.status === "done").length;
    const paidCount = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").length;
    const newMilestones: Milestone[] = [];

    for (const m of MILESTONES) {
      const result = m.check(clients.length, doneCount, paidCount);
      if (result && !seen.includes(result.key)) {
        newMilestones.push(result);
      }
    }

    if (newMilestones.length > 0) {
      // Mark all as seen
      const nextSeen = [...seen, ...newMilestones.map((m) => m.key)];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSeen)); } catch { /* ignore */ }
      // Queue them (show one at a time)
      setQueue(newMilestones);
    }
  }, [clients.length, appointments, invoices, isDemo]);

  // Show queue one by one
  useEffect(() => {
    if (active || queue.length === 0) return;
    setActive(queue[0]);
    setQueue((q) => q.slice(1));
  }, [active, queue]);

  const handleDone = useCallback(() => setActive(null), []);

  return (
    <MilestoneToast
      show={!!active}
      title={active?.title || ""}
      subtitle={active?.subtitle || ""}
      onDone={handleDone}
    />
  );
}
