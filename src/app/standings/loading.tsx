import { RouteLoadingSkeleton } from "@/components/RouteLoadingSkeleton";

export default function Loading() {
  return <RouteLoadingSkeleton titleWidth="w-56" maxWidth="max-w-3xl" count={8} />;
}
