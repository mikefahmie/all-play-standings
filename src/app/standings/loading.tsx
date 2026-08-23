import { SkeletonCard } from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-4 py-6 font-sans sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-8 w-56 animate-pulse rounded bg-divider" />
        <div className="h-10 w-56 animate-pulse rounded bg-divider" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
