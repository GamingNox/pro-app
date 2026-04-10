"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import { Search, SlidersHorizontal, UserPlus, ChevronRight } from "lucide-react";

export default function AdminUsersPage() {
  const { clients, appointments, invoices } = useApp();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(q));
  }, [clients, search]);

  const activeCount = clients.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[24px] font-bold text-foreground tracking-tight">Utilisateurs</h1>
        <p className="text-[12px] text-muted mt-0.5">Gérez et consultez vos clients.</p>
        <div className="mt-3 bg-white rounded-2xl px-4 py-3 shadow-card-premium flex items-center gap-3">
          <Search size={16} className="text-subtle" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, email..."
            className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-subtle" />
          <SlidersHorizontal size={16} className="text-muted" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mt-4">
              <UserPlus size={28} className="text-muted mx-auto mb-3" />
              <p className="text-[15px] font-bold text-foreground">{search ? "Aucun résultat" : "Aucun utilisateur"}</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {filtered.map((client, i) => {
                const apptCount = appointments.filter((a) => a.clientId === client.id).length;
                const revenue = invoices.filter((inv) => inv.clientId === client.id && inv.status === "paid").reduce((s, inv) => s + inv.amount, 0);
                return (
                  <motion.div key={client.id} initial={{ y: 4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-2xl p-4 shadow-card-premium">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: client.avatar }}>
                        {getInitials(client.firstName, client.lastName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-bold text-foreground">{client.firstName} {client.lastName}</p>
                          <div className="w-2 h-2 rounded-full bg-success" />
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">{client.email || client.phone || "Pas de contact"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md">{apptCount} RDV</span>
                      {revenue > 0 && <span className="font-bold text-success">{revenue} € payé</span>}
                      <span className="text-muted ml-auto">Depuis le {new Date(client.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Stats footer */}
          <div className="flex items-center justify-between mt-5 mb-3">
            <div className="text-center"><p className="text-[9px] text-muted font-bold uppercase">Total</p><p className="text-[16px] font-bold text-foreground">{clients.length}</p></div>
            <div className="text-center"><p className="text-[9px] text-muted font-bold uppercase">Actifs</p><p className="text-[16px] font-bold text-success">{activeCount}</p></div>
            <div className="text-center"><p className="text-[9px] text-muted font-bold uppercase">RDV total</p><p className="text-[16px] font-bold text-accent">{appointments.length}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
