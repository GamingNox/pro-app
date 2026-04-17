"use client";

import type { ReactNode, CSSProperties } from "react";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

/**
 * Wraps a page or section with a category color scope.
 * Overrides --color-accent / --color-accent-soft / --color-accent-deep
 * for the entire subtree, giving full visual immersion inside a category.
 *
 * All children using bg-accent / text-accent / var(--color-accent) will
 * automatically inherit the category color — no per-component changes needed.
 */
export default function CategoryTheme({
  category,
  children,
  className = "",
}: {
  category: CategoryKey;
  children: ReactNode;
  className?: string;
}) {
  const cat = CATEGORIES[category];
  const scopeStyle: CSSProperties = {
    ["--color-accent" as string]: cat.color,
    ["--color-accent-soft" as string]: cat.soft,
    ["--color-accent-deep" as string]: cat.deep,
  };
  return (
    <div className={className || "flex-1 flex flex-col overflow-hidden"} style={scopeStyle}>
      {children}
    </div>
  );
}
