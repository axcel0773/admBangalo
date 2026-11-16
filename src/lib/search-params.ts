/** Quantidade de pessoas vinda da URL (ex.: de um orçamento); qualquer valor inválido vira "sem valor". */
export function toCount(value: string | undefined, max = 6): number | undefined {
  if (value === undefined || !/^\d{1,3}$/.test(value)) return undefined;
  const count = Number(value);
  return count <= max ? count : undefined;
}

/** Listas longas crescem de 50 em 50 pelo link "Ver mais" (`?n=100`), até um teto. */
export const PAGE_STEP = 50;
export const PAGE_MAX = 1000;

/** Tamanho da lista vindo da URL: múltiplo do passo, entre o passo e o teto. Inválido = primeira página. */
export function toPageSize(value: string | undefined, step = PAGE_STEP, max = PAGE_MAX): number {
  if (value === undefined || !/^\d{1,5}$/.test(value)) return step;
  const size = Math.ceil(Number(value) / step) * step;
  return Math.min(Math.max(size, step), max);
}

/**
 * A consulta pede `size + 1` linhas: a linha extra só serve para saber se há mais.
 * Devolve as `size` primeiras e o tamanho da próxima página (ou null no fim ou no teto).
 */
export function paginate<T>(rows: T[], size: number, step = PAGE_STEP, max = PAGE_MAX): { items: T[]; nextSize: number | null } {
  const hasMore = rows.length > size;
  return { items: hasMore ? rows.slice(0, size) : rows, nextSize: hasMore && size < max ? Math.min(size + step, max) : null };
}

/** Divide uma lista em blocos (ex.: IDs em consultas `in`, para a URL não estourar). */
export function chunk<T>(items: T[], size: number): T[][] {
  const blocks: T[][] = [];
  for (let i = 0; i < items.length; i += size) blocks.push(items.slice(i, i + size));
  return blocks;
}
