export function formatRecord(wins: number, losses: number, ties: number): string {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export function formatWinPct(winPct: number): string {
  const formatted = winPct.toFixed(3);
  return formatted.startsWith("0.") ? formatted.slice(1) : formatted;
}

export function formatPoints(points: number, fractionDigits = 1): string {
  return points.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
