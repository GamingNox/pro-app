"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 bg-background">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)" }}>
        <AlertTriangle size={28} className="text-danger" strokeWidth={2} />
      </div>
      <h1 className="text-[20px] font-bold text-foreground tracking-tight text-center mb-2">
        Quelque chose s&apos;est mal passé
      </h1>
      <p className="text-[13px] text-muted text-center leading-relaxed max-w-[280px] mb-6">
        Une erreur inattendue est survenue. Essayez de recharger la page.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold text-white"
        style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 8px 20px rgba(91,79,233,0.3)" }}
      >
        <RefreshCw size={15} strokeWidth={2.5} /> Réessayer
      </button>
    </div>
  );
}
