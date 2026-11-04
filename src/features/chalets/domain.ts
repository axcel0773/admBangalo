import type { Tables } from "@/types/database";

export type Chalet = Tables<"chalets">;

/** Regra interna do condomínio: cada bangalô recebe no máximo 6 pessoas. */
export const MAX_CHALET_GUESTS = 6;

export interface ChaletColor {
  value: string;
  label: string;
}

/** Cores sugeridas para identificar cada chalé no calendário. */
export const CHALET_COLORS: ChaletColor[] = [
  { value: "#4A6B3A", label: "Musgo" },
  { value: "#5E7C8C", label: "Ardósia" },
  { value: "#8B5A6B", label: "Ameixa" },
  { value: "#C0643A", label: "Terracota" },
  { value: "#7A8C52", label: "Oliva" },
  { value: "#6B4E36", label: "Madeira" },
];

export const DEFAULT_CHALET_COLOR = CHALET_COLORS[0]?.value ?? "#4A6B3A";

/** "14:00:00" → "14:00" */
export function shortTime(time: string): string {
  return time.slice(0, 5);
}
