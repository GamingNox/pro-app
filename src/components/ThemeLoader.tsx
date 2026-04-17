"use client";

import { useEffect } from "react";

export default function ThemeLoader() {
  useEffect(() => {
    // Legacy cleanup — the accent color customization setting was removed.
    // Any previously saved override is cleared so the app returns to canonical violet.
    if (localStorage.getItem("accent-color")) {
      localStorage.removeItem("accent-color");
      document.documentElement.style.removeProperty("--color-accent");
    }
  }, []);

  return null;
}
