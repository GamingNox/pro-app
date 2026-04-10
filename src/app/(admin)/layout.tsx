"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("admin-auth");
    if (auth === "true") {
      setAuthorized(true);
    } else {
      router.replace("/admin-login");
    }
  }, [router]);

  if (!authorized) return <div className="h-full h-[100dvh] bg-background" />;

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto relative bg-background">
      <main className="flex-1 flex flex-col overflow-hidden pb-[82px] bg-background">
        {children}
      </main>
      <AdminNav />
    </div>
  );
}
