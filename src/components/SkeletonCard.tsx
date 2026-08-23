export function SkeletonCard() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded border border-divider bg-[image:var(--gradient-surface)] px-4 py-3">
      <div className="h-9 w-9 shrink-0 rounded-full bg-divider" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/5 rounded bg-divider" />
        <div className="h-3 w-1/5 rounded bg-divider" />
      </div>
      <div className="h-8 w-16 shrink-0 rounded bg-divider" />
    </div>
  );
}
