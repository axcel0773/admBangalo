import { cn } from "@/lib/cn";

export interface LandscapePalette {
  sky: string;
  hills: string;
  meadow: string;
  pines: string;
  cabin: string;
  roof: string;
}

/** Paletas por cor de chalé; a cor do chalé no banco escolhe a mais próxima. */
export const landscapePalettes = {
  moss: {
    sky: "#E3EAD6",
    hills: "#C8D5B5",
    meadow: "#98AE84",
    pines: "#4A6B3A",
    cabin: "#B9774E",
    roof: "#5A3A26",
  },
  slate: {
    sky: "#DCE6EA",
    hills: "#B9CBD2",
    meadow: "#8FA9A0",
    pines: "#3F5F55",
    cabin: "#A86C46",
    roof: "#4E3322",
  },
  plum: {
    sky: "#EFDFE0",
    hills: "#D9C2C2",
    meadow: "#A99A86",
    pines: "#55663F",
    cabin: "#9C5F4A",
    roof: "#4A2C24",
  },
} satisfies Record<string, LandscapePalette>;

export type LandscapeTone = keyof typeof landscapePalettes;

interface ChaletLandscapeProps {
  tone?: LandscapeTone;
  className?: string;
}

/** Ilustração decorativa (montanha, pinheiros, chalé) usada até haver foto real. */
export function ChaletLandscape({ tone = "moss", className }: ChaletLandscapeProps) {
  const p = landscapePalettes[tone];
  return (
    <svg
      viewBox="0 0 320 140"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("block h-full w-full", className)}
    >
      <rect width="320" height="140" fill={p.sky} />
      <circle cx="262" cy="36" r="15" fill="#F4DCA6" />
      <path d="M0 100 60 52l50 36 60-48 70 52 50-30 30 18v60H0z" fill={p.hills} />
      <path d="M0 118q80-22 160-6t160-6v34H0z" fill={p.meadow} />
      <path d="M34 124l12-36 12 36zM58 124l10-28 10 28zM250 124l12-38 12 38zM276 124l9-26 9 26z" fill={p.pines} />
      <path d="M138 124V98l28-24 28 24v26z" fill={p.cabin} />
      <path
        d="M132 100l34-30 34 30"
        fill="none"
        stroke={p.roof}
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="158" y="104" width="16" height="20" rx="2" fill="#F6D58E" />
      <rect x="178" y="74" width="8" height="16" fill={p.roof} />
    </svg>
  );
}

/** Escolhe a paleta pelo tom dominante da cor hex do chalé. */
export function toneFromColor(hex: string): LandscapeTone {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  if (Number.isNaN(r + g + b)) return "moss";
  if (r > g && r >= b) return "plum";
  if (b >= g) return "slate";
  return "moss";
}
