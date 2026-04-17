"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Search, Inbox, Lock, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchInbox } from "@/lib/chat";
import { getInitials } from "@/lib/data";
import type { ChatMessage } from "@/lib/types";
import type { Appointment } from "@/lib/types";

interface Conversation {
  bookingId: string;
  appointment: Appointment | undefined;
  clientName: string;
  clientAvatar: string;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  isoDate: string;
}

export default function ChatInboxPage() {
  const { user, userId, appointments, clients, getClient } = useApp();
  const router = useRouter();
  const [inbox, setInbox] = useState<{ bookingId: string; lastMessage: ChatMessage; unreadCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const data = await fetchInbox(userId);
      if (!cancelled) {
        setInbox(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Build a conversation list merging bookings + inbox activity.
  // Show every upcoming / recent booking with a chat, plus any booking
  // that already has messages even if it's in the past.
  const conversations = useMemo<Conversation[]>(() => {
    const now = new Date();
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const inboxMap = new Map(inbox.map((i) => [i.bookingId, i]));

    // Start from bookings (upcoming or recent)
    const eligible = appointments.filter((a) => a.date >= cutoffStr);
    const list: Conversation[] = eligible.map((a) => {
      const client = getClient(a.clientId);
      const inboxItem = inboxMap.get(a.id);
      return {
        bookingId: a.id,
        appointment: a,
        clientName: client ? `${client.firstName} ${client.lastName}` : a.guestName || "Client",
        clientAvatar: client?.avatar || "#8B5CF6",
        lastMessage: inboxItem?.lastMessage || null,
        unreadCount: inboxItem?.unreadCount || 0,
        isoDate: inboxItem?.lastMessage?.createdAt || `${a.date}T${a.time}:00`,
      };
    });

    // Add any inbox entries that point at a booking we've already filtered out
    inbox.forEach((i) => {
      if (list.find((c) => c.bookingId === i.bookingId)) return;
      const appt = appointments.find((a) => a.id === i.bookingId);
      const client = appt ? getClient(appt.clientId) : undefined;
      list.push({
        bookingId: i.bookingId,
        appointment: appt,
        clientName: client ? `${client.firstName} ${client.lastName}` : appt?.guestName || "Conversation",
        clientAvatar: client?.avatar || "#8B5CF6",
        lastMessage: i.lastMessage,
        unreadCount: i.unreadCount,
        isoDate: i.lastMessage.createdAt,
      });
    });

    // Sort: unread first, then most recent
    return list.sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      return b.isoDate.localeCompare(a.isoDate);
    });
  }, [appointments, clients, inbox, getClient]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      c.clientName.toLowerCase().includes(q) ||
      (c.lastMessage?.message || "").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Group conversations by activity period for easier scanning.
  const grouped = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 6 * 86400000;
    const groups: { key: string; label: string; items: Conversation[] }[] = [
      { key: "today", label: "Aujourd'hui", items: [] },
      { key: "week", label: "Cette semaine", items: [] },
      { key: "older", label: "Plus anciennes", items: [] },
    ];
    filtered.forEach((c) => {
      const t = new Date(c.isoDate).getTime();
      if (t >= startOfToday) groups[0].items.push(c);
      else if (t >= startOfWeek) groups[1].items.push(c);
      else groups[2].items.push(c);
    });
    return groups.filter((g) => g.items.length > 0);
  }, [filtered]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  // Chat disabled → blocker screen
  if (user.chatEnabled === false) {
    return (
      <div
        className="flex-1 flex flex-col overflow-hidden bg-background"
        style={{
          ["--color-accent" as string]: "#8B5CF6",
          ["--color-accent-soft" as string]: "#F3F0FF",
          ["--color-accent-deep" as string]: "#6D28D9",
        } as React.CSSProperties}
      >
        <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
          </motion.button>
          <span className="text-[15px] font-semibold text-foreground">Messagerie</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
            <Lock size={28} className="text-accent" strokeWidth={2.2} />
          </div>
          <h2 className="text-[20px] font-bold text-foreground">Messagerie désactivée</h2>
          <p className="text-[13px] text-muted mt-2 max-w-[280px] leading-relaxed">
            Activez la messagerie dans vos préférences pour échanger avec vos clients.
          </p>
          <Link href="/settings/preferences">
            <motion.div whileTap={{ scale: 0.97 }}
              className="mt-5 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)" }}>
              Ouvrir les préférences
            </motion.div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-background"
      style={{
        ["--color-accent" as string]: "#8B5CF6",
        ["--color-accent-soft" as string]: "#F3F0FF",
        ["--color-accent-deep" as string]: "#6D28D9",
      } as React.CSSProperties}
    >
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
          <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6D28D9" }}>Messagerie</p>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Conversations</h1>
        </div>
        {totalUnread > 0 && (
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Non lus</span>
            <span className="mt-0.5 min-w-[26px] h-[22px] px-2 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", boxShadow: "0 3px 10px rgba(139,92,246,0.35)" }}>
              {totalUnread}
            </span>
          </div>
        )}
      </div>

      {/* ═══ SEARCH ═══ */}
      <div className="flex-shrink-0 px-6 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client ou un message…"
            className="input-field"
            style={{ paddingLeft: "42px" }}
          />
        </div>
      </div>

      {/* ═══ LIST ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <p className="text-[12px] text-muted">Chargement des conversations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                <Inbox size={24} className="text-accent" />
              </div>
              <p className="text-[14px] font-bold text-foreground">Aucune conversation</p>
              <p className="text-[11px] text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                Les conversations avec vos clients apparaîtront ici dès qu&apos;un rendez-vous sera confirmé.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map((group) => (
                <div key={group.key}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2 px-1">{group.label}</p>
                  <div className="space-y-2">
                    {group.items.map((c) => (
                      <Link key={c.bookingId} href={`/chat/${c.bookingId}`}>
                        <motion.div
                          whileTap={{ scale: 0.99 }}
                          className="bg-white rounded-2xl p-4 shadow-card-interactive flex items-center gap-3"
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                            style={{ backgroundColor: c.clientAvatar }}
                          >
                            {getInitials(c.clientName.split(" ")[0] || "", c.clientName.split(" ")[1] || "")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-[14px] truncate ${c.unreadCount > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>{c.clientName}</p>
                              {c.lastMessage && (
                                <p className="text-[10px] text-subtle flex-shrink-0 ml-2">
                                  {new Date(c.lastMessage.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                            <p className={`text-[11px] truncate mt-0.5 ${c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted"}`}>
                              {c.lastMessage
                                ? (c.lastMessage.senderId === userId ? "Vous : " : "") + c.lastMessage.message
                                : c.appointment
                                  ? `${c.appointment.title} · ${new Date(c.appointment.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                                  : "Nouvelle conversation"}
                            </p>
                            {c.appointment && (
                              <p className="text-[9px] text-subtle truncate mt-0.5">
                                RDV · {new Date(c.appointment.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} {c.appointment.time}
                              </p>
                            )}
                          </div>
                          {c.unreadCount > 0 && (
                            <span className="min-w-[20px] h-[20px] px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
                              {c.unreadCount}
                            </span>
                          )}
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info footer */}
          <div className="mt-6 bg-accent-soft rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-foreground">Messagerie liée aux rendez-vous</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Chaque conversation est rattachée à un rendez-vous. Le chat reste accessible pendant 30 jours après la prestation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
