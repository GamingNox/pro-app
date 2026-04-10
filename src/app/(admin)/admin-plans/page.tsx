"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TrendingUp, CheckCircle2, Receipt, CreditCard, RefreshCw } from "lucide-react";

interface DBInvoice { id: string; amount: number; status: string; date: string; description: string; client_id: string; user_id: string; }

export default function AdminPlansPage() {
  const [invoices, setInvoices] = useState<DBInvoice[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [iRes, uRes] = await Promise.all([
      supabase.from("invoices").select("id, amount, status, date, description, client_id, user_id").order("date", { ascending: false }),
      supabase.from("user_profiles").select("id", { count: "exact", head: true }),
    ]);
    if (iRes.data) setInvoices(iRes.data);
    if (uRes.count !== null) setUserCount(uRes.count);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const realInvoices = invoices.filter((i) => i.client_id !== "__expense__");
  const paidTotal = realInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const pendingTotal = realInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + Number(i.amount), 0);
  const paidCount = realInvoices.filter((i) => i.status === "paid").length;
  const pendingCount = realInvoices.filter((i) => i.status === "pending").length;

  const monthRev = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
    const start = monthAgo.toISOString().split("T")[0];
    return realInvoices.filter((i) => i.status === "paid" && i.date >= start).reduce((s, i) => s + Number(i.amount), 0);
  }, [realInvoices]);

  const convRate = userCount > 0 ? Math.round((paidCount / Math.max(userCount, 1)) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Gestion financière</p>
            <h1 className="text-[24px] font-bold text-foreground tracking-tight mt-1">Revenus plateforme</h1>
            <p className="text-[12px] text-muted mt-1">Données réelles · Toutes les transactions.</p>
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={loadData} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <RefreshCw size={14} className={`text-muted ${loading ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
            <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Revenu total plateforme</p>
            <p className="text-[28px] font-bold text-success leading-none mt-1">{paidTotal.toFixed(0)} €</p>
            <p className="text-[11px] text-success font-bold mt-1 flex items-center gap-1"><TrendingUp size={12} /> {monthRev.toFixed(0)} € ce mois</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Payées</p>
              <p className="text-[22px] font-bold text-success leading-none mt-1">{paidCount}</p>
              <p className="text-[10px] text-muted mt-0.5">factures</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">En attente</p>
              <p className="text-[22px] font-bold text-warning leading-none mt-1">{pendingCount}</p>
              <p className="text-[10px] text-muted mt-0.5">{pendingTotal.toFixed(0)} €</p>
            </div>
          </div>

          <div className="bg-accent-soft rounded-2xl p-5 mb-4 text-center">
            <CheckCircle2 size={24} className="text-accent mx-auto mb-2" />
            <p className="text-[28px] font-bold text-foreground">{convRate}%</p>
            <p className="text-[12px] text-muted">Taux de conversion (payé/utilisateurs)</p>
          </div>

          <h2 className="text-[16px] font-bold text-foreground mb-3">Dernières factures</h2>
          {realInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 shadow-card-premium text-center"><Receipt size={24} className="text-muted mx-auto mb-2" /><p className="text-[13px] text-muted">Aucune facture enregistrée.</p></div>
          ) : (
            <div className="space-y-2.5">
              {realInvoices.slice(0, 10).map((inv) => (
                <div key={inv.id} className="bg-white rounded-2xl p-4 shadow-sm-apple flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.status === "paid" ? "bg-success-soft" : "bg-warning-soft"}`}>
                    {inv.status === "paid" ? <CheckCircle2 size={17} className="text-success" /> : <CreditCard size={17} className="text-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-foreground truncate">{inv.description}</p>
                    <p className="text-[10px] text-muted">{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                  </div>
                  <p className={`text-[14px] font-bold ${inv.status === "paid" ? "text-success" : "text-warning"}`}>{Number(inv.amount).toFixed(0)} €</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
