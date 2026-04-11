"use client";

import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Package, AlertTriangle, Search, Zap } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SettingsRow } from "@/components/SettingsPage";

export default function SettingsStockPage() {
  const { products, getLowStockProducts } = useApp();
  const lowStock = getLowStockProducts();

  return (
    <SettingsPage
      category="Gestion de l'atelier"
      title="Stock & Inventaire"
      description="Gérez votre inventaire, configurez les alertes et optimisez vos approvisionnements."
    >
      {/* Auto restock */}
      <SettingsSection title="Réapprovisionnement Automatique" description="Générez des bons de commande automatiquement.">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-border-light rounded-xl p-3 text-center">
            <p className="text-[9px] text-muted font-bold uppercase">Fréquence d&apos;analyse</p>
            <p className="text-[14px] font-bold text-foreground mt-1">Toutes les 24h</p>
          </div>
          <div className="bg-border-light rounded-xl p-3 text-center">
            <p className="text-[9px] text-muted font-bold uppercase">Fournisseurs</p>
            <p className="text-[14px] font-bold text-foreground mt-1">{products.length > 0 ? "12 Partenaires" : "—"}</p>
          </div>
        </div>
      </SettingsSection>

      {/* AI optimization */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <div className="flex items-start gap-3">
          <Zap size={20} className="text-white/80 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[15px] font-bold">Optimisation IA</p>
            <p className="text-[12px] text-white/70 mt-1 leading-relaxed">Prédiction intelligente des besoins basée sur vos cycles saisonniers.</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          className="mt-4 bg-white text-accent py-2.5 rounded-xl text-[13px] font-bold w-full">
          Activer le module
        </motion.button>
      </div>

      {/* Alerts */}
      <SettingsSection title="Alertes">
        <SettingsRow label="Alerte stock bas" hint="Notification quand un produit passe sous le seuil.">
          <SettingsToggle on={true} onToggle={() => {}} />
        </SettingsRow>
        <SettingsRow label="Produits en alerte" last>
          <span className={`text-[14px] font-bold ${lowStock.length > 0 ? "text-danger" : "text-success"}`}>{lowStock.length}</span>
        </SettingsRow>
      </SettingsSection>

      {/* Catalog */}
      <SettingsSection title="Catalogue">
        {products.length === 0 ? (
          <div className="text-center py-6">
            <Package size={28} className="text-muted mx-auto mb-2" />
            <p className="text-[13px] text-muted">Aucun produit en stock.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-[20px]">{p.emoji}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[14px] font-bold ${p.quantity <= p.minQuantity ? "text-danger" : "text-foreground"}`}>{p.quantity}</p>
                  <p className="text-[9px] text-muted">unités</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </SettingsPage>
  );
}
