"use client";

import { Lock } from "lucide-react";
import { useAppConfig } from "@/lib/app-config";
import { useApp } from "@/lib/store";
import { type ReactNode } from "react";

/**
 * When site_closed is set by an admin, non-admin users see a full-screen
 * "Site temporairement fermé" message and cannot access the app.
 * Admins always get through so they can flip the toggle back off.
 */
export default function SiteClosedGate({ children }: { children: ReactNode }) {
  const config = useAppConfig();
  const { user } = useApp();
  const isAdmin =
    typeof window !== "undefined" && localStorage.getItem("admin-auth") === "true"
      ? true
      : false;

  if (!config.site_closed || isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col items-center justify-center bg-background px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)",
          boxShadow: "0 12px 28px rgba(91,79,233,0.2)",
        }}
      >
        <Lock size={26} style={{ color: "#5B4FE9" }} strokeWidth={2.2} />
      </div>
      <h1 className="text-[22px] font-bold text-foreground tracking-tight text-center">
        Site temporairement fermé
      </h1>
      <p className="text-[14px] text-muted mt-3 text-center max-w-[320px] leading-relaxed">
        {config.site_closed_message}
      </p>
      <p className="text-[11px] text-subtle mt-6">
        — {user.business || "Clientbase"} —
      </p>
    </div>
  );
}
