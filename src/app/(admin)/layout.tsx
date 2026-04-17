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
      try {
        // Must have a real Supabase session AND is_admin = true.
        // localStorage flag alone is no longer sufficient — it was
        // trivially bypassable by setting admin-auth = true by hand.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          localStorage.removeItem("admin-auth");
          router.replace("/admin-login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();

        if (error || !profile?.is_admin) {
          localStorage.removeItem("admin-auth");
          router.replace("/admin-login");
          return;
        }

        // Keep the flag so other parts of the app (e.g., admin nav visibility
        // on the public side) can short-circuit without a DB roundtrip.
        localStorage.setItem("admin-auth", "true");
        setAuthorized(true);
        setChecking(false);
      } catch {
        localStorage.removeItem("admin-auth");
        router.replace("/admin-login");
      }
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
