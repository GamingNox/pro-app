"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import AdminBetaRealtime from "@/components/AdminBetaRealtime";
import RouteTransition from "@/components/RouteTransition";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      // ── Primary gate: localStorage flag ──
      // The admin-login page sets this on successful credential check.
      // If it's not set, the user has not logged in — redirect.
      const localAuth = localStorage.getItem("admin-auth");
      if (localAuth !== "true") {
        router.replace("/admin-login");
        return;
      }

      // ── Secondary verification via Supabase (optional upgrade) ──
      // If the user ALSO has a Supabase session with is_admin = true,
      // full admin capabilities (cross-user RLS reads) are enabled.
      // If not, they still get in with localStorage-only access — the
      // legacy path — but cross-user queries may fail.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();
          if (profile?.is_admin === false) {
            // Authenticated as a non-admin user — refuse
            localStorage.removeItem("admin-auth");
            router.replace("/admin-login");
            return;
          }
        }
        // Either: user is a Supabase admin, or there's no Supabase session.
        // In both cases the localStorage flag is enough for the layout.
      } catch {
        // Network or DB error — trust localStorage flag (offline tolerance)
      }

      setAuthorized(true);
      setChecking(false);
    }

    checkAdmin();
  }, [router]);

  if (checking || !authorized) {
    return <div className="h-full h-[100dvh] bg-background" />;
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto relative bg-background">
      <AdminBetaRealtime />
      <main className="flex-1 flex flex-col overflow-hidden pb-[82px] bg-background">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <AdminNav />
    </div>
  );
}
