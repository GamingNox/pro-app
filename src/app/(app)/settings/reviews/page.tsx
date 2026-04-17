"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, MessageSquare, Check, Eye, EyeOff, Trash2, Clock, Inbox, RefreshCw,
} from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";

interface Review {
  id: string;
  user_id: string;
  author_name: string;
  author_email: string | null;
  rating: number;
  text: string;
  status: "pending" | "published" | "hidden";
  created_at: string;
}

type Filter = "pending" | "published" | "hidden";

const FILTER_LABELS: Record<Filter, string> = {
  pending: "À valider",
  published: "Publiés",
  hidden: "Masqués",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function SettingsReviewsPage() {
  useApp(); // ensures store hydration
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setReviews([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setReviews(data as Review[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function updateStatus(id: string, status: Review["status"]) {
    setUpdating(id);
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (!error) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
    setUpdating(null);
  }

  async function deleteReview(id: string) {
    setUpdating(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
    setUpdating(null);
  }

  const filtered = useMemo(() => reviews.filter((r) => r.status === filter), [reviews, filter]);
  const counts = useMemo(() => ({
    pending: reviews.filter((r) => r.status === "pending").length,
    published: reviews.filter((r) => r.status === "published").length,
    hidden: reviews.filter((r) => r.status === "hidden").length,
  }), [reviews]);

  const published = reviews.filter((r) => r.status === "published");
  const avgRating = published.length > 0
    ? (published.reduce((s, r) => s + r.rating, 0) / published.length).toFixed(1)
    : "—";

  return (
    <SettingsPage
      category="Modération"
      title="Gérer les avis"
      description="Validez, masquez ou supprimez les avis laissés sur votre page publique."
    >
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <Inbox size={14} className="text-accent mx-auto mb-1.5" />
          <p className="text-[20px] font-bold text-foreground leading-none">{counts.pending}</p>
          <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">En attente</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <Check size={14} className="text-accent mx-auto mb-1.5" />
          <p className="text-[20px] font-bold text-foreground leading-none">{counts.published}</p>
          <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Publiés</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <Star size={14} className="text-accent mx-auto mb-1.5" />
          <p className="text-[20px] font-bold text-foreground leading-none">{avgRating}</p>
          <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Moyenne</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex gap-2">
          {(["pending", "published", "hidden"] as Filter[]).map((f) => {
            const active = filter === f;
            return (
              <motion.button
                key={f}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                        color: "white",
                        boxShadow: "0 6px 14px color-mix(in srgb, var(--color-primary) 28%, transparent)",
                      }
                    : { backgroundColor: "#FFFFFF", color: "var(--color-muted)", border: "1px solid var(--color-border)" }
                }
              >
                {FILTER_LABELS[f]}
                <span
                  className="inline-flex items-center justify-center text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : "var(--color-primary-soft)",
                    color: active ? "white" : "var(--color-primary-deep)",
                  }}
                >
                  {counts[f]}
                </span>
              </motion.button>
            );
          })}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={load}
          className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <RefreshCw size={13} className={`text-muted ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      {/* List */}
      {loading && reviews.length === 0 ? (
        <SettingsSection>
          <p className="text-[12px] text-muted text-center py-6">Chargement…</p>
        </SettingsSection>
      ) : filtered.length === 0 ? (
        <SettingsSection>
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-accent-soft">
              <MessageSquare size={20} className="text-accent" />
            </div>
            <p className="text-[13px] font-bold text-foreground">Aucun avis {FILTER_LABELS[filter].toLowerCase()}</p>
            <p className="text-[11px] text-muted mt-1">
              {filter === "pending" ? "Les nouveaux avis apparaîtront ici." : "Rien à afficher."}
            </p>
          </div>
        </SettingsSection>
      ) : (
        <div className="space-y-2.5 mb-5">
          <AnimatePresence>
            {filtered.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-white rounded-2xl p-4 shadow-card-premium"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                      style={{ background: "var(--color-primary-soft)", color: "var(--color-primary-deep)" }}
                    >
                      {r.author_name[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-foreground truncate">{r.author_name}</p>
                      <p className="text-[10px] text-muted flex items-center gap-1">
                        <Clock size={9} /> {formatDate(r.created_at)}
                        {r.author_email && <span className="truncate">· {r.author_email}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < r.rating ? "text-[#F5B400] fill-[#F5B400]" : "text-[var(--color-border)]"}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[12.5px] text-foreground leading-relaxed mb-3">{r.text}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  {r.status !== "published" && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateStatus(r.id, "published")}
                      disabled={updating === r.id}
                      className="flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 text-white disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                      }}
                    >
                      <Check size={12} strokeWidth={2.8} /> Publier
                    </motion.button>
                  )}
                  {r.status !== "hidden" && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateStatus(r.id, "hidden")}
                      disabled={updating === r.id}
                      className="flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 text-muted bg-border-light disabled:opacity-60"
                    >
                      <EyeOff size={12} strokeWidth={2.8} /> Masquer
                    </motion.button>
                  )}
                  {r.status === "hidden" && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateStatus(r.id, "pending")}
                      disabled={updating === r.id}
                      className="flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 text-muted bg-border-light disabled:opacity-60"
                    >
                      <Eye size={12} strokeWidth={2.8} /> Réévaluer
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => deleteReview(r.id)}
                    disabled={updating === r.id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-60"
                    style={{ backgroundColor: "#FEF2F2", color: "#B91C1C" }}
                  >
                    <Trash2 size={13} strokeWidth={2.6} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info card */}
      <div className="bg-accent-soft rounded-2xl p-4">
        <div className="flex items-start gap-2.5">
          <Star size={14} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-foreground">Comment ça marche</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              Chaque avis soumis par un visiteur de votre page publique arrive ici avec le statut « À valider ». Publiez-le pour qu&apos;il apparaisse sur <b>clientbase.fr/p/votre-slug</b>, ou masquez-le si besoin. La moyenne affichée ne prend en compte que les avis publiés.
            </p>
          </div>
        </div>
      </div>
    </SettingsPage>
  );
}
