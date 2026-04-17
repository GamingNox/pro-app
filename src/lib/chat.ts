// ══ Chat system helpers ═════════════════════════════════
// Best-effort Supabase integration with graceful fallback.
//
// Required migration: see supabase/chat-system.sql
//
// Flow:
//  - Messages are scoped to a booking (appointment_id)
//  - sender_id / receiver_id are user_profiles.id (= auth.users.id)
//  - The chat is only available when the booking exists
//  - The pro can toggle chat_enabled on user_profiles to block all chat

import { supabase } from "./supabase";
import type { ChatMessage } from "./types";

function rowToMessage(r: Record<string, unknown>): ChatMessage {
  return {
    id: String(r.id),
    senderId: String(r.sender_id),
    receiverId: r.receiver_id ? String(r.receiver_id) : undefined,
    bookingId: String(r.booking_id ?? ""),
    message: String(r.message ?? ""),
    read: Boolean(r.read),
    createdAt: String(r.created_at),
  };
}

/** Fetch all messages in a single conversation (booking). */
export async function fetchMessages(bookingId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[chat] fetchMessages failed:", error);
      return [];
    }
    return (data || []).map(rowToMessage);
  } catch (e) {
    console.warn("[chat] fetchMessages threw:", e);
    return [];
  }
}

/** Send a message — returns the persisted row on success. */
export async function sendMessage(payload: {
  senderId: string;
  receiverId?: string;
  bookingId: string;
  message: string;
}): Promise<{ ok: boolean; message?: ChatMessage; error?: string }> {
  if (!payload.message.trim()) return { ok: false, error: "empty" };
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: payload.senderId,
        receiver_id: payload.receiverId || null,
        booking_id: payload.bookingId,
        message: payload.message.trim(),
      })
      .select()
      .single();
    if (error) {
      console.error("[chat] sendMessage failed:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, message: rowToMessage(data) };
  } catch (e) {
    console.error("[chat] sendMessage threw:", e);
    return { ok: false, error: String(e) };
  }
}

/** Admin/pro: mark all messages of a booking as read (where I'm the receiver). */
export async function markConversationRead(bookingId: string, receiverId: string): Promise<void> {
  try {
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("booking_id", bookingId)
      .eq("receiver_id", receiverId)
      .eq("read", false);
  } catch (e) {
    console.warn("[chat] markConversationRead threw:", e);
  }
}

/** Subscribe to realtime INSERTs on a single conversation. */
export function subscribeToConversation(
  bookingId: string,
  onMessage: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`chat-${bookingId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
      (payload: { new: Record<string, unknown> }) => {
        onMessage(rowToMessage(payload.new));
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Pro inbox: fetch all messages where I'm sender or receiver, grouped by booking. */
export async function fetchInbox(userId: string): Promise<{
  bookingId: string;
  lastMessage: ChatMessage;
  unreadCount: number;
}[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[chat] fetchInbox failed:", error);
      return [];
    }
    const rows = (data || []).map(rowToMessage);

    // Group by booking_id, keep the most recent per group
    const byBooking = new Map<string, { lastMessage: ChatMessage; unreadCount: number }>();
    for (const msg of rows) {
      if (!msg.bookingId) continue;
      const existing = byBooking.get(msg.bookingId);
      const unread = msg.receiverId === userId && !msg.read ? 1 : 0;
      if (!existing) {
        byBooking.set(msg.bookingId, { lastMessage: msg, unreadCount: unread });
      } else {
        existing.unreadCount += unread;
      }
    }
    return Array.from(byBooking.entries()).map(([bookingId, v]) => ({ bookingId, ...v }));
  } catch (e) {
    console.warn("[chat] fetchInbox threw:", e);
    return [];
  }
}

/** Count the total unread messages for a user across all conversations. */
export async function countUnread(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("read", false);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
