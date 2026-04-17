"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, MessageSquare, Download, AlertTriangle, Check } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SettingsRow } from "@/components/SettingsPage";
import { useApp } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export default function SettingsPreferencesPage() {
  const { user, updateUser, clients, appointments, invoices, products, services, logout } = useApp();

  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const chatEnabled = user.chatEnabled !== false;

  async function handleExport() {
    setExporting(true);
    try {
      const payload = {
        export_date: new Date().toISOString(),
        profil: { name: user.name, business: user.business, phone: user.phone, email: user.email, plan: user.plan },
        clients: clients.map((c) => ({ prenom: c.firstName, nom: c.lastName, email: c.email, telephone: c.phone, notes: c.notes })),
        rendez_vous: appointments.map((a) => ({ titre: a.title, date: a.date, heure: a.time, duree: a.duration, prix: a.price, statut: a.status })),
        factures: invoices.filter((i) => i.clientId !== "__expense__").map((i) => ({ description: i.description, montant: i.amount, statut: i.status, date: i.date })),
        produits: products.map((p) => ({ nom: p.name, quantite: p.quantity, prix: p.price })),
        services: services.map((s) => ({ nom: s.name, duree: s.duration, prix: s.price })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clientbase-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      console.error("[export] failed:", e);
    }
    setExporting(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "SUPPRIMER") return;
    setDeleting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const uid = authUser.id;
        await Promise.all([
          supabase.from("appointments").delete().eq("user_id", uid),
          supabase.from("invoices").delete().eq("user_id", uid),
          supabase.from("clients").delete().eq("user_id", uid),
          supabase.from("products").delete().eq("user_id", uid),
          supabase.from("services").delete().eq("user_id", uid),
          supabase.from("loyalty_templates").delete().eq("user_id", uid),
          supabase.from("loyalty_cards").delete().eq("user_id", uid),
          supabase.from("push_subscriptions").delete().eq("user_id", uid),
          supabase.from("waitlist").delete().eq("user_id", uid),
          supabase.from("reviews").delete().eq("user_id", uid),
        ]);
        await supabase.from("user_profiles").delete().eq("id", uid);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetch("/api/account/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ userId: uid }),
            });
          }
        } catch { /* best effort */ }
      }
      localStorage.clear();
      logout();
    } catch (e) {
      console.error("[delete-account] failed:", e);
      setDeleting(false);
    }
  }

  return (
    <SettingsPage
      category="Mon compte"
      title="Préférences"
      description="Messagerie et gestion de votre compte."
    >
      <SettingsSection title="Messagerie" description="Les clients avec un RDV confirmé peuvent vous écrire.">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
            <MessageSquare size={15} className="text-accent" />
          </div>
          <p className="text-[13px] text-muted leading-relaxed">
            Désactivez si vous ne voulez pas recevoir de messages dans l&apos;application.
          </p>
        </div>
        <SettingsRow label="Activer la messagerie" last>
          <SettingsToggle on={chatEnabled} onToggle={() => updateUser({ chatEnabled: !chatEnabled })} />
        </SettingsRow>
      </SettingsSection>

      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setShowAdvanced((v) => !v)}
        className="w-full text-center text-[12px] text-muted font-bold py-3 mb-3"
      >
        {showAdvanced ? "Masquer les options avancées" : "Afficher les options avancées"}
      </motion.button>

      {showAdvanced && (
        <>
          <SettingsSection title="Mes données" description="Exportez ou supprimez vos informations.">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-60 mb-3"
              style={{
                backgroundColor: exported ? "#D1FAE5" : "var(--color-primary-soft)",
                color: exported ? "#047857" : "var(--color-primary-deep)",
                border: exported ? "1px solid #10B981" : "1px solid var(--color-primary)",
              }}
            >
              {exporting ? (
                <><div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> Export en cours…</>
              ) : exported ? (
                <><Check size={14} strokeWidth={2.8} /> Fichier téléchargé</>
              ) : (
                <><Download size={14} /> Télécharger toutes mes données</>
              )}
            </motion.button>

            <AnimatePresence>
              {!showDeleteConfirm ? (
                <motion.button
                  key="delete-btn"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-danger-soft text-danger py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Supprimer mon compte
                </motion.button>
              ) : (
                <motion.div
                  key="delete-confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="rounded-xl p-4" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                    <div className="flex items-start gap-2.5 mb-3">
                      <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-bold text-danger">Suppression définitive</p>
                        <p className="text-[12px] text-foreground mt-1 leading-relaxed">
                          Toutes vos données seront supprimées : clients, rendez-vous, factures, services, produits.
                        </p>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted mb-2">Tapez <strong className="text-danger">SUPPRIMER</strong> pour confirmer :</p>
                    <input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="SUPPRIMER"
                      className="input-field mb-3 text-center text-[13px] font-bold"
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                        className="flex-1 bg-white border border-border py-2.5 rounded-xl text-[13px] font-bold text-foreground"
                      >
                        Annuler
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "SUPPRIMER" || deleting}
                        className="flex-1 bg-danger text-white py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40 flex items-center justify-center gap-1.5"
                      >
                        {deleting ? "Suppression…" : <><Trash2 size={13} /> Confirmer</>}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SettingsSection>
        </>
      )}
    </SettingsPage>
  );
}
