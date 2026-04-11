"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { FileText, Download, BarChart3 } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function SettingsAccountingPage() {
  const { invoices } = useApp();
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">("pdf");

  const paidTotal = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0);
  const pendingCount = invoices.filter((i) => i.status === "pending").length;

  function handleDownload() {
    // Generate a simple export based on format
    const paid = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__");
    if (exportFormat === "csv") {
      const header = "Date,Description,Montant,Statut\n";
      const rows = paid.map((i) => `${i.date},${i.description},${i.amount},${i.status}`).join("\n");
      const blob = new Blob([header + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `export-${new Date().toISOString().split("T")[0]}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      // For PDF/Excel — generate a text summary as fallback
      const content = `Rapport Lumière Pro\n${"=".repeat(40)}\nDate: ${new Date().toLocaleDateString("fr-FR")}\n\nRevenu total: ${paidTotal.toFixed(2)}€\nFactures payées: ${paid.length}\nFactures en attente: ${pendingCount}\n\n${"─".repeat(40)}\n` +
        paid.map((i) => `${i.date} | ${i.description} | ${i.amount}€`).join("\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const ext = exportFormat === "pdf" ? "txt" : "txt"; // Real PDF would need a library
      const a = document.createElement("a"); a.href = url; a.download = `export-${new Date().toISOString().split("T")[0]}.${ext}`; a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <SettingsPage category="Export de rapports" title="Centre de Gestion Comptable."
      description="Exportez vos données financières. Sélectionnez un format et téléchargez vos rapports.">

      {/* Reports */}
      <SettingsSection title="Rapports disponibles" description="Générés automatiquement à partir de vos données.">
        <div className="space-y-4">
          {[
            { icon: BarChart3, title: "Revenus mensuels", desc: `Synthèse des revenus pour ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}.` },
            { icon: FileText, title: "Estimations fiscales", desc: "Charges sociales et fiscales trimestrielles." },
            { icon: Download, title: "Rapport de dépenses", desc: "Frais de fonctionnement et justificatifs." },
          ].map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="border-b border-border-light pb-4 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-border-light flex items-center justify-center mb-2"><Icon size={18} className="text-accent" /></div>
                <p className="text-[15px] font-bold text-foreground">{r.title}</p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Export format — selectable */}
      <SettingsSection title="Format d'export">
        <div className="space-y-2 mb-4">
          {([
            { id: "pdf" as const, label: "PDF", sub: "Standard archivage" },
            { id: "excel" as const, label: "EXCEL", sub: "Analyse avancée" },
            { id: "csv" as const, label: "CSV", sub: "Import comptable" },
          ]).map((f) => (
            <motion.button key={f.id} whileTap={{ scale: 0.98 }} onClick={() => setExportFormat(f.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${exportFormat === f.id ? "bg-accent-soft ring-1 ring-accent/20" : "bg-border-light"}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${exportFormat === f.id ? "border-accent" : "border-border"}`}>
                {exportFormat === f.id && <div className="w-2 h-2 rounded-full bg-accent" />}
              </div>
              <div>
                <p className={`text-[13px] font-bold ${exportFormat === f.id ? "text-accent" : "text-foreground"}`}>{f.label}</p>
                <p className="text-[10px] text-muted">{f.sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleDownload}
          className="w-full bg-accent text-white py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 fab-shadow">
          <Download size={15} /> Télécharger ({exportFormat.toUpperCase()})
        </motion.button>
      </SettingsSection>

      {/* Annual stat */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Statut annuel</p>
        <p className="text-[28px] font-bold mt-1">{paidTotal > 0 ? `${paidTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}€` : "0,00€"}</p>
        <p className="text-[11px] text-white/60 mt-0.5">Revenu imposable estimé</p>
        <div className="flex gap-6 mt-3 pt-3 border-t border-white/10">
          <div><p className="text-[10px] text-white/50 uppercase">Factures payées</p><p className="text-[12px] font-bold mt-0.5">{invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").length}</p></div>
          <div><p className="text-[10px] text-white/50 uppercase">En attente</p><p className="text-[12px] font-bold mt-0.5">{pendingCount}</p></div>
        </div>
      </div>
    </SettingsPage>
  );
}
