"use client";

import { useEffect } from "react";

export default function ThemeLoader() {
  useEffect(() => {
    const saved = localStorage.getItem("accent-color");
    if (saved) {
      document.documentElement.style.setProperty("--color-accent", saved);
    }
  }, []);

  return null;
}
