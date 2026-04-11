"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, CreditCard, Home, Tag, User } from "lucide-react";
import { spring } from "@/lib/motion";

const tabs = [
  { href: "/reservations", label: "RÉSERVATIONS", icon: CalendarDays },
  { href: "/loyalty", label: "FIDÉLITÉ", icon: CreditCard },
  { href: "/client-home", label: "ACCUEIL", icon: Home, center: true },
  { href: "/offers", label: "OFFRES", icon: Tag },
  { href: "/account", label: "PROFIL", icon: User },
];

export default function ClientNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav shadow-nav">
      <div className="max-w-md mx-auto flex items-end justify-evenly h-[82px] pb-safe px-4">
        {tabs.map((tab) => {
          const isActive = tab.href === "/client-home" ? pathname === "/client-home" : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <Link key={tab.href} href={tab.href} className="relative flex items-center justify-center -mt-4 w-16 pb-2.5">
                <motion.div whileTap={{ scale: 0.88 }} transition={spring.snappy}
                  className={`w-[54px] h-[54px] rounded-[18px] flex items-center justify-center transition-all duration-300 ${isActive ? "bg-accent-gradient fab-shadow" : "bg-border-light shadow-apple"}`}>
                  <Icon size={22} strokeWidth={1.8} className={isActive ? "text-white" : "text-muted"} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center justify-end gap-1 w-14 relative pb-2.5 pt-2.5">
              <motion.div whileTap={{ scale: 0.85 }} transition={spring.snappy}>
                <Icon size={21} strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-colors duration-200 ${isActive ? "text-accent" : "text-muted"}`} />
              </motion.div>
              <span className={`text-[7px] leading-none tracking-wider transition-all duration-200 ${
                isActive ? "text-accent font-bold" : "text-muted font-medium"
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div layoutId="client-nav-indicator"
                  className="absolute top-0 w-5 h-[2.5px] rounded-full bg-accent"
                  transition={spring.gentle} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
