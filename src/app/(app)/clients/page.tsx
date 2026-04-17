"use client";

import { useState, useMemo, useEffect, useRef, useDeferredValue } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants, tabContentTransition } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import Modal from "@/components/Modal";
import Link from "next/link";
import {
  Plus, Search, Phone, Mail, FileText, CalendarDays,
  ChevronRight, Trash2, UserPlus, Edit3, CheckCircle2, XCircle, Clock,
  SlidersHorizontal, Star, Tag, Heart, Camera, Save, TrendingUp, Users,
  CreditCard, Minus, Sparkles, Copy, Check, Send, MessageSquare, AtSign,
} from "lucide-react";
import ClientTimeline from "@/components/ClientTimeline";

type Sort = "recent" | "alpha" | "frequent" | "favorites";
type ProfileTab = "history" | "payments";
type ClientTag = "vip" | "regular" | "new" | "";

const TAG_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  vip: { label: "VIP", color: "text-warning", bg: "bg-warning-soft" },
  regular: { label: "Régulier", color: "text-accent", bg: "bg-accent-soft" },
  new: { label: "Nouveau", color: "text-success", bg: "bg-success-soft" },
};

const SORT_LABELS: Record<Sort, string> = {
  recent: "Date de visite",
  alpha: "Alphabétique",
  frequent: "Fréquence",
  favorites: "Favoris",
};

function getClientTag(notes: string): ClientTag {
  const m = notes.match(/^\[tag:(\w+)\]/);
  return (m ? m[1] : "") as ClientTag;
}
function setTagInNotes(notes: string, tag: ClientTag): string {
  const cleaned = notes.replace(/^\[tag:\w+\]\s*/, "");
  return tag ? `[tag:${tag}] ${cleaned}` : cleaned;
}
function getCleanNotes(notes: string): string {
  return notes.replace(/^\[tag:\w+\]\s*/, "").replace(/\[fav\]\s*/g, "").trim();
}
function isFavorite(notes: string): boolean {
  return notes.includes("[fav]");
}
function toggleFavInNotes(notes: string): string {
  if (notes.includes("[fav]")) return notes.replace("[fav] ", "").replace("[fav]", "");
  const tagMatch = notes.match(/^(\[tag:\w+\]\s*)/);
  if (tagMatch) return tagMatch[1] + "[fav] " + notes.slice(tagMatch[1].length);
  return "[fav] " + notes;
}
function isPhotoAvatar(avatar: string): boolean {
  return avatar.startsWith("data:") || avatar.startsWith("http");
}

function ClientAvatar({ avatar, firstName, lastName, size = 48 }: { avatar: string; firstName: string; lastName: string; size?: number }) {
  if (isPhotoAvatar(avatar)) {
    return (
      <img src={avatar} alt={`${firstName} ${lastName}`}
        className="rounded-full object-cover"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, backgroundColor: avatar, fontSize: size * 0.33 }}>
      {getInitials(firstName, lastName)}
    </div>
  );
}

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, getClientAppointments, getClientInvoices, appointments, invoices, loyaltyCards, loyaltyTemplates, updateLoyaltyCard, addLoyaltyCard } = useApp();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<Sort>("recent");
  const [filterTag, setFilterTag] = useState<ClientTag | "all">("all");
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>("history");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [cardCopied, setCardCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", notes: "", tag: "" as ClientTag });
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });

  // Group messaging state
  const [showGroupMsg, setShowGroupMsg] = useState(false);
  const [groupStep, setGroupStep] = useState<"compose" | "confirm" | "sent">("compose");
  const [groupSelected, setGroupSelected] = useState<Set<string>>(new Set());
  const [groupFilter, setGroupFilter] = useState<"all" | "vip" | "regular" | "new" | "withEmail">("all");
  const [groupMessage, setGroupMessage] = useState("");
  const [groupSubject, setGroupSubject] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const newPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (searchParams.get("new") === "1") setShowNew(true); }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...clients];
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      list = list.filter((c) => `${c.firstName} ${c.lastName} ${c.phone} ${c.email}`.toLowerCase().includes(q));
    }
    if (filterTag !== "all") list = list.filter((c) => getClientTag(c.notes) === filterTag);
    if (sort === "alpha") list.sort((a, b) => a.lastName.localeCompare(b.lastName));
    else if (sort === "frequent") list.sort((a, b) => appointments.filter((x) => x.clientId === b.id).length - appointments.filter((x) => x.clientId === a.id).length);
    else if (sort === "favorites") list = list.filter((c) => isFavorite(c.notes)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [clients, deferredSearch, sort, filterTag, appointments]);

  const grouped = useMemo(() => {
    if (sort !== "alpha") return null;
    const m = new Map<string, typeof filtered>();
    filtered.forEach((c) => {
      const letter = (c.lastName[0] || c.firstName[0] || "?").toUpperCase();
      if (!m.has(letter)) m.set(letter, []);
      m.get(letter)!.push(c);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, sort]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    return clients.filter((c) => c.createdAt >= monthStart).length;
  }, [clients]);

  // Stats for the stats modal
  const vipCount = useMemo(() => clients.filter((c) => getClientTag(c.notes) === "vip").length, [clients]);
  const withEmail = useMemo(() => clients.filter((c) => c.email).length, [clients]);
  const withPhone = useMemo(() => clients.filter((c) => c.phone).length, [clients]);
  const totalRevenue = useMemo(() => invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0), [invoices]);

  const selected = selectedId ? clients.find((c) => c.id === selectedId) : null;
  const selAppts = selectedId ? getClientAppointments(selectedId) : [];
  const selInvoices = selectedId ? getClientInvoices(selectedId) : [];
  const totalSpent = selInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = selInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);

  const lastVisit = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach((c) => {
      const appts = appointments.filter((a) => a.clientId === c.id && a.status === "done").sort((a, b) => b.date.localeCompare(a.date));
      if (appts.length > 0) m[c.id] = appts[0].date;
    });
    return m;
  }, [clients, appointments]);

  function handleSubmit() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const notes = form.tag ? `[tag:${form.tag}] ${form.notes.trim()}` : form.notes.trim();
    addClient({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim(), email: form.email.trim(), notes });
    setShowNew(false);
    setForm({ firstName: "", lastName: "", phone: "", email: "", notes: "", tag: "" });
  }

  function openEdit() {
    if (!selected) return;
    setEditForm({ firstName: selected.firstName, lastName: selected.lastName, phone: selected.phone, email: selected.email });
    setShowEdit(true);
  }

  function handleEditSave() {
    if (!selectedId || !editForm.firstName.trim() || !editForm.lastName.trim()) return;
    updateClient(selectedId, {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
    });
    setShowEdit(false);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, clientId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        // Resize to max 200px to keep data small
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 200;
          let w = img.width, h = img.height;
          if (w > h) { h = (h / w) * max; w = max; } else { w = (w / h) * max; h = max; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          updateClient(clientId, { avatar: canvas.toDataURL("image/jpeg", 0.8) });
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function saveNotes() {
    if (selectedId) { updateClient(selectedId, { notes: notesDraft }); setEditingNotes(false); }
  }

  function toggleFavorite(clientId: string) {
    const c = clients.find((x) => x.id === clientId);
    if (c) updateClient(clientId, { notes: toggleFavInNotes(c.notes) });
  }

  function setClientTag(clientId: string, tag: ClientTag) {
    const c = clients.find((x) => x.id === clientId);
    if (c) updateClient(clientId, { notes: setTagInNotes(c.notes, tag) });
  }

  // ── Group messaging helpers ────────────────────────────
  const groupEligible = useMemo(() => {
    return clients.filter((c) => {
      if (groupFilter === "vip") return getClientTag(c.notes) === "vip";
      if (groupFilter === "regular") return getClientTag(c.notes) === "regular";
      if (groupFilter === "new") return getClientTag(c.notes) === "new";
      if (groupFilter === "withEmail") return !!c.email;
      return true;
    });
  }, [clients, groupFilter]);

  function openGroupMsg() {
    setShowGroupMsg(true);
    setGroupStep("compose");
    setGroupSelected(new Set());
    setGroupFilter("all");
    setGroupMessage("");
    setGroupSubject("");
  }

  function toggleClientSelected(id: string) {
    const next = new Set(groupSelected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setGroupSelected(next);
  }

  function selectAllEligible() {
    setGroupSelected(new Set(groupEligible.map((c) => c.id)));
  }

  function clearSelection() {
    setGroupSelected(new Set());
  }

  function sendGroupMessage() {
    const recipients = clients.filter((c) => groupSelected.has(c.id));
    const emails = recipients.map((c) => c.email).filter(Boolean);

    // Persist to local history
    try {
      const existing = JSON.parse(localStorage.getItem("group_messages_history") || "[]") as Array<{
        id: string;
        subject: string;
        body: string;
        recipientIds: string[];
        sentAt: number;
      }>;
      existing.unshift({
        id: Date.now().toString(36),
        subject: groupSubject.trim() || "Message",
        body: groupMessage.trim(),
        recipientIds: recipients.map((r) => r.id),
        sentAt: Date.now(),
      });
      localStorage.setItem("group_messages_history", JSON.stringify(existing.slice(0, 50)));
    } catch { /* ignore storage errors */ }

    // Open mailto with BCC for real delivery (if any emails)
    if (emails.length > 0) {
      const subject = encodeURIComponent(groupSubject.trim() || "Message important");
      const body = encodeURIComponent(groupMessage.trim());
      const bcc = emails.join(",");
      window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
    }

    setGroupStep("sent");
  }

  const groupRecipients = clients.filter((c) => groupSelected.has(c.id));
  const groupRecipientsWithEmail = groupRecipients.filter((c) => c.email).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background">

      {/* ═══ FIXED HEADER ═══ */}
      <div className="flex-shrink-0">
        <header className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Gestion Clients</h1>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.94 }} onClick={openGroupMsg}
              className="rounded-xl px-3 py-2 flex items-center gap-1.5 text-white"
              style={{
                background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                boxShadow: "0 6px 16px rgba(91,79,233,0.28)",
              }}>
              <MessageSquare size={13} strokeWidth={2.6} />
              <span className="text-[12px] font-bold">Groupe</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => setShowNew(true)}
              className="bg-white rounded-xl px-3.5 py-2 shadow-sm-apple flex items-center gap-1.5 border border-border-light">
              <UserPlus size={14} className="text-accent" />
              <span className="text-[12px] font-bold text-foreground">Nouveau</span>
            </motion.button>
          </div>
        </header>

        {/* Search */}
        <div className="px-6 pb-3">
          <div className="bg-white rounded-2xl shadow-card-premium flex items-center px-4 py-3 gap-3">
            <Search size={17} className="text-subtle flex-shrink-0" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client..."
              className="flex-1 text-[14px] text-foreground placeholder:text-subtle bg-transparent outline-none" />
            <div className="relative">
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowSortMenu(!showSortMenu)}>
                <SlidersHorizontal size={17} className={showSortMenu ? "text-accent" : "text-muted"} />
              </motion.button>
              {showSortMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 top-8 z-30 bg-white rounded-2xl shadow-apple-lg p-2 min-w-[160px]">
                  {(["recent", "alpha", "frequent", "favorites"] as Sort[]).map((s) => (
                    <button key={s} onClick={() => { setSort(s); setShowSortMenu(false); }}
                      className={`w-full text-left text-[13px] font-semibold px-3.5 py-2.5 rounded-xl ${sort === s ? "bg-accent-soft text-accent" : "text-foreground"}`}>
                      {SORT_LABELS[s]}
                    </button>
                  ))}
                  <div className="border-t border-border-light mt-1 pt-1">
                    {([["all", "Tous"], ["vip", "VIP"], ["new", "Nouveaux"]] as const).map(([key, label]) => (
                      <button key={key} onClick={() => { setFilterTag(key); setShowSortMenu(false); }}
                        className={`w-full text-left text-[13px] font-semibold px-3.5 py-2.5 rounded-xl ${filterTag === key ? "bg-accent-soft text-accent" : "text-foreground"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Stats cards — both clickable */}
        <div className="px-6 pb-4 flex gap-3">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowStats(true)}
            className="flex-1 bg-white rounded-2xl p-4 shadow-card-premium text-left">
            <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Total clients</p>
            <div className="flex items-end gap-2 mt-1.5">
              <p className="text-[28px] font-bold text-foreground leading-none">{clients.length}</p>
              {newThisMonth > 0 && (
                <span className="text-[11px] font-bold text-success mb-1 flex items-center gap-0.5">
                  <TrendingUp size={10} /> +{newThisMonth}
                </span>
              )}
            </div>
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowNew(true)}
            className="flex-1 bg-accent-gradient rounded-2xl p-4 shadow-card-premium text-left relative overflow-hidden">
            <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Nouveaux ce mois</p>
            <div className="flex items-end justify-between mt-1.5">
              <p className="text-[28px] font-bold text-white leading-none">{newThisMonth}</p>
              <UserPlus size={22} className="text-white/40" />
            </div>
          </motion.button>
        </div>
      </div>

      {/* ═══ SCROLLABLE LIST ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
        onClick={() => showSortMenu && setShowSortMenu(false)}>
        <div className="px-6 pb-32">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-bold text-foreground">Annuaire</h2>
            <p className="text-[11px] text-muted font-medium">Trier par : {SORT_LABELS[sort]}</p>
          </div>

          {filterTag !== "all" && (
            <div className="mb-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFilterTag("all")}
                className="text-[11px] font-bold text-accent bg-accent-soft px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                Filtre : {filterTag === "vip" ? "VIP" : "Nouveaux"} ×
              </motion.button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="bg-white rounded-[22px] p-8 shadow-card-premium text-center mt-2">
              <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                <UserPlus size={28} className="text-accent" />
              </div>
              <p className="text-[16px] font-bold text-foreground mb-1">{search || filterTag !== "all" ? "Aucun résultat" : "Aucun client"}</p>
              <p className="text-[13px] text-muted mb-5">{search ? "Essayez un autre terme." : "Ajoutez votre premier client."}</p>
              {!search && filterTag === "all" && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowNew(true)}
                  className="inline-flex items-center gap-2 bg-accent-gradient text-white text-[13px] font-bold px-5 py-2.5 rounded-xl fab-shadow">
                  <Plus size={15} /> Ajouter un client
                </motion.button>
              )}
            </div>
          ) : sort === "alpha" && grouped ? (
            <div className="space-y-4">
              {grouped.map(([letter, groupClients]) => (
                <div key={letter}>
                  <p className="text-[13px] font-bold text-accent mb-2 px-1">{letter}</p>
                  <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden">
                    {groupClients.map((client, i) => (
                      <ClientRow key={client.id} client={client} isLast={i === groupClients.length - 1}
                        lastVisit={lastVisit}
                        onClick={() => { setSelectedId(client.id); setProfileTab("history"); setEditingNotes(false); setShowEdit(false); }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden">
              {filtered.map((client, i) => (
                <ClientRow key={client.id} client={client} isLast={i === filtered.length - 1}
                  lastVisit={lastVisit}
                  onClick={() => { setSelectedId(client.id); setProfileTab("history"); setEditingNotes(false); setShowEdit(false); }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* New client */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouveau client">
        <div className="space-y-4">
          {/* Photo upload happens after creation from the client profile card */}
          <div className="grid grid-cols-2 gap-3">
            {[["Prénom", "firstName", "Marie"], ["Nom", "lastName", "Dupont"]].map(([label, key, ph]) => (
              <div key={key}>
                <label className="text-[12px] text-muted font-semibold mb-1.5 block">{label}</label>
                <input value={(form as Record<string, string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={ph} className="input-field" />
              </div>
            ))}
          </div>
          {[["Téléphone", "phone", "06 12 34 56 78", "tel"], ["Email", "email", "marie@email.com", "email"]].map(([label, key, ph, type]) => (
            <div key={key}>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">{label}</label>
              <input value={(form as Record<string, string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph} type={type} className="input-field" />
            </div>
          ))}
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Catégorie</label>
            <div className="flex gap-2">
              {(["", "vip", "regular", "new"] as ClientTag[]).map((t) => (
                <motion.button key={t} whileTap={{ scale: 0.96 }} onClick={() => setForm({ ...form, tag: t })}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    form.tag === t
                      ? t === "vip" ? "bg-warning text-white" : t === "regular" ? "bg-accent text-white" : t === "new" ? "bg-success text-white" : "bg-border text-foreground"
                      : "bg-border-light text-muted"
                  }`}>
                  {t === "" ? "Aucun" : t === "vip" ? "VIP" : t === "regular" ? "Régulier" : "Nouveau"}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optionnel..." rows={2} className="input-field resize-none" />
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
            className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold fab-shadow">
            Ajouter le client
          </motion.button>
        </div>
      </Modal>

      {/* Group messaging modal */}
      <Modal
        open={showGroupMsg}
        onClose={() => setShowGroupMsg(false)}
        title={groupStep === "compose" ? "Message groupé" : groupStep === "confirm" ? "Confirmer l'envoi" : "Message envoyé"}
        size="large"
      >
        {groupStep === "compose" && (
          <div className="space-y-4">
            {/* Filter chips */}
            <div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Filtrer les destinataires</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {([
                  ["all", "Tous"],
                  ["vip", "VIP"],
                  ["regular", "Réguliers"],
                  ["new", "Nouveaux"],
                  ["withEmail", "Avec email"],
                ] as const).map(([key, label]) => {
                  const active = groupFilter === key;
                  return (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setGroupFilter(key)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap"
                      style={
                        active
                          ? {
                              background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                              color: "white",
                              boxShadow: "0 4px 12px rgba(91,79,233,0.25)",
                            }
                          : { backgroundColor: "#F4F4F5", color: "#71717A" }
                      }
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Selection summary + actions */}
            <div className="bg-border-light rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-foreground">
                  {groupSelected.size} sélectionné{groupSelected.size > 1 ? "s" : ""}
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  {groupEligible.length} client{groupEligible.length > 1 ? "s" : ""} dans ce filtre
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllEligible}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg"
                  style={{ color: "#5B4FE9", backgroundColor: "#EEF0FF" }}
                >
                  Tout cocher
                </button>
                {groupSelected.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-[11px] font-bold text-muted px-3 py-1.5 rounded-lg bg-white border border-border-light"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Clients list with checkboxes */}
            <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border-light">
              {groupEligible.length === 0 ? (
                <p className="text-[12px] text-muted text-center py-8">Aucun client dans ce filtre.</p>
              ) : (
                groupEligible.map((c, i) => {
                  const checked = groupSelected.has(c.id);
                  const tag = getClientTag(c.notes);
                  return (
                    <motion.button
                      key={c.id}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleClientSelected(c.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left ${i < groupEligible.length - 1 ? "border-b border-border-light" : ""}`}
                      style={{ backgroundColor: checked ? "#EEF0FF" : "white" }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: checked ? "#5B4FE9" : "white",
                          border: checked ? "1.5px solid #5B4FE9" : "1.5px solid #D4D4D8",
                        }}
                      >
                        {checked && <Check size={12} className="text-white" strokeWidth={3.2} />}
                      </div>
                      <ClientAvatar avatar={c.avatar} firstName={c.firstName} lastName={c.lastName} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-foreground truncate">
                          {c.firstName} {c.lastName}
                          {tag && TAG_CONFIG[tag] && (
                            <span className={`ml-2 text-[8px] font-bold ${TAG_CONFIG[tag].color} ${TAG_CONFIG[tag].bg} px-1.5 py-0.5 rounded uppercase`}>
                              {TAG_CONFIG[tag].label}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted truncate flex items-center gap-1 mt-0.5">
                          {c.email ? (
                            <>
                              <AtSign size={9} /> {c.email}
                            </>
                          ) : (
                            "Pas d'email"
                          )}
                        </p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Subject + message */}
            <div>
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Objet (optionnel)</label>
              <input
                value={groupSubject}
                onChange={(e) => setGroupSubject(e.target.value)}
                placeholder="Offre spéciale, nouveauté..."
                className="input-field"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Message</label>
              <textarea
                value={groupMessage}
                onChange={(e) => setGroupMessage(e.target.value)}
                placeholder="Rédigez votre message. Il sera envoyé à tous les destinataires sélectionnés en copie cachée."
                rows={5}
                className="input-field resize-none"
              />
              <p className="text-[10px] text-muted mt-1.5">
                {groupMessage.length} caractères — sera envoyé par email en copie cachée (BCC).
              </p>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={groupSelected.size > 0 && groupMessage.trim() ? { scale: 0.98 } : undefined}
              onClick={() => (groupSelected.size > 0 && groupMessage.trim() ? setGroupStep("confirm") : undefined)}
              disabled={groupSelected.size === 0 || !groupMessage.trim()}
              className="w-full text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                boxShadow: groupSelected.size > 0 && groupMessage.trim() ? "0 10px 24px rgba(91,79,233,0.35)" : "none",
              }}
            >
              <Send size={15} strokeWidth={2.6} />
              Continuer ({groupSelected.size})
            </motion.button>
          </div>
        )}

        {groupStep === "confirm" && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: "linear-gradient(135deg, #EEF0FF, white)",
                border: "1px solid #5B4FE9",
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)" }}>
                <Send size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">Prêt à envoyer</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  {groupSelected.size} destinataire{groupSelected.size > 1 ? "s" : ""}
                  {groupRecipientsWithEmail > 0 && ` — ${groupRecipientsWithEmail} avec email`}
                  {groupRecipientsWithEmail < groupSelected.size && ` (${groupSelected.size - groupRecipientsWithEmail} sans email)`}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border-light p-4">
              {groupSubject && (
                <>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Objet</p>
                  <p className="text-[13px] font-bold text-foreground mb-3">{groupSubject}</p>
                </>
              )}
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Message</p>
              <p className="text-[12px] text-foreground mt-1 leading-relaxed whitespace-pre-wrap">{groupMessage}</p>
            </div>

            <div className="bg-warning-soft rounded-xl p-3 flex items-start gap-2.5">
              <Sparkles size={13} className="text-warning mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-foreground leading-relaxed">
                Votre client email s'ouvrira avec les destinataires en copie cachée (BCC). Aucun client ne verra les autres adresses.
              </p>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setGroupStep("compose")}
                className="flex-1 bg-white border border-border rounded-2xl py-3.5 text-[13px] font-bold text-muted"
              >
                Retour
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={sendGroupMessage}
                className="flex-1 text-white py-3.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                  boxShadow: "0 10px 24px rgba(91,79,233,0.35)",
                }}
              >
                <Send size={14} strokeWidth={2.6} /> Envoyer
              </motion.button>
            </div>
          </div>
        )}

        {groupStep === "sent" && (
          <div className="py-2">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 14 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 12px 32px rgba(91,79,233,0.4)" }}
              >
                <Check size={32} className="text-white" strokeWidth={3} />
              </motion.div>
            </div>
            <h3 className="text-[18px] font-bold text-foreground text-center">Message envoyé !</h3>
            <p className="text-[12px] text-muted text-center mt-2 leading-relaxed">
              {groupSelected.size} destinataire{groupSelected.size > 1 ? "s" : ""} — archivé dans votre historique.
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowGroupMsg(false)}
              className="w-full mt-5 text-white py-3.5 rounded-2xl text-[14px] font-bold"
              style={{
                background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                boxShadow: "0 10px 24px rgba(91,79,233,0.35)",
              }}
            >
              Fermer
            </motion.button>
          </div>
        )}
      </Modal>

      {/* Stats breakdown modal */}
      <Modal open={showStats} onClose={() => setShowStats(false)} title="Statistiques clients">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total", value: clients.length, color: "text-foreground" },
              { label: "VIP", value: vipCount, color: "text-warning" },
              { label: "Nouveaux ce mois", value: newThisMonth, color: "text-success" },
              { label: "Avec email", value: withEmail, color: "text-accent" },
              { label: "Avec téléphone", value: withPhone, color: "text-accent" },
              { label: "Revenu total", value: `${totalRevenue.toFixed(0)} €`, color: "text-success" },
            ].map((s, i) => (
              <div key={i} className="bg-border-light rounded-xl p-3.5">
                <p className={`text-[20px] font-bold leading-none ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Client profile */}
      <Modal open={!!selected && !showEdit} onClose={() => setSelectedId(null)} title="Fiche client" size="large">
        {selected && (() => {
          const tag = getClientTag(selected.notes);
          const fav = isFavorite(selected.notes);
          const cleanNotes = getCleanNotes(selected.notes);
          return (
            <div className="space-y-5">
              {/* Header with photo + edit */}
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <ClientAvatar avatar={selected.avatar} firstName={selected.firstName} lastName={selected.lastName} size={64} />
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-sm border-2 border-white">
                    <Camera size={11} className="text-white" />
                  </motion.button>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => handlePhotoUpload(e, selected.id)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[20px] font-bold text-foreground truncate">{selected.firstName} {selected.lastName}</p>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleFavorite(selected.id)}>
                      <Heart size={18} className={fav ? "text-danger" : "text-border"} fill={fav ? "currentColor" : "none"} />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {tag && TAG_CONFIG[tag] && (
                      <span className={`text-[10px] font-bold ${TAG_CONFIG[tag].color} ${TAG_CONFIG[tag].bg} px-2 py-0.5 rounded-md`}>{TAG_CONFIG[tag].label}</span>
                    )}
                    <span className="text-[11px] text-accent font-semibold">{selAppts.length} RDV</span>
                    <span className="text-[11px] text-success font-bold">{totalSpent.toFixed(0)} €</span>
                    {totalPending > 0 && <span className="text-[11px] text-warning font-bold">{totalPending.toFixed(0)} € dû</span>}
                  </div>
                </div>
              </div>

              {/* Edit button */}
              <motion.button whileTap={{ scale: 0.98 }} onClick={openEdit}
                className="w-full bg-border-light rounded-xl py-2.5 flex items-center justify-center gap-2 text-[13px] font-bold text-accent">
                <Edit3 size={14} /> Modifier les informations
              </motion.button>

              {/* Tag selector */}
              <div>
                <p className="text-[11px] text-muted font-bold mb-2 flex items-center gap-1"><Tag size={10} /> Catégorie</p>
                <div className="flex gap-1.5">
                  {(["", "vip", "regular", "new"] as ClientTag[]).map((t) => (
                    <motion.button key={t} whileTap={{ scale: 0.96 }} onClick={() => setClientTag(selected.id, t)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                        tag === t
                          ? t === "vip" ? "bg-warning text-white" : t === "regular" ? "bg-accent text-white" : t === "new" ? "bg-success text-white" : "bg-border text-foreground"
                          : "bg-border-light text-muted"
                      }`}>
                      {t === "" ? "—" : t === "vip" ? "VIP" : t === "regular" ? "Régulier" : "Nouveau"}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <Link href="/appointments?new=1" className="flex-1" onClick={() => setSelectedId(null)}>
                  <motion.div whileTap={{ scale: 0.95 }} className="bg-accent-gradient text-white rounded-xl py-3 text-center fab-shadow">
                    <p className="text-[12px] font-bold">+ RDV</p>
                  </motion.div>
                </Link>
                <Link href="/gestion?new=1" className="flex-1" onClick={() => setSelectedId(null)}>
                  <motion.div whileTap={{ scale: 0.95 }} className="bg-border-light rounded-xl py-3 text-center">
                    <p className="text-[12px] font-bold text-foreground">+ Facture</p>
                  </motion.div>
                </Link>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex-1">
                    <motion.div whileTap={{ scale: 0.95 }} className="bg-success-soft rounded-xl py-3 text-center">
                      <p className="text-[12px] font-bold text-success">Appeler</p>
                    </motion.div>
                  </a>
                )}
              </div>

              {/* Contact */}
              {(selected.phone || selected.email) && (
                <div className="bg-border-light rounded-2xl p-4 space-y-3">
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="flex items-center gap-3 text-[13px]">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm-apple"><Phone size={14} className="text-muted" /></div>
                      <span className="font-semibold">{selected.phone}</span>
                    </a>
                  )}
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} className="flex items-center gap-3 text-[13px]">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm-apple"><Mail size={14} className="text-muted" /></div>
                      <span className="font-semibold">{selected.email}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Loyalty card section */}
              {(() => {
                const clientCards = loyaltyCards.filter((c) => c.clientId === selected.id);

                return (
                  <div>
                    <p className="text-[12px] text-muted font-semibold flex items-center gap-1.5 mb-2"><CreditCard size={12} /> Carte de fidélité</p>

                    {clientCards.length === 0 ? (
                      <div className="bg-border-light rounded-2xl p-4 text-center">
                        <p className="text-[12px] text-muted mb-2">Aucune carte pour ce client.</p>
                        {loyaltyTemplates.length > 0 ? (
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const tpl = loyaltyTemplates[0];
                              const code = "CLT-" + Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
                              addLoyaltyCard({ templateId: tpl.id, clientId: selected.id, code, progress: 0 });
                            }}
                            className="text-[11px] font-bold text-accent bg-accent-soft px-4 py-2 rounded-xl inline-flex items-center gap-1.5">
                            <Plus size={12} /> Créer une carte
                          </motion.button>
                        ) : (
                          <Link href="/loyalty-manage" onClick={() => setSelectedId(null)}>
                            <span className="text-[11px] font-bold text-accent">Créer un programme d&apos;abord →</span>
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {clientCards.map((card) => {
                          const tpl = loyaltyTemplates.find((t) => t.id === card.templateId);
                          if (!tpl) return null;
                          const doneAppts = appointments.filter((a) => a.clientId === card.clientId && a.status === "done").length;
                          const effectiveProgress = tpl.mode === "visits" ? Math.max(card.progress, doneAppts) : card.progress;
                          const pct = Math.min((effectiveProgress / tpl.goal) * 100, 100);
                          const isComplete = effectiveProgress >= tpl.goal;

                          return (
                            <div key={card.id}>
                              {/* Mini card visual */}
                              <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: tpl.color }}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[16px]">{tpl.emoji}</span>
                                    <p className="text-[13px] font-bold">{tpl.name}</p>
                                  </div>
                                  <span className="text-[10px] font-bold text-white/50 tracking-wider">{card.code}</span>
                                </div>
                                <div className="flex items-end justify-between">
                                  <p className="text-[22px] font-bold">{effectiveProgress}/{tpl.goal}</p>
                                  <p className="text-[9px] text-white/60 text-right max-w-[120px]">{tpl.reward}</p>
                                </div>
                                <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => updateLoyaltyCard(card.id, { progress: Math.max(0, card.progress - 1) })}
                                    className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center">
                                    <Minus size={13} className="text-muted" />
                                  </motion.button>
                                  <span className="text-[14px] font-bold text-foreground w-10 text-center">{effectiveProgress}</span>
                                  <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => updateLoyaltyCard(card.id, { progress: card.progress + 1 })}
                                    className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
                                    <Plus size={13} />
                                  </motion.button>
                                </div>
                                <motion.button whileTap={{ scale: 0.96 }}
                                  onClick={() => { navigator.clipboard.writeText(card.code); setCardCopied(card.code); setTimeout(() => setCardCopied(null), 2000); }}
                                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${cardCopied === card.code ? "bg-success text-white" : "bg-border-light text-muted"}`}>
                                  {cardCopied === card.code ? <><Check size={10} /> Copié</> : <><Copy size={10} /> Code</>}
                                </motion.button>
                              </div>

                              {isComplete && (
                                <div className="bg-success-soft rounded-xl p-2.5 mt-2 flex items-center gap-2">
                                  <CheckCircle2 size={14} className="text-success" />
                                  <p className="text-[11px] font-bold text-success">Récompense débloquée : {tpl.reward}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Notes */}
              <div className="bg-border-light rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] text-muted font-semibold flex items-center gap-1.5"><FileText size={12} /> Notes</p>
                  {!editingNotes ? (
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => { setNotesDraft(selected.notes); setEditingNotes(true); }}
                      className="text-[11px] text-accent font-bold flex items-center gap-1"><Edit3 size={10} /> Modifier</motion.button>
                  ) : (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={saveNotes}
                      className="text-[11px] text-accent font-bold">Enregistrer</motion.button>
                  )}
                </div>
                {editingNotes ? (
                  <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)}
                    className="w-full bg-white rounded-xl px-3.5 py-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/15 resize-none"
                    rows={3} placeholder="Ajouter des notes..." autoFocus />
                ) : (
                  <p className="text-[13px] text-foreground/70 leading-relaxed">{cleanNotes || "Aucune note."}</p>
                )}
              </div>

              {/* Unified timeline */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 px-1">
                  Historique complet
                </p>
                <ClientTimeline
                  clientId={selected.id}
                  appointments={appointments}
                  invoices={invoices}
                  createdAt={selected.createdAt}
                />
              </div>

              <button onClick={() => {
                const snap = { ...selected };
                deleteClient(selected.id);
                setSelectedId(null);
                import("@/components/UndoToast").then(({ showUndoToast }) => {
                  showUndoToast(`${snap.firstName} ${snap.lastName} supprimé`, () => {
                    addClient({ firstName: snap.firstName, lastName: snap.lastName, phone: snap.phone, email: snap.email, notes: snap.notes });
                  });
                });
              }}
                className="w-full text-danger text-[12px] py-2.5 flex items-center justify-center gap-1.5 opacity-40 hover:opacity-60 transition-opacity">
                <Trash2 size={12} /> Supprimer ce client
              </button>
            </div>
          );
        })()}
      </Modal>

      {/* Edit client modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier le client">
        {selected && (
          <div className="space-y-4">
            {/* Photo change */}
            <div className="flex justify-center">
              <div className="relative">
                <ClientAvatar avatar={selected.avatar} firstName={selected.firstName} lastName={selected.lastName} size={80} />
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-sm border-2 border-white">
                  <Camera size={13} className="text-white" />
                </motion.button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handlePhotoUpload(e, selected.id)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted font-semibold mb-1.5 block">Prénom</label>
                <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="text-[12px] text-muted font-semibold mb-1.5 block">Nom</label>
                <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Téléphone</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                type="tel" className="input-field" />
            </div>
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Email</label>
              <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                type="email" className="input-field" />
            </div>

            <motion.button whileTap={{ scale: 0.98 }} onClick={handleEditSave}
              className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow">
              <Save size={16} /> Enregistrer
            </motion.button>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── Client row — with photo avatar support ── */
function ClientRow({ client, isLast, lastVisit, onClick }: {
  client: { id: string; firstName: string; lastName: string; avatar: string; notes: string };
  isLast: boolean;
  lastVisit: Record<string, string>;
  onClick: () => void;
}) {
  const tag = getClientTag(client.notes);
  const fav = isFavorite(client.notes);
  const lv = lastVisit[client.id];

  return (
    <motion.button whileTap={{ scale: 0.99 }} onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left ${!isLast ? "border-b border-border-light" : ""}`}>
      <div className="relative flex-shrink-0">
        <ClientAvatar avatar={client.avatar} firstName={client.firstName} lastName={client.lastName} size={48} />
        {fav && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-warning flex items-center justify-center">
            <Star size={8} className="text-white" fill="white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-bold text-foreground truncate">{client.firstName} {client.lastName}</p>
          {tag && TAG_CONFIG[tag] && (
            <span className={`text-[9px] font-bold uppercase tracking-wider ${TAG_CONFIG[tag].color} ${TAG_CONFIG[tag].bg} px-2 py-0.5 rounded-md flex-shrink-0`}>
              {TAG_CONFIG[tag].label}
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted mt-0.5">
          {lv ? <>Dernière visite : {new Date(lv).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</> : <>Pas encore de visite</>}
        </p>
      </div>
      <ChevronRight size={16} className="text-border flex-shrink-0" />
    </motion.button>
  );
}
