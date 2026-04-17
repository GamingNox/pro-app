"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Shield, Smartphone, Trash2, MessageSquare, Download, AlertTriangle, Check, FileText } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SettingsRow, SaveButton } from "@/components/SettingsPage";
import { useApp } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SettingsPreferencesPage() {
  const { user, updateUser, clients, appointments, invoices, products, services, logout } = useApp();
  const [saved, setSaved] = useState(false);
  const [nRdv, setNRdv] = useState(true);
  const [nPay, setNPay] = useState(true);
  const [nStk, setNStk] = useState(true);
  const [nEmail, setNEmail] = useState(true);
  const [nPush, setNPush] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const chatEnabled = user.chatEnabled !== false;
  function toggleChat() { updateUser({ chatEnabled: !chatEnabled }); }
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  // ── RGPD Export (Art. 20 — portabilité) ────────────────
  async function handleExport() {
    setExporting(true);
    try {
      // Build CSV content
      const csvClients = [
        "prenom,nom,email,telephone,notes,date_creation",
        ...clients.map((c) =>
          [c.firstName, c.lastName, c.email, c.phone, `"${(c.notes || "").replace(/"/g, '""')}"`, c.createdAt].join(",")
        ),
      ].join("\n");

      const csvAppointments = [
        "titre,date,heure,duree_min,prix,statut,client_id,notes",
        ...appointments.map((a) =>
          [a.title, a.date, a.time, a.duration, a.price, a.status, a.clientId, `"${(a.notes || "").replace(/"/g, '""')}"`].join(",")
        ),
      ].join("\n");

      const csvInvoices = [
        "numero,description,montant,statut,date,client_id",
        ...invoices.map((i) =>
          [i.invoiceNumber || "", i.description, i.amount, i.status, i.date, i.clientId].join(",")
        ),
      ].join("\n");

      const csvProducts = [
        "nom,quantite,quantite_min,prix,categorie,emoji",
        ...products.map((p) =>
          [p.name, p.quantity, p.minQuantity, p.price, p.category, p.emoji].join(",")
        ),
      ].join("\n");

      const csvServices = [
        "nom,description,duree,prix,actif",
        ...services.map((s) =>
          [`"${s.name}"`, `"${(s.description || "").replace(/"/g, '""')}"`, s.duration, s.price, s.active].join(",")
        ),
      ].join("\n");

      const settingsJson = JSON.stringify({
        profil: { name: user.name, business: user.business, phone: user.phone, email: user.email, plan: user.plan },
        export_date: new Date().toISOString(),
        stats: {
          total_clients: clients.length,
          total_rdv: appointments.length,
          total_factures: invoices.length,
          total_produits: products.length,
          total_services: services.length,
        },
      }, null, 2);

      // Build ZIP using JSZip-like manual approach (Blob-based, no dependency)
      // Since we can't import JSZip, we'll create individual downloads
      // Actually: generate a single JSON file containing everything (simplest RGPD export)
      const fullExport = JSON.stringify({
        export_date: new Date().toISOString(),
        export_format: "Client Base RGPD Export — Article 20 du Reglement (UE) 2016/679",
        profil: { name: user.name, business: user.business, phone: user.phone, email: user.email, plan: user.plan, bookingSlug: user.bookingSlug },
        clients: clients.map((c) => ({ prenom: c.firstName, nom: c.lastName, email: c.email, telephone: c.phone, notes: c.notes, date_creation: c.createdAt })),
        rendez_vous: appointments.map((a) => ({ titre: a.title, date: a.date, heure: a.time, duree: a.duration, prix: a.price, statut: a.status, notes: a.notes })),
        factures: invoices.filter((i) => i.clientId !== "__expense__").map((i) => ({ description: i.description, montant: i.amount, statut: i.status, date: i.date })),
        depenses: invoices.filter((i) => i.clientId === "__expense__").map((i) => ({ description: i.description, montant: i.amount, date: i.date })),
        produits: products.map((p) => ({ nom: p.name, quantite: p.quantity, prix: p.price, categorie: p.category })),
        services: services.map((s) => ({ nom: s.name, description: s.description, duree: s.duration, prix: s.price, actif: s.active })),
      }, null, 2);

      // Also build CSVs as separate blobs in a faux-ZIP (or just one JSON)
      // Most RGPD compliance just needs machine-readable structured data — JSON is perfect.
      const blob = new Blob([fullExport], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clientbase-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Also download a CSV bundle
      const csvBundle = `=== CLIENTS ===\n${csvClients}\n\n=== RENDEZ-VOUS ===\n${csvAppointments}\n\n=== FACTURES ===\n${csvInvoices}\n\n=== PRODUITS ===\n${csvProducts}\n\n=== SERVICES ===\n${csvServices}\n\n=== PARAMETRES ===\n${settingsJson}`;
      const csvBlob = new Blob([csvBundle], { type: "text/csv;charset=utf-8" });
      const csvUrl = URL.createObjectURL(csvBlob);
      const csvA = document.createElement("a");
      csvA.href = csvUrl;
      csvA.download = `clientbase-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(csvA);
      csvA.click();
      csvA.remove();
      URL.revokeObjectURL(csvUrl);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      console.error("[export] failed:", e);
    }
    setExporting(false);
  }

  // ── Account deletion (Art. 17 — droit à l'effacement) ──
  async function handleDeleteAccount() {
    if (deleteConfirmText !== "SUPPRIMER") return;
    setDeleting(true);
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Delete all user data from Supabase tables (cascading from user_profiles won't
        // delete everything since some tables are user_id based without FK CASCADE)
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
          supabase.from("beta_requests").delete().eq("user_id", uid),
          supabase.from("beta_reports").delete().eq("user_id", uid),
          supabase.from("messages").delete().eq("sender_id", uid),
        ]);
        // Delete the profile itself
        await supabase.from("user_profiles").delete().eq("id", uid);

        // Delete from auth.users via server route (requires service role key)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetch("/api/account/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ userId: uid }),
            });
          }
        } catch {
          // Best-effort — if auth deletion fails, data is already gone
          console.warn("[delete-account] auth.users deletion failed (best-effort)");
        }
      }
      // Clear all localStorage
      localStorage.clear();
      // Log out
      logout();
    } catch (e) {
      console.error("[delete-account] failed:", e);
      setDeleting(false);
    }
  }

  return (
    <SettingsPage
      category="Application"
      title="Préférences"
      description="Configurez les notifications, la confidentialité et le comportement de l'application."
    >
      {/* Notifications */}
      <SettingsSection title="Notifications" description="Choisissez les alertes que vous souhaitez recevoir.">
        <SettingsRow label="Nouveau rendez-vous" hint="Alerte lors d'une nouvelle réservation.">
          <SettingsToggle on={nRdv} onToggle={() => setNRdv(!nRdv)} />
        </SettingsRow>
        <SettingsRow label="Paiement reçu" hint="Confirmation de paiement.">
          <SettingsToggle on={nPay} onToggle={() => setNPay(!nPay)} />
        </SettingsRow>
        <SettingsRow label="Alerte stock" hint="Quand un produit est en rupture." last>
          <SettingsToggle on={nStk} onToggle={() => setNStk(!nStk)} />
        </SettingsRow>
      </SettingsSection>

      {/* Messagerie */}
      <SettingsSection title="Messagerie" description="Contrôlez si vos clients peuvent vous contacter directement.">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
            <MessageSquare size={15} className="text-accent" />
          </div>
          <p className="text-[12px] text-muted leading-relaxed">
            La messagerie est activée uniquement pour les clients ayant un rendez-vous confirmé. Vous pouvez la désactiver à tout moment.
          </p>
        </div>
        <SettingsRow label="Activer la messagerie" hint="Permet aux clients avec un RDV de vous envoyer des messages." last>
          <SettingsToggle on={chatEnabled} onToggle={toggleChat} />
        </SettingsRow>
      </SettingsSection>

      {/* Channels */}
      <SettingsSection title="Canaux">
        <SettingsRow label="Email" hint="Recevoir les notifications par email.">
          <SettingsToggle on={nEmail} onToggle={() => setNEmail(!nEmail)} />
        </SettingsRow>
        <SettingsRow label="Push" hint="Notifications sur votre appareil." last>
          <SettingsToggle on={nPush} onToggle={() => setNPush(!nPush)} />
        </SettingsRow>
      </SettingsSection>

      {/* Privacy + Export */}
      <SettingsSection title="Confidentialité & données" description="Vos données vous appartiennent. Exportez-les ou supprimez votre compte.">
        <div className="flex items-start gap-3 mb-4">
          <Shield size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-muted leading-relaxed">
            Vos données sont chiffrées et stockées en Europe (UE). Nous ne vendons et ne partageons jamais vos informations.
            Consultez notre <Link href="/confidentialite" className="text-accent underline font-semibold">Politique de confidentialité</Link>.
          </p>
        </div>

        {/* Export RGPD */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 disabled:opacity-60 mb-2"
          style={{
            backgroundColor: exported ? "#D1FAE5" : "var(--color-primary-soft)",
            color: exported ? "#047857" : "var(--color-primary-deep)",
            border: exported ? "1px solid #10B981" : "1px solid var(--color-primary)",
          }}
        >
          {exporting ? (
            <><div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> Export en cours...</>
          ) : exported ? (
            <><Check size={14} strokeWidth={2.8} /> 2 fichiers téléchargés (JSON + CSV)</>
          ) : (
            <><Download size={14} /> Télécharger toutes mes données</>
          )}
        </motion.button>
        <p className="text-[10px] text-muted text-center mb-4">
          Article 20 RGPD — Droit à la portabilité. Vous recevez un fichier JSON structuré + un CSV lisible.
        </p>

        {/* Legal links */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { href: "/mentions-legales", label: "Mentions légales" },
            { href: "/confidentialite", label: "Confidentialité" },
            { href: "/cgu", label: "CGU" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{ backgroundColor: "var(--color-border-light)", color: "var(--color-muted)" }}
            >
              <FileText size={10} /> {l.label}
            </Link>
          ))}
        </div>
      </SettingsSection>

      {/* Danger zone */}
      <SettingsSection title="Zone danger">
        <AnimatePresence>
          {!showDeleteConfirm ? (
            <motion.button
              key="delete-btn"
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-danger-soft text-danger py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2"
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
                    <p className="text-[13px] font-bold text-danger">Suppression irréversible</p>
                    <p className="text-[11px] text-foreground mt-1 leading-relaxed">
                      Toutes vos données seront supprimées définitivement : clients, rendez-vous, factures, services, avis, produits. Cette action est irréversible.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted mb-2">Tapez <strong className="text-danger">SUPPRIMER</strong> pour confirmer :</p>
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
                    className="flex-1 bg-white border border-border py-2.5 rounded-xl text-[12px] font-bold text-foreground"
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "SUPPRIMER" || deleting}
                    className="flex-1 bg-danger text-white py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {deleting ? "Suppression..." : <><Trash2 size={13} /> Confirmer</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-[10px] text-muted mt-2 text-center">
          Article 17 RGPD — Droit à l&apos;effacement. Vos données seront supprimées sous 30 jours.
        </p>
      </SettingsSection>

      <SaveButton onClick={flash} saving={saved} />
    </SettingsPage>
  );
}
