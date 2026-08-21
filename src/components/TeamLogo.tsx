import Image from "next/image";

export function TeamLogo({
  logoUrl,
  abbrev,
  size = 32,
}: {
  logoUrl: string | null;
  abbrev: string;
  size?: number;
}) {
  if (!logoUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-divider text-[10px] font-bold uppercase text-muted"
        aria-hidden="true"
      >
        {abbrev.slice(0, 2)}
      </div>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full bg-divider object-cover"
      unoptimized
    />
  );
}
