"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, Briefcase, Home, Users, User } from "lucide-react";
import { spring, tap } from "@/lib/motion";

const tabs = [
  { href: "/appointments", label: "RDV", icon: CalendarDays, center: false },
  { href: "/clients", label: "CLIENTS", icon: Users, center: false },
  { href: "/", label: "ACCUEIL", icon: Home, center: true },
  { href: "/gestion", label: "GESTION", icon: Briefcase, center: false },
  { href: "/profile", label: "PROFIL", icon: User, center: false },
];

export default memo(function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav shadow-nav">
      <div className="max-w-md mx-auto flex items-end justify-evenly h-[82px] pb-safe px-4">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <Link key={tab.href} href={tab.href} className="relative flex items-center justify-center -mt-4 w-16 pb-2.5">
                <motion.div whileTap={{ scale: 0.93 }} transition={spring.snappy}
                  className={`w-[54px] h-[54px] rounded-[18px] flex items-center justify-center transition-all duration-150 ${
                    isActive ? "bg-accent-gradient fab-shadow" : "bg-border-light shadow-apple"
                  }`}>
                  <Icon size={22} strokeWidth={1.8} className={isActive ? "text-white" : "text-muted"} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center justify-center gap-1 w-14 relative pb-3 pt-1">
              <motion.div whileTap={tap.icon} transition={spring.snappy}>
                <Icon size={21} strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-colors duration-150 ${isActive ? "text-accent" : "text-muted"}`} />
              </motion.div>
              <span className={`text-[8px] leading-none tracking-wider transition-all duration-150 ${
                isActive ? "text-accent font-bold" : "text-muted font-medium"
              }`}>
                {tab.label}
              </span>
              {isActive && !tab.center && (
                <motion.div layoutId="nav-indicator"
                  className="absolute top-0 w-5 h-[2.5px] rounded-full bg-accent"
                  transition={spring.gentle} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
