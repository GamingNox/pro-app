"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  Search, UserPlus, RefreshCw, CalendarDays, Briefcase, X, Mail, KeyRound, Eye,
  CreditCard, Users, Receipt, Check, AlertTriangle, Sparkles,
} from "lucide-react";
import { adminUpdateUserPlan, adminSendPasswordReset, adminFetchUserData, adminListUsers } from "@/lib/admin";
import type { PlanTier } from "@/lib/types";
import { PLAN_NAMES, PLAN_PRICES } from "@/lib/types";

interface DBUser {
  id: string;
  name: string;
  email: string;
  business: string;
  has_onboarded: boolean;
  created_at: string;
  booking_slug: string | null;
  subscription_plan?: PlanTier | null;
}

type UserDataView = Awaited<ReturnType<typeof adminFetchUserData>>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [appointmentCounts, setAppointmentCounts] = useState<Record<string, number>>({});
  const [revenueCounts, setRevenueCounts] = useState<Record<string, number>>({});
  // Edit modal state
  const [selectedUser, setSelectedUser] = useState<DBUser | null>(null);
  const [userData, setUserData] = useState<UserDataView>(null);
  const [action, setAction] = useState<"menu" | "plan" | "reset" | "view">("menu");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function loadData() {
    setLoading(true);
    // Admin reads cross-user data via a service-role API route.
    // The direct supabase queries fail because of strict RLS.
    const payload = await adminListUsers();

    if (!payload?.ok || !Array.isArray(payload.users)) {
      console.error("[admin-users] API returned no users");
      setLoading(false);
      return;
    }

    // Sort by created_at desc to match the previous behavior
    const users = [...(payload.users as Array<DBUser & {
      client_count: number;
      appointment_count: number;
      revenue: number;
    }>)].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    setUsers(users as DBUser[]);

    // Build the lookup maps the UI consumes
    const apptCounts: Record<string, number> = {};
    const revCounts: Record<string, number> = {};
    for (const u of users) {
      apptCounts[u.id] = u.appointment_count || 0;
      revCounts[u.id] = u.revenue || 0;
    }
    setAppointmentCounts(apptCounts);
    setRevenueCounts(revCounts);

    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }

  function openUser(user: DBUser) {
    setSelectedUser(user);
    setAction("menu");
    setUserData(null);
  }

  function closeUser() {
    setSelectedUser(null);
    setUserData(null);
    setAction("menu");
  }

  async function handleChangePlan(plan: PlanTier) {
    if (!selectedUser) return;
    const ok = await adminUpdateUserPlan(selectedUser.id, plan);
    if (ok) {
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, subscription_plan: plan } : u)));
      setSelectedUser({ ...selectedUser, subscription_plan: plan });
      showToast("success", `Plan change en ${PLAN_NAMES[plan]}`);
      setAction("menu");
    } else {
      showToast("error", "Echec de la mise a jour du plan");
    }
  }

  async function handleResetPassword() {
    if (!selectedUser?.email) return;
    const ok = await adminSendPasswordReset(selectedUser.email);
    if (ok) {
      showToast("success", `Email de reinitialisation envoye a ${selectedUser.email}`);
      setAction("menu");
    } else {
      showToast("error", "Echec de l'envoi de l'email");
    }
  }

  async function handleViewData() {
    if (!selectedUser) return;
    setAction("view");
    const data = await adminFetchUserData(selectedUser.id);
    setUserData(data);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => `${u.name} ${u.email} ${u.business}`.toLowerCase().includes(q));
  }, [users, search]);

  const onboardedCount = users.filter((u) => u.has_onboarded).length;
  const newThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return users.filter((u) => new Date(u.created_at) >= weekAgo).length;
  }, [users]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[24px] font-bold text-foreground tracking-tight">Utilisateurs</h1>
          <motion.button whileTap={{ scale: 0.95 }} onClick={loadData} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center" style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
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
              <p className="text-[15px] font-bold text-foreground">{search ? "Aucun resultat" : "Aucun utilisateur inscrit"}</p>
              <p className="text-[12px] text-muted mt-1">Les nouveaux inscrits apparaitront ici automatiquement.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {filtered.map((user, i) => {
                const apptCount = appointmentCounts[user.id] || 0;
                const revenue = revenueCounts[user.id] || 0;
                const planTier = (user.subscription_plan || "essentiel") as PlanTier;
                return (
                  <motion.button
                    key={user.id}
                    initial={{ y: 4, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => openUser(user)}
                    className="bg-white rounded-2xl p-4 shadow-card-premium w-full text-left"
                  >
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
                      <div className="text-right flex-shrink-0">
                        <span className="text-[9px] font-bold text-accent bg-accent-soft px-2 py-1 rounded-md uppercase tracking-wider">
                          {PLAN_NAMES[planTier]}
                        </span>
                      </div>
                    </div>
                    {user.business && (
                      <p className="text-[11px] text-muted flex items-center gap-1 mb-2"><Briefcase size={10} /> {user.business}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] flex-wrap">
                      <span className={`font-bold px-2 py-0.5 rounded-md ${user.has_onboarded ? "text-success bg-success-soft" : "text-muted bg-border-light"}`}>
                        {user.has_onboarded ? "Actif" : "Inactif"}
                      </span>
                      {apptCount > 0 && <span className="font-bold text-accent">{apptCount} RDV</span>}
                      {revenue > 0 && <span className="font-bold text-success">{revenue.toFixed(0)} EUR</span>}
                      <span className="text-muted ml-auto flex items-center gap-1">
                        <CalendarDays size={9} /> {new Date(user.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </motion.button>
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

      {/* ═══ EDIT USER MODAL ═══ */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeUser}
              className="absolute inset-0 bg-black/35 backdrop-blur-modal"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] shadow-apple-lg max-h-[88vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex-shrink-0 px-6 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[18px] font-bold text-foreground">Gerer l&apos;utilisateur</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={closeUser}
                    className="w-8 h-8 rounded-full bg-border-light flex items-center justify-center">
                    <X size={14} className="text-muted" />
                  </motion.button>
                </div>
                <div className="flex items-center gap-3 bg-border-light rounded-2xl p-3">
                  <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center text-accent text-[14px] font-bold">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{selectedUser.name || "Sans nom"}</p>
                    <p className="text-[11px] text-muted truncate">{selectedUser.email}</p>
                  </div>
                  <span className="text-[9px] font-bold text-accent bg-accent-soft px-2 py-1 rounded-md uppercase tracking-wider">
                    {PLAN_NAMES[(selectedUser.subscription_plan || "essentiel") as PlanTier]}
                  </span>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 custom-scroll">
                {/* MENU VIEW */}
                {action === "menu" && (
                  <div className="space-y-2 pt-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setAction("plan")}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-border-light rounded-2xl text-left hover:bg-border-light transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                        <CreditCard size={17} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-foreground">Modifier l&apos;abonnement</p>
                        <p className="text-[10px] text-muted mt-0.5">Changer le plan de l&apos;utilisateur</p>
                      </div>
                      <span className="text-border">›</span>
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setAction("reset")}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-border-light rounded-2xl text-left hover:bg-border-light transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-warning-soft flex items-center justify-center flex-shrink-0">
                        <KeyRound size={17} className="text-warning" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-foreground">Reinitialiser le mot de passe</p>
                        <p className="text-[10px] text-muted mt-0.5">Envoyer un email de reinitialisation</p>
                      </div>
                      <span className="text-border">›</span>
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleViewData}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-border-light rounded-2xl text-left hover:bg-border-light transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-success-soft flex items-center justify-center flex-shrink-0">
                        <Eye size={17} className="text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-foreground">Voir les donnees</p>
                        <p className="text-[10px] text-muted mt-0.5">Mode admin lecture seule</p>
                      </div>
                      <span className="text-border">›</span>
                    </motion.button>
                  </div>
                )}

                {/* PLAN VIEW */}
                {action === "plan" && (
                  <div className="pt-2">
                    <button onClick={() => setAction("menu")} className="text-[12px] text-accent font-bold mb-3">← Retour</button>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-3">Choisir un plan</p>
                    <div className="space-y-2">
                      {(["essentiel", "croissance", "entreprise"] as PlanTier[]).map((tier) => {
                        const current = (selectedUser.subscription_plan || "essentiel") === tier;
                        return (
                          <motion.button
                            key={tier}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleChangePlan(tier)}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left ${
                              current ? "bg-accent text-white" : "bg-border-light"
                            }`}
                          >
                            <div className="flex-1">
                              <p className={`text-[14px] font-bold ${current ? "text-white" : "text-foreground"}`}>
                                {PLAN_NAMES[tier]}
                              </p>
                              <p className={`text-[11px] mt-0.5 ${current ? "text-white/80" : "text-muted"}`}>
                                {PLAN_PRICES[tier]} EUR/mois
                              </p>
                            </div>
                            {current && <Check size={17} className="text-white" />}
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted mt-3 leading-relaxed">
                      La modification est instantanee. L&apos;utilisateur verra ses nouvelles limites des sa prochaine session.
                    </p>
                  </div>
                )}

                {/* RESET PASSWORD VIEW */}
                {action === "reset" && (
                  <div className="pt-2">
                    <button onClick={() => setAction("menu")} className="text-[12px] text-accent font-bold mb-3">← Retour</button>
                    <div className="bg-warning-soft rounded-2xl p-4 mb-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[13px] font-bold text-foreground">Reinitialisation du mot de passe</p>
                          <p className="text-[11px] text-muted mt-1 leading-relaxed">
                            Un email de reinitialisation sera envoye a <strong>{selectedUser.email}</strong>. L&apos;utilisateur devra cliquer sur le lien pour definir un nouveau mot de passe.
                          </p>
                        </div>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleResetPassword}
                      className="w-full bg-warning text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2">
                      <Mail size={16} /> Envoyer l&apos;email de reinitialisation
                    </motion.button>
                  </div>
                )}

                {/* VIEW DATA */}
                {action === "view" && (
                  <div className="pt-2">
                    <button onClick={() => setAction("menu")} className="text-[12px] text-accent font-bold mb-3">← Retour</button>
                    {!userData ? (
                      <div className="text-center py-8">
                        <RefreshCw size={20} className="text-muted mx-auto mb-2 animate-spin" />
                        <p className="text-[12px] text-muted">Chargement des donnees...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-border-light rounded-xl p-3 text-center">
                            <Users size={14} className="text-accent mx-auto mb-1" />
                            <p className="text-[18px] font-bold text-foreground">{userData.clientCount}</p>
                            <p className="text-[9px] text-muted font-bold uppercase">Clients</p>
                          </div>
                          <div className="bg-border-light rounded-xl p-3 text-center">
                            <CalendarDays size={14} className="text-accent mx-auto mb-1" />
                            <p className="text-[18px] font-bold text-foreground">{userData.appointmentCount}</p>
                            <p className="text-[9px] text-muted font-bold uppercase">RDV</p>
                          </div>
                          <div className="bg-border-light rounded-xl p-3 text-center">
                            <Receipt size={14} className="text-success mx-auto mb-1" />
                            <p className="text-[14px] font-bold text-foreground">{userData.revenue.toFixed(0)}</p>
                            <p className="text-[9px] text-muted font-bold uppercase">EUR</p>
                          </div>
                        </div>

                        {/* Recent appointments */}
                        {userData.recentAppointments.length > 0 && (
                          <div>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Rendez-vous recents</p>
                            <div className="space-y-2">
                              {(userData.recentAppointments as Array<{ id: string; title?: string; date?: string; status?: string; price?: number }>).map((a) => (
                                <div key={a.id} className="bg-border-light rounded-xl px-3 py-2.5 flex items-center gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-foreground truncate">{a.title}</p>
                                    <p className="text-[10px] text-muted">{a.date} · {a.status}</p>
                                  </div>
                                  {a.price !== undefined && a.price !== null && (
                                    <span className="text-[11px] font-bold text-foreground">{Number(a.price).toFixed(0)} EUR</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-accent-soft rounded-xl p-3 flex items-center gap-2">
                          <Sparkles size={12} className="text-accent flex-shrink-0" />
                          <p className="text-[10px] text-accent font-semibold">Mode admin lecture seule — aucune modification possible ici</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-xl text-[12px] font-bold shadow-lg ${
              toast.type === "success" ? "bg-success text-white" : "bg-danger text-white"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
