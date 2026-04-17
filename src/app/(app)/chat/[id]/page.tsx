"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Lock, Phone, CalendarDays, Sparkles, User as UserIcon } from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchMessages, sendMessage, subscribeToConversation, markConversationRead } from "@/lib/chat";
import { getInitials } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/lib/types";

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const { user, userId, appointments, getClient } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Resolve the booking from local store (pro side) to show header info
  const booking = useMemo(() => appointments.find((a) => a.id === bookingId), [appointments, bookingId]);
  const client = booking ? getClient(booking.clientId) : undefined;

  // When the viewer is a client account, the local "clients" store is empty
  // (clients belong to pros, not to auth.users). Fetch the pro's profile from
  // the appointment row so we can display their business name as the header.
  const [proProfile, setProProfile] = useState<{ name?: string; business?: string } | null>(null);
  useEffect(() => {
    if (user.accountType !== "client" || !bookingId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: appt } = await supabase
          .from("appointments")
          .select("user_id")
          .eq("id", bookingId)
          .single();
        if (!appt?.user_id || cancelled) return;
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("name, business")
          .eq("id", appt.user_id)
          .single();
        if (profile && !cancelled) setProProfile({ name: profile.name, business: profile.business });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [bookingId, user.accountType]);

  const isClient = user.accountType === "client";
  const peerName = isClient
    ? (proProfile?.business || proProfile?.name || "Votre professionnel")
    : client
    ? `${client.firstName} ${client.lastName}`
    : booking?.guestName || "Votre client";
  const peerAvatar = isClient
    ? "#3B82F6"
    : client?.avatar || "#8B5CF6";

  // Receiver id — if current user is the pro (owner of booking), we don't
  // have a direct client user_id in the store. Messages without a receiver
  // are visible to whoever lands on the same booking URL.
  const receiverId: string | undefined = undefined;

  // Load history on mount
  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await fetchMessages(bookingId);
      if (!cancelled) {
        setMessages(data);
        setLoading(false);
      }
      if (userId) {
        await markConversationRead(bookingId, userId);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId, userId]);

  // Realtime subscription — add incoming messages as they arrive
  useEffect(() => {
    if (!bookingId) return;
    const unsubscribe = subscribeToConversation(bookingId, (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return unsubscribe;
  }, [bookingId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSend() {
    if (!draft.trim() || !userId || sending) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
    const res = await sendMessage({
      senderId: userId,
      receiverId,
      bookingId,
      message: text,
    });
    if (res.ok && res.message) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === res.message!.id)) return prev;
        return [...prev, res.message!];
      });
    } else if (!res.ok) {
      // Restore draft on failure so the user doesn't lose their text
      setDraft(text);
      alert(`Envoi échoué : ${res.error || "erreur inconnue"}`);
    }
    setSending(false);
  }

  // Chat disabled → blocker screen
  if (user.chatEnabled === false) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
          </motion.button>
          <span className="text-[15px] font-semibold text-foreground">Conversation</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#F3F0FF" }}>
            <Lock size={28} style={{ color: "#8B5CF6" }} strokeWidth={2.2} />
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

  // Blue for client viewers, violet for pro viewers — differentiation
  const scopeStyle = isClient
    ? ({
        ["--color-accent" as string]: "#3B82F6",
        ["--color-accent-soft" as string]: "#EFF6FF",
        ["--color-accent-deep" as string]: "#1D4ED8",
      } as React.CSSProperties)
    : ({
        ["--color-accent" as string]: "#8B5CF6",
        ["--color-accent-soft" as string]: "#F3F0FF",
        ["--color-accent-deep" as string]: "#6D28D9",
      } as React.CSSProperties);

  const bubbleGradient = isClient
    ? "linear-gradient(135deg, #3B82F6, #1D4ED8)"
    : "linear-gradient(135deg, #8B5CF6, #6D28D9)";
  const sendShadow = isClient
    ? "0 4px 12px rgba(59, 130, 246, 0.35)"
    : "0 4px 12px rgba(139, 92, 246, 0.35)";

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-background"
      style={scopeStyle}
    >
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3 flex items-center gap-3 border-b border-border-light">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
          <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
          style={{ backgroundColor: peerAvatar }}
        >
          {client
            ? getInitials(client.firstName, client.lastName)
            : (peerName.split(" ")[0] || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-foreground truncate">{peerName}</p>
          <p className="text-[10px] text-muted truncate">
            {booking
              ? `${booking.title} · ${new Date(booking.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} ${booking.time}`
              : "Messagerie directe"}
          </p>
        </div>
        {client?.phone && (
          <a href={`tel:${client.phone}`} className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
            <Phone size={15} className="text-accent" />
          </a>
        )}
      </div>

      {/* ═══ MESSAGES ═══ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-[12px] text-muted">Chargement...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
              <Sparkles size={26} className="text-accent" />
            </div>
            <p className="text-[15px] font-bold text-foreground">Démarrez la conversation</p>
            <p className="text-[12px] text-muted mt-1.5 max-w-[260px] leading-relaxed">
              Envoyez un premier message à {peerName.split(" ")[0] || (isClient ? "votre professionnel" : "votre client")} — il le recevra en temps réel.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 flex flex-col">
            {messages.map((m, i) => {
              const mine = m.senderId === userId;
              const prev = messages[i - 1];
              const showTimestamp = !prev || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
              return (
                <div key={m.id} className="flex flex-col">
                  {showTimestamp && (
                    <p className="text-[9px] text-subtle text-center mb-1 mt-2">
                      {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${mine ? "self-end" : "self-start"}`}
                    style={mine
                      ? { background: bubbleGradient, color: "white", borderBottomRightRadius: "6px", boxShadow: sendShadow.replace("0.35", "0.25") }
                      : { background: "white", color: "var(--color-foreground)", border: "1px solid #E4E4E7", borderBottomLeftRadius: "6px" }}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ COMPOSER ═══ */}
      <div className="flex-shrink-0 px-4 pt-3 pb-4 border-t border-border-light bg-white">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Écrivez un message…"
            className="input-field flex-1"
          />
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
            style={draft.trim() && !sending
              ? { background: bubbleGradient, boxShadow: sendShadow }
              : { background: "#E4E4E7" }}
          >
            <Send size={16} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
