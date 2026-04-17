"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserPlus,
  Sparkles,
  Bug,
  Lightbulb,
  MessageSquare,
  Activity as ActivityIcon,
  RefreshCw,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";

type EventType = "signup" | "beta_request" | "beta_report_bug" | "beta_report_suggestion" | "beta_report_feedback" | "message";

interface ActivityEvent {
  id: string;
  type: EventType;
  title: string;
  subtitle: string;
  timestamp: string;
}

const TYPE_META: Record<EventType, { label: string; icon: typeof UserPlus; color: string; soft: string }> = {
  signup:                   { label: "Nouveau compte",     icon: UserPlus,       color: CATEGORIES.clients.color,    soft: CATEGORIES.clients.soft },
  beta_request:             { label: "Demande bêta",       icon: Sparkles,       color: CATEGORIES.beta.color,       soft: CATEGORIES.beta.soft },
  beta_report_bug:          { label: "Bug signalé",        icon: Bug,            color: "#EF4444",                   soft: "#FEE2E2" },
  beta_report_suggestion:   { label: "Suggestion",         icon: Lightbulb,      color: CATEGORIES.marketing.color,  soft: CATEGORIES.marketing.soft },
  beta_report_feedback:     { label: "Retour bêta",        icon: Lightbulb,      color: CATEGORIES.beta.color,       soft: CATEGORIES.beta.soft },
  message:                  { label: "Message envoyé",     icon: MessageSquare,  color: CATEGORIES.system.color,     soft: CATEGORIES.system.soft },
};

type FilterKey = "all" | EventType;

export default function AdminActivityPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

  async function load() {
    setLoading(true);
    const all: ActivityEvent[] = [];
    try {
      // Recent signups
      const { data: users } = await supabase
        .from("user_profiles")
        .select("id, name, email, business, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      users?.forEach((u) => {
        all.push({
          id: `u-${u.id}`,
          type: "signup",
          title: u.name || "Nouveau compte",
          subtitle: u.business ? `${u.business} · ${u.email || "—"}` : (u.email || "—"),
          timestamp: u.created_at,
        });
      });

      // Recent beta requests
      const { data: requests } = await supabase
        .from("beta_requests")
        .select("id, user_id, motivation, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (requests && requests.length > 0) {
        const userIds = [...new Set(requests.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, name")
          .in("id", userIds);
        const nameMap: Record<string, string> = {};
        profiles?.forEach((p) => { if (p.name) nameMap[p.id] = p.name; });
        requests.forEach((r) => {
          all.push({
            id: `br-${r.id}`,
            type: "beta_request",
            title: nameMap[r.user_id] || "Candidat bêta",
            subtitle: (r.motivation || "").slice(0, 80) || "—",
            timestamp: r.created_at,
          });
        });
      }

      // Recent beta reports
      const { data: reports } = await supabase
        .from("beta_reports")
        .select("id, user_id, kind, title, description, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (reports && reports.length > 0) {
        const userIds = [...new Set(reports.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, name")
          .in("id", userIds);
        const nameMap: Record<string, string> = {};
        profiles?.forEach((p) => { if (p.name) nameMap[p.id] = p.name; });
        reports.forEach((r) => {
          const type: EventType = r.kind === "bug"
            ? "beta_report_bug"
            : r.kind === "suggestion"
            ? "beta_report_suggestion"
            : "beta_report_feedback";
          all.push({
            id: `rep-${r.id}`,
            type,
            title: nameMap[r.user_id] || "Bêta testeur",
            subtitle: (r.title || r.description || "").slice(0, 80),
            timestamp: r.created_at,
          });
        });
      }

      // Recent messages (last 20)
      const { data: messages } = await supabase
        .from("messages")
        .select("id, sender_id, message, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (messages && messages.length > 0) {
        const senderIds = [...new Set(messages.map((m) => m.sender_id))];
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, name")
          .in("id", senderIds);
        const nameMap: Record<string, string> = {};
        profiles?.forEach((p) => { if (p.name) nameMap[p.id] = p.name; });
        messages.forEach((m) => {
          all.push({
            id: `msg-${m.id}`,
            type: "message",
            title: nameMap[m.sender_id] || "Utilisateur",
            subtitle: (m.message || "").slice(0, 80),
            timestamp: m.created_at,
          });
        });
      }
    } catch (e) {
      console.warn("[admin-activity] load failed:", e);
    }

    all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    setEvents(all);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  const counts = useMemo(() => ({
    all: events.length,
    signup: events.filter((e) => e.type === "signup").length,
    beta_request: events.filter((e) => e.type === "beta_request").length,
    reports: events.filter((e) => e.type.startsWith("beta_report")).length,
    message: events.filter((e) => e.type === "message").length,
  }), [events]);

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "À l'instant";
    if (m < 60) return `Il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Il y a ${h} h`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Hier";
    if (d < 30) return `Il y a ${d} j`;
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-background"
      style={{
        ["--color-accent" as string]: CATEGORIES.system.color,
        ["--color-accent-soft" as string]: CATEGORIES.system.soft,
        ["--color-accent-deep" as string]: CATEGORIES.system.deep,
      } as React.CSSProperties}
    >
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
          </motion.button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">Admin</p>
            <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Activité</h1>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={load}
          className="w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
          <RefreshCw size={16} className={`text-muted ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      {/* KPI row */}
      <div className="flex-shrink-0 px-6 pb-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <p className="text-[18px] font-bold text-foreground leading-none">{counts.signup}</p>
            <p className="text-[8px] text-muted mt-1 uppercase tracking-wider">Signups</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <p className="text-[18px] font-bold text-foreground leading-none">{counts.beta_request}</p>
            <p className="text-[8px] text-muted mt-1 uppercase tracking-wider">Demandes</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <p className="text-[18px] font-bold text-foreground leading-none">{counts.reports}</p>
            <p className="text-[8px] text-muted mt-1 uppercase tracking-wider">Retours</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <p className="text-[18px] font-bold text-foreground leading-none">{counts.message}</p>
            <p className="text-[8px] text-muted mt-1 uppercase tracking-wider">Messages</p>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex-shrink-0 px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {([
          { key: "all" as const, label: `Tout (${counts.all})` },
          { key: "signup" as const, label: "Signups" },
          { key: "beta_request" as const, label: "Demandes bêta" },
          { key: "beta_report_bug" as const, label: "Bugs" },
          { key: "beta_report_suggestion" as const, label: "Idées" },
          { key: "message" as const, label: "Messages" },
        ]).map((f) => {
          const active = filter === f.key;
          return (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${active ? "text-white" : "bg-white text-muted"}`}
              style={active
                ? { background: `linear-gradient(135deg, ${CATEGORIES.system.color}, ${CATEGORIES.system.deep})` }
                : { border: "1px solid #E4E4E7" }}
            >
              {f.label}
            </motion.button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {loading && events.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <p className="text-[12px] text-muted">Chargement de l&apos;activité...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                <Filter size={24} className="text-muted" />
              </div>
              <p className="text-[14px] font-bold text-foreground">Aucune activité</p>
              <p className="text-[11px] text-muted mt-1.5">Aucun événement dans cette catégorie.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((e) => {
                const meta = TYPE_META[e.type];
                const Icon = meta.icon;
                return (
                  <div key={e.id} className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: meta.soft }}>
                      <Icon size={16} style={{ color: meta.color }} strokeWidth={2.4} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-foreground truncate">{e.title}</p>
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={{ backgroundColor: meta.soft, color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 line-clamp-2 leading-relaxed">{e.subtitle}</p>
                      <p className="text-[9px] text-subtle mt-1.5">{timeAgo(e.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 bg-accent-soft rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <ActivityIcon size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-foreground">Timeline unifiée</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Cette page agrège les derniers signups, demandes bêta, retours, et messages échangés. Utile pour détecter une activité anormale ou suivre l&apos;adoption.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
