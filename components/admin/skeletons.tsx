export function SkeletonLine({ w = "w-32" }: { w?: string }) {
  return <div className={`h-3 ${w} animate-pulse rounded bg-slate-200`} />;
}

export function SkeletonBlock({ className = "h-16" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} />;
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-3 py-3">
      <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
      <div className="flex flex-1 flex-col gap-1.5">
        <SkeletonLine w="w-32" />
        <SkeletonLine w="w-48" />
      </div>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-16 animate-pulse rounded bg-slate-100"
        />
      ))}
    </div>
  );
}
