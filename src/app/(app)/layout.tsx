"use client";

import { useApp } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import RouteTransition from "@/components/RouteTransition";
import DemoBanner from "@/components/DemoBanner";
import BetaStatusToast from "@/components/BetaStatusToast";
import MilestoneTracker from "@/components/MilestoneTracker";
import WeeklyRecap from "@/components/WeeklyRecap";
import SaveToast from "@/components/SaveToast";
import UndoToast from "@/components/UndoToast";
import NotifPrompt from "@/components/NotifPrompt";
import GlobalBanners from "@/components/GlobalBanners";
import SiteClosedGate from "@/components/SiteClosedGate";
import VersionToast from "@/components/VersionToast";
import FloatingSupportButton from "@/components/FloatingSupportButton";

const TAB_ORDER = ["/appointments", "/clients", "/", "/gestion", "/profile"];

// Routes under (app) that clients are ALLOWED to access.
// Chat threads are shared between pro and client so both parties can
// message each other on a booking. We match prefixes so "/chat/<id>"
// is allowed but "/chat" (the pro inbox) is still pro-only.
function isClientAllowed(pathname: string): boolean {
  if (pathname.startsWith("/chat/")) return true;
  return false;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { hasOnboarded, isHydrated, user } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const allowClient = isClientAllowed(pathname);

  useEffect(() => {
    // Wait for store hydration (Supabase session check) before deciding to redirect.
    // Without this guard, on a fresh reload the initial hasOnboarded=false would
    // race the auth check and kick the user back to /onboarding.
    if (!isHydrated) return;
    if (!hasOnboarded) {
      router.replace("/onboarding");
    } else if (user.accountType === "client" && !allowClient) {
      router.replace("/client-home");
    }
  }, [isHydrated, hasOnboarded, user.accountType, allowClient, router]);

  // Swipe between bottom-nav tabs (only on top-level tab routes)
  const handlePanEnd = useCallback((_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    // Only trigger on strong horizontal swipes (not vertical scroll)
    if (Math.abs(offset.x) < 50 || Math.abs(offset.y) > Math.abs(offset.x)) return;
    if (Math.abs(velocity.x) < 100) return;

    const currentIdx = TAB_ORDER.indexOf(pathname);
    if (currentIdx === -1) return; // not on a tab route, ignore

    const direction = offset.x < 0 ? 1 : -1; // swipe left = next, right = prev
    const nextIdx = currentIdx + direction;
    if (nextIdx < 0 || nextIdx >= TAB_ORDER.length) return;

    router.push(TAB_ORDER[nextIdx]);
  }, [pathname, router]);

  // While hydrating (checking Supabase session), show nothing — the splash is still visible.
  // After hydration, if not onboarded, useEffect will redirect; show blank during redirect.
  if (!isHydrated) return <div className="h-full h-[100dvh] bg-background" />;
  if (!hasOnboarded) return <div className="h-full h-[100dvh] bg-background" />;
  if (user.accountType === "client" && !allowClient) return <div className="h-full h-[100dvh] bg-background" />;

  // Enable swipe only on top-level tab routes
  const isTabRoute = TAB_ORDER.includes(pathname);

  return (
    <SiteClosedGate>
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto relative bg-background">
      <GlobalBanners />
      <DemoBanner />
      <BetaStatusToast />
      <MilestoneTracker />
      <WeeklyRecap />
      <SaveToast />
      <UndoToast />
      <NotifPrompt />
      <VersionToast />
      {isTabRoute ? (
        <motion.main
          onPanEnd={handlePanEnd}
          className="flex-1 flex flex-col overflow-hidden pb-[82px] bg-background touch-pan-y"
        >
          <RouteTransition>{children}</RouteTransition>
        </motion.main>
      ) : (
        <main className="flex-1 flex flex-col overflow-hidden pb-[82px] bg-background">
          <RouteTransition>{children}</RouteTransition>
        </main>
      )}
      {user.accountType !== "client" && <BottomNav />}
      {user.accountType !== "client" && !pathname.startsWith("/chat") && <FloatingSupportButton />}
    </div>
    </SiteClosedGate>
  );
}
