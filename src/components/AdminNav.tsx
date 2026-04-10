"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Users, CreditCard, LayoutGrid, BarChart3, Settings } from "lucide-react";

const tabs = [
  { href: "/admin-users", label: "UTILISATEURS", icon: Users },
  { href: "/admin-plans", label: "ABONNEMENTS", icon: CreditCard },
  { href: "/admin-dashboard", label: "ACCUEIL", icon: LayoutGrid, center: true },
  { href: "/admin-analytics", label: "ANALYTICS", icon: BarChart3 },
  { href: "/admin-settings", label: "REGLAGES", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav shadow-nav">
      <div className="max-w-md mx-auto flex items-end justify-evenly h-[82px] pb-safe px-4">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <Link key={tab.href} href={tab.href} className="relative flex items-center justify-center -mt-4 w-16 pb-2.5">
                <motion.div whileTap={{ scale: 0.88 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className={`w-[54px] h-[54px] rounded-[18px] flex items-center justify-center transition-all duration-300 ${isActive ? "bg-accent-gradient fab-shadow" : "bg-border-light shadow-apple"}`}>
                  <Icon size={22} strokeWidth={1.8} className={isActive ? "text-white" : "text-muted"} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center justify-end gap-1 w-14 relative pb-2.5 pt-2.5">
              <motion.div whileTap={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                <Icon size={21} strokeWidth={isActive ? 2 : 1.5} className={`transition-colors duration-300 ${isActive ? "text-accent" : "text-muted"}`} />
              </motion.div>
              <span className={`text-[8px] leading-none tracking-wider ${isActive ? "text-accent font-bold" : "text-muted font-medium"}`}>
                {tab.label}
              </span>
              {isActive && <motion.div layoutId="admin-nav" className="absolute top-0 w-5 h-[2.5px] rounded-full bg-accent" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}