import type { ReactNode } from "react";

export function DataOrError({
  hasData,
  lastError,
  children,
}: {
  hasData: boolean;
  lastError: string | null;
  children: ReactNode;
}) {
  if (hasData) {
    return <>{children}</>;
  }

  if (lastError) {
    return (
      <p className="text-lg text-error" role="alert">
        {lastError}
      </p>
    );
  }

  return (
    <p className="text-lg text-muted">
      No data yet — hang tight while the first refresh pulls scores in.
    </p>
  );
}
