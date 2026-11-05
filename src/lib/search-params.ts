/** Quantidade de pessoas vinda da URL (ex.: de um orçamento); qualquer valor inválido vira "sem valor". */
export function toCount(value: string | undefined, max = 6): number | undefined {
  if (value === undefined || !/^\d{1,3}$/.test(value)) return undefined;
  const count = Number(value);
  return count <= max ? count : undefined;
}
