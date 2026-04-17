"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  Briefcase,
  CheckCircle2,
  XCircle,
  Circle,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Tag,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { CATEGORIES } from "@/lib/categories";
import type { AppointmentStatus } from "@/lib/types";

const STATUS_META: Record<AppointmentStatus, { label: string; className: string; Icon: typeof Circle }> = {
  confirmed: { label: "Confirmé", className: "bg-accent-soft text-accent", Icon: CheckCircle2 },
  done: { label: "Terminé", className: "bg-success-soft text-success", Icon: CheckCircle2 },
  canceled: { label: "Annulé", className: "bg-danger-soft text-danger", Icon: XCircle },
};

export default function ClientReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { appointments, user, getClient } = useApp();

  const appt = useMemo(() => appointments.find((a) => a.id === id), [appointments, id]);
  const client = appt ? getClient(appt.clientId) : undefined;

  const scopeStyle = {
    ["--color-accent" as string]: CATEGORIES.clients.color,
    ["--color-accent-soft" as string]: CATEGORIES.clients.soft,
    ["--color-accent-deep" as string]: CATEGORIES.clients.deep,
  } as React.CSSProperties;

  if (!appt) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background" style={scopeStyle}>
        <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
          </motion.button>
          <span className="text-[15px] font-semibold text-foreground">Rendez-vous</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
            <Calendar size={28} className="text-accent" />
          </div>
          <p className="text-[15px] font-bold text-foreground">Rendez-vous introuvable</p>
          <p className="text-[12px] text-muted mt-1.5">Il a peut-être été annulé ou supprimé.</p>
        </div>
      </div>
    );
  }

  const st = STATUS_META[appt.status];
  const StatusIcon = st.Icon;
  const dateObj = new Date(appt.date);
  const fullDate = dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const endHour = (() => {
    const [h, m] = appt.time.split(":").map(Number);
    const end = new Date(0, 0, 0, h, m + appt.duration);
    return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
  })();

  // Mock professional info from the store's user (which for a client account
  // is the client themselves — we don't have a dedicated pro profile lookup
  // here, so we show the generic service/pro info from the appointment).
  const proName = user.business || "Votre professionnel";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background" style={scopeStyle}>
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
          <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-accent-deep)" }}>Réservation</p>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Détails du rendez-vous</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* ── Hero card ── */}
          <div
            className="rounded-[22px] p-5 text-white relative overflow-hidden mb-5"
            style={{
              background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-deep) 100%)",
              boxShadow: "0 14px 36px color-mix(in srgb, var(--color-accent) 35%, transparent)",
            }}
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -left-6 -bottom-12 w-28 h-28 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon size={13} className="text-white" strokeWidth={2.5} />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">{st.label}</p>
              </div>
              <h2 className="text-[22px] font-bold tracking-tight leading-tight">{appt.title}</h2>
              <p className="text-[13px] text-white/85 mt-1">avec {proName}</p>

              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/20">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Date</p>
                  <p className="text-[14px] font-bold mt-1 leading-tight">
                    {dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Horaire</p>
                  <p className="text-[14px] font-bold mt-1 leading-tight">{appt.time} — {endHour}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Chat CTA (only when pro has enabled chat and booking is active) ── */}
          {appt.status !== "canceled" && user.chatEnabled !== false && (
            <Link href={`/chat/${appt.id}`}>
              <motion.div whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl p-4 mb-5 flex items-center gap-3 text-white"
                style={{
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 90%, black), var(--color-accent-deep))",
                  boxShadow: "0 8px 24px color-mix(in srgb, var(--color-accent) 30%, transparent)",
                }}>
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-white" strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">Messagerie</p>
                  <p className="text-[14px] font-bold leading-tight">Contacter {proName.split(" ")[0]}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <ArrowLeft size={14} className="text-white rotate-180" strokeWidth={2.5} />
                </div>
              </motion.div>
            </Link>
          )}

          {/* ── Détails ── */}
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Détails</p>
          <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden mb-5">
            <div className="px-4 py-3.5 flex items-center gap-3 border-b border-border-light">
              <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                <Calendar size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Date</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5 capitalize">{fullDate}</p>
              </div>
            </div>
            <div className="px-4 py-3.5 flex items-center gap-3 border-b border-border-light">
              <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                <Clock size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Horaire</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{appt.time} — {endHour} ({appt.duration} min)</p>
              </div>
            </div>
            <div className="px-4 py-3.5 flex items-center gap-3 border-b border-border-light">
              <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Prestation</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{appt.title}</p>
              </div>
            </div>
            {appt.price > 0 && (
              <div className="px-4 py-3.5 flex items-center gap-3 border-b border-border-light">
                <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                  <Tag size={15} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Tarif</p>
                  <p className="text-[13px] font-bold text-foreground mt-0.5">{appt.price}&nbsp;€</p>
                </div>
              </div>
            )}
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${st.className}`}>
                <StatusIcon size={15} strokeWidth={2.4} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Statut</p>
                <p className="text-[13px] font-bold text-foreground mt-0.5">{st.label}</p>
              </div>
            </div>
          </div>

          {/* ── Professionnel ── */}
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Professionnel</p>
          <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden mb-5">
            <div className="px-4 py-4 flex items-center gap-3 border-b border-border-light">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))" }}>
                {(proName || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-foreground">{proName}</p>
                <p className="text-[11px] text-muted mt-0.5 flex items-center gap-1">
                  <Briefcase size={10} /> {user.business || "Professionnel"}
                </p>
              </div>
            </div>
            {appt.notes && (
              <div className="px-4 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Notes</p>
                <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap">{appt.notes}</p>
              </div>
            )}
          </div>

          {/* Confirmation footer */}
          <div className="bg-accent-soft rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-foreground">Votre réservation est enregistrée</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Vous recevrez un rappel 24h avant le rendez-vous. En cas d&apos;imprévu, prévenez votre professionnel via la messagerie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
