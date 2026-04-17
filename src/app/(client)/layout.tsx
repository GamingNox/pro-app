"use client";

import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ClientNav from "@/components/ClientNav";
import RouteTransition from "@/components/RouteTransition";
import DemoBanner from "@/components/DemoBanner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { hasOnboarded, isHydrated, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return; // wait for Supabase session check before redirecting
    if (!hasOnboarded) {
      router.replace("/onboarding");
    } else if (user.accountType !== "client") {
      // Only redirect if accountType is explicitly set to something else
      router.replace("/");
    }
  }, [isHydrated, hasOnboarded, user.accountType, router]);

  if (!isHydrated) return <div className="h-full h-[100dvh] bg-background" />;
  if (!hasOnboarded) return <div className="h-full h-[100dvh] bg-background" />;
  if (user.accountType !== "client") return <div className="h-full h-[100dvh] bg-background" />;

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto relative bg-background">
      <DemoBanner />
      <main className="flex-1 flex flex-col overflow-hidden pb-[82px] bg-background">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <ClientNav />
    </div>
  );
}
