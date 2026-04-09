"use client";

import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { hasOnboarded } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hasOnboarded) {
      router.replace("/onboarding");
    }
  }, [hasOnboarded, router]);

  if (!hasOnboarded) return null;

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto relative">
      <main className="flex-1 flex flex-col overflow-hidden pb-[58px]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
