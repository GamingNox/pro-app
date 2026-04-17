"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, Bug, MessageSquareHeart, Lightbulb, CheckCircle2, Clock, X, ArrowRight, Send, Loader2 } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";
import { useApp } from "@/lib/store";
import { submitBetaRequest } from "@/lib/beta";
import { notifyAdmin } from "@/lib/notify";

export default function SettingsBetaTesterPage() {
  const { user, updateUser, userId, refreshUserProfile } = useApp();
  const router = useRouter();
  const status = user.betaStatus || "none";

  const [motivation, setMotivation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [experience, setExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Always refetch on mount — guarantees the page never shows a stale
  // "pending" state after the admin has already decided in the meantime.
  useEffect(() => {
    void refreshUserProfile();
  }, [refreshUserProfile]);

  async function handleSubmit() {
    if (!motivation.trim()) {
      setErrorMsg("Expliquez en quelques mots votre motivation.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    if (!userId) {
      // Demo / not authed — optimistically flip local state only
      updateUser({ betaStatus: "pending" });
      setSubmitting(false);
      return;
    }

    const res = await submitBetaRequest(userId, {
      motivation: motivation.trim(),
      feedback: feedback.trim() || undefined,
      experience: experience.trim() || undefined,
    });

    if (!res.ok) {
      if (res.error === "duplicate") {
        // The user already had a pending/approved request — refresh to the real state
        await refreshUserProfile();
        setErrorMsg("Vous avez déjà une demande en cours.");
      } else if (res.error === "schema_missing") {
        setErrorMsg("Le système bêta n'est pas encore configuré côté serveur. Contactez l'administrateur.");
      } else {
        setErrorMsg(res.message || "Impossible d'envoyer la demande. Réessayez plus tard.");
      }
      setSubmitting(false);
      return;
    }

    // Success — re-read from DB so the page flips to the "pending" branch
    updateUser({ betaStatus: "pending" });
    await refreshUserProfile();

    // Admin email notification (fire-and-forget)
    notifyAdmin({
      type: "beta_request",
      userName: user.name,
      userEmail: user.email,
      message: motivation.trim(),
      metadata: {
        business: user.business,
        has_feedback: Boolean(feedback.trim()),
        has_experience: Boolean(experience.trim()),
      },
    });

    setSubmitting(false);
  }

  // ── Approved: show "Espace bêta" CTA ─────────────────
  if (status === "approved") {
    return (
      <SettingsPage category="Bêta testeur" title="Vous êtes bêta testeur" description="Merci de nous aider à construire la meilleure version de Client Base. Votre accès à l'Espace bêta est actif.">
        <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-deep) 100%)", boxShadow: "0 14px 36px color-mix(in srgb, var(--color-primary) 35%, transparent)" }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -left-6 -bottom-10 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">Accès débloqué</p>
            </div>
            <h3 className="text-[20px] font-bold leading-tight">Espace bêta disponible</h3>
            <p className="text-[12px] text-white/80 mt-1.5 leading-relaxed max-w-[280px]">
              Signalez les bugs, partagez vos idées, suggérez des fonctionnalités. Vos retours façonnent l'app.
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/beta-space")}
              className="mt-4 bg-white text-[13px] font-bold px-5 py-2.5 rounded-xl flex items-center gap-2"
              style={{ color: "var(--color-primary-deep)" }}>
              Ouvrir l'Espace bêta <ArrowRight size={14} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

        <SettingsSection title="Votre mission">
          <div className="space-y-3">
            {[
              { Icon: Bug, title: "Signaler les bugs", desc: "Dès que vous croisez une anomalie, un clic suffit." },
              { Icon: MessageSquareHeart, title: "Partager vos retours", desc: "Ce qui fonctionne, ce qui ne fonctionne pas." },
              { Icon: Lightbulb, title: "Suggérer des améliorations", desc: "Vos idées sont lues et priorisées." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-accent" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground">{title}</p>
                  <p className="text-[11px] text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>
      </SettingsPage>
    );
  }

  // ── Pending: show waiting card ───────────────────────
  if (status === "pending") {
    return (
      <SettingsPage category="Bêta testeur" title="Demande en cours" description="Nous examinons votre candidature. Vous recevrez une notification dès qu'une décision sera prise.">
        <div className="bg-white rounded-2xl p-6 shadow-card-premium text-center mb-5">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F3F0FF" }}>
            <Clock size={28} style={{ color: "var(--color-primary)" }} strokeWidth={2.2} />
          </div>
          <h3 className="text-[18px] font-bold text-foreground">Demande envoyée</h3>
          <p className="text-[12px] text-muted mt-2 max-w-[280px] mx-auto leading-relaxed">
            Merci pour votre intérêt. Notre équipe étudie votre demande — cela prend généralement 24 à 48h.
          </p>
        </div>
        <p className="text-[11px] text-muted text-center leading-relaxed">
          Vous pouvez continuer à utiliser Client Base normalement. L'accès bêta s'activera automatiquement après approbation.
        </p>
      </SettingsPage>
    );
  }

  // ── Rejected: show info + allow re-apply ─────────────
  if (status === "rejected") {
    return (
      <SettingsPage category="Bêta testeur" title="Demande non retenue" description="Votre précédente demande n'a pas été approuvée. Vous pouvez soumettre une nouvelle candidature.">
        <div className="bg-white rounded-2xl p-6 shadow-card-premium text-center mb-5">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-border-light">
            <X size={28} className="text-muted" />
          </div>
          <h3 className="text-[18px] font-bold text-foreground">Demande refusée</h3>
          <p className="text-[12px] text-muted mt-2 max-w-[280px] mx-auto leading-relaxed">
            Notre équipe ne retient que quelques testeurs à la fois. N'hésitez pas à ressayer plus tard.
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { updateUser({ betaStatus: "none" }); }}
            className="mt-5 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
              boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
            }}>
            Faire une nouvelle demande
          </motion.button>
        </div>
      </SettingsPage>
    );
  }

  // ── Default: initial request form ────────────────────
  return (
    <SettingsPage
      category="Bêta testeur"
      title="Devenir bêta testeur"
      description="Testez les nouvelles fonctionnalités en avant-première et aidez-nous à façonner l'avenir de l'application."
    >
      <div className="rounded-2xl p-5 mb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F3F0FF 0%, #EEF0FF 100%)", border: "1px solid #E0DCFF" }}>
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-primary) 35%, transparent)" }}>
              <Sparkles size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-primary-deep)" }}>Programme fermé</p>
          </div>
          <p className="text-[16px] font-bold text-foreground tracking-tight">Rejoignez le programme bêta</p>
          <p className="text-[12px] text-muted mt-1 leading-relaxed">
            Accès anticipé, canal privé, et votre voix compte dans les décisions produit.
          </p>
        </div>
      </div>

      <SettingsSection title="Votre candidature" description="Parlez-nous de vous en quelques lignes.">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
              Motivation <span className="text-danger">*</span>
            </label>
            <textarea
              value={motivation}
              onChange={(e) => { setMotivation(e.target.value); setErrorMsg(null); }}
              rows={3}
              placeholder="Pourquoi souhaitez-vous devenir bêta testeur ?"
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
              Retour initial <span className="text-subtle font-semibold normal-case tracking-normal">(optionnel)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Un premier ressenti, un point fort, une faiblesse..."
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
              Votre expérience <span className="text-subtle font-semibold normal-case tracking-normal">(optionnel)</span>
            </label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={2}
              placeholder="Outils utilisés, années d'activité..."
              className="input-field resize-none"
            />
          </div>
        </div>
      </SettingsSection>

      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-danger-soft text-danger text-[12px] font-semibold rounded-xl px-4 py-3 mb-3 flex items-center gap-2">
            <X size={14} /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full text-white py-4 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-5"
        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))" }}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} strokeWidth={2.5} />}
        {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
      </motion.button>

      <p className="text-[10px] text-muted text-center leading-relaxed">
        En soumettant, vous acceptez de recevoir les emails liés au programme bêta. Aucune carte bancaire requise.
      </p>
    </SettingsPage>
  );
}
