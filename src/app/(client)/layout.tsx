"use client";

import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ClientNav from "@/components/ClientNav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { hasOnboarded, user } = useApp();
  const router = useRouter();

  const isClient = user.accountType === "client";

  useEffect(() => {
    if (!hasOnboarded) {
      router.replace("/onboarding");
    } else if (!isClient) {
      // Non-client accounts (pro or unset) should use the pro layout
      router.replace("/");
    }
  }, [hasOnboarded, isClient, router]);

  if (!hasOnboarded || !isClient) {
    return <div className="h-full h-[100dvh] bg-background" />;
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto relative bg-background">
      <main className="flex-1 flex flex-col overflow-hidden pb-[82px] bg-background">
        {children}
      </main>
      <ClientNav />
    </div>
  );
}
