"use client";

import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { hasOnboarded, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hasOnboarded) {
      router.replace("/onboarding");
    } else if (user.accountType === "client") {
      router.replace("/client-home");
    }
  }, [hasOnboarded, user.accountType, router]);

  // Only block render for clear redirect cases
  if (!hasOnboarded) return <div className="h-full h-[100dvh] bg-background" />;
  if (user.accountType === "client") return <div className="h-full h-[100dvh] bg-background" />;

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto relative bg-background">
      <main className="flex-1 flex flex-col overflow-hidden pb-[82px] bg-background">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
