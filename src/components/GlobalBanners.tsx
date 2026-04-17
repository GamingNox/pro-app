"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Wrench, Info, WifiOff, X } from "lucide-react";
import { useAppConfig } from "@/lib/app-config";

/**
 * Top-of-app stack of banners:
 *   1. Offline (network disconnected)
 *   2. Maintenance (admin flag)
 *   3. Announcement (admin-provided text)
 * Each dismissible per-session, except Maintenance which stays.
 */
export default function GlobalBanners() {
  const config = useAppConfig();
  const [online, setOnline] = useState(true);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Reset dismissal if the announcement text itself changes (new message)
  useEffect(() => {
    setAnnouncementDismissed(false);
  }, [config.announcement]);

  const banners = [];

  if (!online) {
    banners.push(
      <Banner
        key="offline"
        icon={WifiOff}
        text="Vous êtes hors ligne. Certaines actions peuvent ne pas fonctionner."
        bg="linear-gradient(135deg, #52525B, #3F3F46)"
      />
    );
  }

  if (config.maintenance_mode) {
    banners.push(
      <Banner
        key="maintenance"
        icon={Wrench}
        text={config.maintenance_message}
        bg="linear-gradient(135deg, #F59E0B, #D97706)"
      />
    );
  }

  if (config.announcement && !announcementDismissed) {
    const bg =
      config.announcement_type === "critical" ? "linear-gradient(135deg, #EF4444, #B91C1C)"
      : config.announcement_type === "warning" ? "linear-gradient(135deg, #F59E0B, #D97706)"
      : "linear-gradient(135deg, #5B4FE9, #3B30B5)";

    const Icon = config.announcement_type === "critical" ? AlertTriangle
      : config.announcement_type === "warning" ? AlertTriangle
      : Info;

    banners.push(
      <Banner
        key="announcement"
        icon={Icon}
        text={config.announcement}
        bg={bg}
        onDismiss={() => setAnnouncementDismissed(true)}
      />
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="flex-shrink-0 flex flex-col gap-0.5">
      <AnimatePresence mode="popLayout">{banners}</AnimatePresence>
    </div>
  );
}

function Banner({
  icon: Icon,
  text,
  bg,
  onDismiss,
}: {
  icon: typeof WifiOff;
  text: string;
  bg: string;
  onDismiss?: () => void;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden text-white"
      style={{ background: bg }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <Icon size={14} strokeWidth={2.4} className="flex-shrink-0" />
        <p className="flex-1 text-[12px] font-semibold leading-tight">{text}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors flex-shrink-0"
          >
            <X size={12} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
