"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-4 py-6 text-center font-sans">
      <p className="text-lg text-error" role="alert">
        Something went wrong loading this page. Try again, or check back in
        a few minutes.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded bg-accent px-3 py-1 text-sm font-semibold tracking-tight text-accent-foreground transition-colors hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
