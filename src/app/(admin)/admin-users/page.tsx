"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Search, UserPlus, RefreshCw, Mail, CalendarDays, Briefcase, User } from "lucide-react";

interface DBUser {
  id: string;
  name: string;
  email: string;
  business: string;
  has_onboarded: boolean;
  created_at: string;
  booking_slug: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [appointmentCounts, setAppointmentCounts] = useState<Record<string, number>>({});
  const [revenueCounts, setRevenueCounts] = useState<Record<string, number>>({});

  async function loadData() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, name, email, business, has_onboarded, created_at, booking_slug")
      .order("created_at", { ascending: false });

    if (profiles) {
      setUsers(profiles);

      // Load appointment counts per user
      const { data: appts } = await supabase.from("appointments").select("user_id");
      if (appts) {
        const counts: Record<string, number> = {};
        appts.forEach((a) => { counts[a.user_id] = (counts[a.user_id] || 0) + 1; });
        setAppointmentCounts(counts);
      }

      // Load revenue per user
      const { data: invs } = await supabase.from("invoices").select("user_id, amount, status, client_id");
      if (invs) {
        const rev: Record<string, number> = {};
        invs.filter((i) => i.status === "paid" && i.client_id !== "__expense__").forEach((i) => {
          rev[i.user_id] = (rev[i.user_id] || 0) + Number(i.amount);
        });
        setRevenueCounts(rev);
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => `${u.name} ${u.email} ${u.business}`.toLowerCase().includes(q));
  }, [users, search]);

  const onboardedCount = users.filter((u) => u.has_onboarded).length;

  // New this week
  const newThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return users.filter((u) => new Date(u.created_at) >= weekAgo).length;
  }, [users]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[24px] font-bold text-foreground tracking-tight">Utilisateurs</h1>
          <motion.button whileTap={{ scale: 0.85 }} onClick={loadData} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <RefreshCw size={14} className={`text-muted ${loading ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
        <p className="text-[12px] text-muted">Tous les comptes inscrits sur la plateforme.</p>
        <div className="mt-3 bg-white rounded-2xl px-4 py-3 shadow-card-premium flex items-center gap-3">
          <Search size={16} className="text-subtle" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, email..."
            className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-subtle" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mt-4">
              <UserPlus size={28} className="text-muted mx-auto mb-3" />
              <p className="text-[15px] font-bold text-foreground">{search ? "Aucun résultat" : "Aucun utilisateur inscrit"}</p>
              <p className="text-[12px] text-muted mt-1">Les nouveaux inscrits apparaîtront ici automatiquement.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {filtered.map((user, i) => {
                const apptCount = appointmentCounts[user.id] || 0;
                const revenue = revenueCounts[user.id] || 0;
                return (
                  <motion.div key={user.id} initial={{ y: 4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-2xl p-4 shadow-card-premium">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center text-accent text-[14px] font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-bold text-foreground truncate">{user.name || "Sans nom"}</p>
                          <div className={`w-2 h-2 rounded-full ${user.has_onboarded ? "bg-success" : "bg-border"}`} />
                        </div>
                        <p className="text-[11px] text-muted truncate">{user.email || "Pas d'email"}</p>
                      </div>
                    </div>
                    {user.business && (
                      <p className="text-[11px] text-muted flex items-center gap-1 mb-2"><Briefcase size={10} /> {user.business}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] flex-wrap">
                      <span className={`font-bold px-2 py-0.5 rounded-md ${user.has_onboarded ? "text-accent bg-accent-soft" : "text-muted bg-border-light"}`}>
                        {user.has_onboarded ? "Actif" : "Inactif"}
                      </span>
                      {apptCount > 0 && <span className="font-bold text-accent">{apptCount} RDV</span>}
                      {revenue > 0 && <span className="font-bold text-success">{revenue.toFixed(0)} €</span>}
                      <span className="text-muted ml-auto flex items-center gap-1">
                        <CalendarDays size={9} /> {new Date(user.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Stats footer */}
          <div className="flex items-center justify-between mt-5 mb-3">
            <div className="text-center"><p className="text-[9px] text-muted font-bold uppercase">Total</p><p className="text-[16px] font-bold text-foreground">{users.length}</p></div>
            <div className="text-center"><p className="text-[9px] text-muted font-bold uppercase">Actifs</p><p className="text-[16px] font-bold text-success">{onboardedCount}</p></div>
            <div className="text-center"><p className="text-[9px] text-muted font-bold uppercase">Cette semaine</p><p className="text-[16px] font-bold text-accent">+{newThisWeek}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
