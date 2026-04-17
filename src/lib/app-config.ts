"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface AppConfig {
  maintenance_mode: boolean;
  maintenance_message: string;
  site_closed: boolean;
  site_closed_message: string;
  announcement: string | null;
  announcement_type: "info" | "warning" | "critical";
  app_version: string;
}

const DEFAULT_CONFIG: AppConfig = {
  maintenance_mode: false,
  maintenance_message: "Maintenance en cours, merci de patienter.",
  site_closed: false,
  site_closed_message: "Le site est temporairement fermé. Nous revenons très vite.",
  announcement: null,
  announcement_type: "info",
  app_version: "1.0.0",
};

/**
 * Reads the app_config singleton. Polls every 60s so toggled flags
 * reach clients without a refresh. Also subscribes to Postgres
 * changes for near-instant propagation when an admin flips a toggle.
 */
export function useAppConfig(): AppConfig {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.from("app_config").select("*").eq("id", 1).single();
      if (cancelled) return;
      if (error || !data) return;
      setConfig({
        maintenance_mode: !!data.maintenance_mode,
        maintenance_message: data.maintenance_message || DEFAULT_CONFIG.maintenance_message,
        site_closed: !!data.site_closed,
        site_closed_message: data.site_closed_message || DEFAULT_CONFIG.site_closed_message,
        announcement: data.announcement ?? null,
        announcement_type: (data.announcement_type as AppConfig["announcement_type"]) || "info",
        app_version: data.app_version || DEFAULT_CONFIG.app_version,
      });
    }

    load();
    const poll = setInterval(load, 60_000);

    // Real-time updates via Supabase channel
    const channel = supabase
      .channel("app-config")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_config" }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);

  return config;
}
