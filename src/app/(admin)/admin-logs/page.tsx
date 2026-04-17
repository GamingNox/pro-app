"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, UserPlus, LogIn, CalendarDays, Receipt, XCircle, Shield, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Event {
  id: string;
  type: string;
  user_email: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const TYPE_ICON: Record<string, { icon: typeof UserPlus; color: string; bg: string }> = {
  signup:         { icon: UserPlus,     color: "#16A34A", bg: "#F0FDF4" },
  login:          { icon: LogIn,        color: "#3B82F6", bg: "#EFF6FF" },
  booking:        { icon: CalendarDays, color: "#8B5CF6", bg: "#F5F3FF" },
  invoice:        { icon: Receipt,      color: "#F59E0B", bg: "#FFFBEB" },
  cancellation:   { icon: XCircle,      color: "#EF4444", bg: "#FEE2E2" },
  admin_action:   { icon: Shield,       color: "#5B4FE9", bg: "#EEF0FF" },
  error:          { icon: AlertCircle,  color: "#EF4444", bg: "#FEE2E2" },
  beta_request:   { icon: Sparkles,     color: "#EC4899", bg: "#FDF2F8" },
};

function relativeTime(ts: string): string {
  const diffMs = Date.now() - new Date(ts).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminLogsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setLoading(false); return; }
    try {
      const res = await fetch("/api/admin/activity-log?limit=200", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data?.events)) {
        setEvents(data.events as Event[]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const types = ["all", ...Array.from(new Set(events.map((e) => e.type)))];
  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[24px] font-bold text-foreground tracking-tight">Journal d&apos;activité</h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={load}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
          >
            <RefreshCw size={14} className={`text-muted ${loading ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
        <p className="text-[12px] text-muted">Les dernières actions sur l&apos;application.</p>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {types.map((t) => {
            const active = filter === t;
            const label = t === "all" ? "Tout" : t;
            return (
              <motion.button
                key={t}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(t)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-bold flex-shrink-0 transition-colors"
                style={{
                  background: active ? "var(--color-primary)" : "white",
                  color: active ? "white" : "var(--color-muted)",
                  border: active ? "none" : "1px solid var(--color-border)",
                }}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {loading && events.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw size={24} className="text-muted mx-auto animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-card-premium">
              <p className="text-[14px] font-bold text-foreground">Aucun événement</p>
              <p className="text-[12px] text-muted mt-1">Les prochaines actions apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((e) => {
                const meta = TYPE_ICON[e.type] || { icon: AlertCircle, color: "#71717A", bg: "#F4F4F5" };
                const Icon = meta.icon;
                return (
                  <div key={e.id} className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: meta.bg }}>
                      <Icon size={16} style={{ color: meta.color }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground">{e.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                        <span>{relativeTime(e.created_at)}</span>
                        {e.user_email && <><span>·</span><span className="truncate">{e.user_email}</span></>}
                      </div>
                    </div>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {e.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
