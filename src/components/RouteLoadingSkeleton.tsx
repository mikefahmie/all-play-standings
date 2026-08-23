import { SkeletonCard } from "@/components/SkeletonCard";

export function RouteLoadingSkeleton({
  titleWidth,
  maxWidth,
  count,
}: {
  titleWidth: string;
  maxWidth: string;
  count: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-4 py-6 font-sans sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className={`h-8 animate-pulse rounded bg-divider ${titleWidth}`} />
        <div className="h-10 w-56 animate-pulse rounded bg-divider" />
      </div>

      <div className={`mx-auto flex w-full flex-col gap-2 ${maxWidth}`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
