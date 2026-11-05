import type { IsoDate } from "@/lib/dates";
import type { Enums } from "@/types/database";

export type BlockSource = Enums<"block_source">;

export interface ChaletBlock {
  id: string;
  chalet_id: string;
  /** Primeira noite bloqueada. */
  starts_on: IsoDate;
  /** Dia em que o bloqueio termina (exclusivo). */
  ends_on: IsoDate;
  reason: string;
  source: BlockSource;
}

/** Períodos [a, b) e [c, d) se cruzam? (o dia da saída não conta) */
export function rangesOverlap(aStart: IsoDate, aEnd: IsoDate, bStart: IsoDate, bEnd: IsoDate): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Bloqueios do bangalô que cruzam a estadia. */
export function overlappingBlocks<T extends ChaletBlock>(
  blocks: T[],
  chaletId: string,
  checkIn: IsoDate,
  checkOut: IsoDate,
): T[] {
  if (!checkIn || !checkOut || checkOut <= checkIn) return [];
  return blocks.filter(
    (block) => block.chalet_id === chaletId && rangesOverlap(block.starts_on, block.ends_on, checkIn, checkOut),
  );
}

/** Aviso para a nova reserva: manual impede (o banco recusa); importado só avisa. */
export function blockWarning(blocks: ChaletBlock[]): { blocking: boolean; message: string } | null {
  const manual = blocks.find((block) => block.source === "manual");
  if (manual) {
    return { blocking: true, message: `Essas datas estão bloqueadas: ${manual.reason}.` };
  }
  const external = blocks[0];
  if (external) {
    return {
      blocking: false,
      message: `O calendário “${external.reason}” já tem essas datas ocupadas. Se for a mesma reserva, pode seguir.`,
    };
  }
  return null;
}

/** O bloqueio ocupa a noite de `day`? */
export function blocksNight(block: Pick<ChaletBlock, "starts_on" | "ends_on">, day: IsoDate): boolean {
  return block.starts_on <= day && day < block.ends_on;
}
