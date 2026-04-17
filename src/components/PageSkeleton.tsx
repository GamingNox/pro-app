"use client";

/**
 * Generic page loading skeleton. Shows a header placeholder +
 * several card placeholders with the shimmer animation from globals.css.
 * Use as a fallback while data loads on pages like Gestion, Clients, etc.
 */
export default function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-4">
        {/* Title skeleton */}
        <div className="skeleton h-7 w-40 rounded-lg mb-2" />
        <div className="skeleton h-3 w-56 rounded-md" />
      </div>
      <div className="flex-1 px-6 pb-32 space-y-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="skeleton rounded-2xl"
            style={{
              height: i === 0 ? 120 : 72,
              opacity: 1 - i * 0.12,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
