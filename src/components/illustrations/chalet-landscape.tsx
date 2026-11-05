import { cn } from "@/lib/cn";

export interface LandscapePalette {
  sky: string;
  hills: string;
  meadow: string;
  pines: string;
  cabin: string;
  roof: string;
}

/** Paletas por cor de bangalô; a cor do bangalô no banco escolhe a mais próxima. */
export const landscapePalettes = {
  moss: { sky: "#DCEBF8", hills: "#A9C8E6", meadow: "#1F6FB2", pines: "#0E3A63", cabin: "#FFFDF9", roof: "#F29A3E" },
  slate: { sky: "#D8F2F1", hills: "#9ED5D3", meadow: "#0B9096", pines: "#07505A", cabin: "#FFFDF9", roof: "#E8606A" },
  plum: { sky: "#FBE5C8", hills: "#F5C98F", meadow: "#E07B39", pines: "#7A3E12", cabin: "#FFFDF9", roof: "#14508A" },
} satisfies Record<string, LandscapePalette>;

export type LandscapeTone = keyof typeof landscapePalettes;

interface ChaletLandscapeProps {
  tone?: LandscapeTone;
  className?: string;
}

/** Ilustração decorativa (montanha, pinheiros, bangalô) usada até haver foto real. */
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
      <circle cx="262" cy="36" r="15" fill="#FFD98A" />
      <path d="M0 96q40-10 80 0t80 0 80 0 80 0v44H0z" fill={p.hills} />
      <path d="M0 112q40-10 80 0t80 0 80 0 80 0v28H0z" fill={p.meadow} opacity="0.75" />
      <path d="M0 126q40-8 80 0t80 0 80 0 80 0v14H0z" fill="#F3E3C3" />
      <path d="M138 124V98l28-24 28 24v26z" fill={p.cabin} />
      <path
        d="M130 100l36-32 36 32"
        fill="none"
        stroke={p.roof}
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="158" y="104" width="16" height="20" rx="2" fill={p.pines} />
      <path d="M58 128c0-18 2-34 8-50" stroke={p.pines} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path
        d="M66 78c-10-10-22-10-30-4M66 78c10-10 22-10 30-4M66 78c-8-14-20-16-28-12M66 78c8-14 20-16 28-12"
        stroke={p.pines}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Escolhe a paleta pelo tom dominante da cor hex do bangalô. */
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
