"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Briefcase,
  LayoutGrid,
  Users,
  User,
} from "lucide-react";

// EXACT ORDER: RDV | Gestion | Accueil (center) | Clients | Profil
const tabs = [
  { href: "/appointments", label: "RDV", icon: CalendarDays, center: false },
  { href: "/gestion", label: "Gestion", icon: Briefcase, center: false },
  { href: "/", label: "Accueil", icon: LayoutGrid, center: true },
  { href: "/clients", label: "Clients", icon: Users, center: false },
  { href: "/profile", label: "Profil", icon: User, center: false },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-nav pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[58px]">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex items-center justify-center -mt-5 flex-1"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-[52px] h-[52px] rounded-[18px] flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-accent fab-shadow"
                      : "bg-foreground shadow-apple-lg"
                  }`}
                >
                  <Icon size={22} strokeWidth={1.8} className="text-white" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-[3px] flex-1 h-full relative"
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className={`transition-colors duration-200 ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              />
              <span
                className={`text-[10px] leading-none transition-colors duration-200 ${
                  isActive ? "text-accent font-semibold" : "text-muted font-medium"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-5 h-[2.5px] rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
