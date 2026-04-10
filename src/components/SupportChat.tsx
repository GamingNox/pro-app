"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, CheckCircle2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  from: "user" | "admin";
  timestamp: number;
}

interface SupportChatProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

function getMessages(userId: string): Message[] {
  try {
    const raw = localStorage.getItem(`chat_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMessages(userId: string, messages: Message[]) {
  localStorage.setItem(`chat_${userId}`, JSON.stringify(messages));
  // Also update the global chat index for admin
  const index: string[] = JSON.parse(localStorage.getItem("chat_index") || "[]");
  if (!index.includes(userId)) {
    index.push(userId);
    localStorage.setItem("chat_index", JSON.stringify(index));
  }
}

function addNotification(target: string, text: string) {
  const notifs: { text: string; time: number; read: boolean }[] = JSON.parse(localStorage.getItem(`notif_${target}`) || "[]");
  notifs.unshift({ text, time: Date.now(), read: false });
  localStorage.setItem(`notif_${target}`, JSON.stringify(notifs.slice(0, 20)));
}

function clearNotifications(target: string) {
  const notifs: { text: string; time: number; read: boolean }[] = JSON.parse(localStorage.getItem(`notif_${target}`) || "[]");
  const updated = notifs.map((n) => ({ ...n, read: true }));
  localStorage.setItem(`notif_${target}`, JSON.stringify(updated));
}

function getUnreadCount(target: string): number {
  try {
    const notifs: { text: string; time: number; read: boolean }[] = JSON.parse(localStorage.getItem(`notif_${target}`) || "[]");
    return notifs.filter((n) => !n.read).length;
  } catch { return 0; }
}

export default function SupportChat({ open, onClose, userId, userName }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages(getMessages(userId));
      // Clear notifications when chat is opened
      clearNotifications(userId);
    }
  }, [open, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Poll for new messages (simple polling since no WebSocket)
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setMessages(getMessages(userId));
    }, 3000);
    return () => clearInterval(interval);
  }, [open, userId]);

  function handleSend() {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: input.trim(),
      from: "user",
      timestamp: Date.now(),
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    saveMessages(userId, updated);
    addNotification("admin", `Nouveau message de ${userName}`);
    setInput("");
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] flex flex-col shadow-apple-lg"
            style={{ height: "85vh", maxHeight: "700px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center">
                  <MessageCircle size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-foreground">Support</p>
                  <p className="text-[10px] text-success font-semibold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" /> En ligne
                  </p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.8 }} onClick={onClose}
                className="w-8 h-8 rounded-full bg-border-light flex items-center justify-center">
                <X size={15} className="text-muted" />
              </motion.button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
              style={{ WebkitOverflowScrolling: "touch" }}>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={24} className="text-accent" />
                  </div>
                  <p className="text-[15px] font-bold text-foreground">Besoin d&apos;aide ?</p>
                  <p className="text-[12px] text-muted mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                    Envoyez un message et notre équipe vous répondra rapidement.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.from === "user"
                          ? "bg-accent text-white rounded-br-lg"
                          : "bg-border-light text-foreground rounded-bl-lg"
                      }`}>
                        <p className="text-[13px] leading-relaxed">{msg.text}</p>
                        <p className={`text-[9px] mt-1 ${msg.from === "user" ? "text-white/50" : "text-muted"}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-4 pb-5 pt-2 border-t border-border-light">
              <div className="flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-border-light rounded-2xl px-4 py-3 text-[14px] outline-none placeholder:text-subtle" />
                <motion.button whileTap={{ scale: 0.88 }} onClick={handleSend}
                  disabled={!input.trim()}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${input.trim() ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                  <Send size={17} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Admin chat component — shows all conversations
export function AdminChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ userId: string; lastMsg: string; time: number }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    loadConversations();
    // Clear admin notifications when panel is opened
    clearNotifications("admin");
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (selectedUser) {
      setMessages(getMessages(selectedUser));
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      const interval = setInterval(() => setMessages(getMessages(selectedUser)), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function loadConversations() {
    const index: string[] = JSON.parse(localStorage.getItem("chat_index") || "[]");
    const convs = index.map((uid) => {
      const msgs = getMessages(uid);
      const last = msgs[msgs.length - 1];
      return { userId: uid, lastMsg: last?.text || "", time: last?.timestamp || 0 };
    }).sort((a, b) => b.time - a.time);
    setConversations(convs);
  }

  function handleAdminReply() {
    if (!input.trim() || !selectedUser) return;
    const newMsg: Message = { id: Date.now().toString(36), text: input.trim(), from: "admin", timestamp: Date.now() };
    const updated = [...messages, newMsg];
    setMessages(updated);
    saveMessages(selectedUser, updated);
    addNotification(selectedUser, "Noah vous a répondu");
    setInput("");
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%", opacity: 0.8 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] flex flex-col shadow-apple-lg"
            style={{ height: "85vh", maxHeight: "700px" }}>

            <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0 border-b border-border-light">
              {selectedUser ? (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedUser(null)}
                  className="text-[13px] text-accent font-bold">← Conversations</motion.button>
              ) : (
                <p className="text-[16px] font-bold text-foreground">Messages support</p>
              )}
              <motion.button whileTap={{ scale: 0.8 }} onClick={onClose} className="w-8 h-8 rounded-full bg-border-light flex items-center justify-center"><X size={15} className="text-muted" /></motion.button>
            </div>

            {!selectedUser ? (
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {conversations.length === 0 ? (
                  <div className="text-center py-12"><MessageCircle size={24} className="text-muted mx-auto mb-2" /><p className="text-[13px] text-muted">Aucune conversation.</p></div>
                ) : conversations.map((conv) => (
                  <motion.button key={conv.userId} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedUser(conv.userId)}
                    className="w-full flex items-center gap-3 py-3 border-b border-border-light text-left">
                    <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent text-[12px] font-bold">
                      {conv.userId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground">Utilisateur {conv.userId.slice(0, 8)}</p>
                      <p className="text-[11px] text-muted truncate">{conv.lastMsg}</p>
                    </div>
                    <p className="text-[9px] text-muted">{formatTime(conv.time)}</p>
                  </motion.button>
                ))}
              </div>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.from === "admin" ? "bg-accent text-white rounded-br-lg" : "bg-border-light text-foreground rounded-bl-lg"}`}>
                          <p className="text-[13px] leading-relaxed">{msg.text}</p>
                          <p className={`text-[9px] mt-1 ${msg.from === "admin" ? "text-white/50" : "text-muted"}`}>{formatTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0 px-4 pb-5 pt-2 border-t border-border-light">
                  <div className="flex items-center gap-2">
                    <input value={input} onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAdminReply(); }}
                      placeholder="Répondre..." className="flex-1 bg-border-light rounded-2xl px-4 py-3 text-[14px] outline-none placeholder:text-subtle" />
                    <motion.button whileTap={{ scale: 0.88 }} onClick={handleAdminReply} disabled={!input.trim()}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${input.trim() ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                      <Send size={17} />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Unread notification badge ────────────────────────────
export function UnreadBadge({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getUnreadCount(userId));
    const interval = setInterval(() => setCount(getUnreadCount(userId)), 3000);
    return () => clearInterval(interval);
  }, [userId]);

  if (count === 0) return null;
  return (
    <span className="min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center px-1">
      {count > 9 ? "9+" : count}
    </span>
  );
}
