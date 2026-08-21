import { FreshnessIndicator } from "@/components/FreshnessIndicator";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background font-sans">
      <main className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          All-Play Standings
        </h1>
        <p className="text-lg text-muted">Coming soon.</p>
      </main>
      <FreshnessIndicator />
    </div>
  );
}
