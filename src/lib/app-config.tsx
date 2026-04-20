"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

const AppConfigContext = createContext<AppConfig>(DEFAULT_CONFIG);

/**
 * Provider — mount once in the app layout. Creates a SINGLE realtime
 * subscription + 60s polling loop. All consumers read via useAppConfig()
 * from this context. This replaces the previous per-component hook that
 * opened one channel per consumer (3 simultaneous channels with the same
 * name caused intermittent page-load failures).
 */
export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("app_config")
          .select("*")
          .eq("id", 1)
          .single();
        if (cancelled) return;
        if (error || !data) return;
        setConfig({
          maintenance_mode: !!data.maintenance_mode,
          maintenance_message: data.maintenance_message || DEFAULT_CONFIG.maintenance_message,
          site_closed: !!data.site_closed,
          site_closed_message: data.site_closed_message || DEFAULT_CONFIG.site_closed_message,
          announcement: data.announcement ?? null,
          announcement_type:
            (data.announcement_type as AppConfig["announcement_type"]) || "info",
          app_version: data.app_version || DEFAULT_CONFIG.app_version,
        });
      } catch {
        // migration not applied yet, or transient network error — keep defaults
      }
    }

    load();
    const poll = setInterval(load, 60_000);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("app-config-singleton")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "app_config" },
          () => load()
        )
        .subscribe();
    } catch {
      // realtime not available — polling alone is enough
    }

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (channel) {
        try { supabase.removeChannel(channel); } catch { /* ignore */ }
      }
    };
  }, []);

  return <AppConfigContext.Provider value={config}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig(): AppConfig {
  return useContext(AppConfigContext);
}
