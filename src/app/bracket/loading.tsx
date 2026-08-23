import { RouteLoadingSkeleton } from "@/components/RouteLoadingSkeleton";

export default function Loading() {
  return <RouteLoadingSkeleton titleWidth="w-48" maxWidth="max-w-2xl" count={6} />;
}
