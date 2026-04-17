"use client";

/**
 * Reusable skeleton placeholders. Uses the `.skeleton` shimmer class
 * from globals.css.
 */

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-card-premium ${className}`}>
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <div className="skeleton h-3 w-2/3 rounded mb-2" />
          <div className="skeleton h-2.5 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonKPI({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-card-premium ${className}`}>
      <div className="skeleton h-2 w-16 rounded mb-3" />
      <div className="skeleton h-6 w-12 rounded mb-1" />
      <div className="skeleton h-2 w-20 rounded" />
    </div>
  );
}

export function SkeletonKPIRow({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-2.5 ${className}`} style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonKPI key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-card-premium ${className}`}>
      <div className="skeleton h-3 w-32 rounded mb-5" />
      <div className="flex items-end gap-1.5 h-[100px]">
        {[40, 60, 35, 80, 55, 90].map((h, i) => (
          <div key={i} className="skeleton flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton flex-1 h-2 rounded" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center pt-2 pb-5 ${className}`}>
      <div className="skeleton w-[110px] h-[110px] rounded-full mb-4" />
      <div className="skeleton h-5 w-40 rounded mb-2" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}
