/** Quantidade de pessoas vinda da URL (ex.: de um orçamento); qualquer valor inválido vira "sem valor". */
export function toCount(value: string | undefined, max = 6): number | undefined {
  const count = Number(value);
  return value !== undefined && Number.isInteger(count) && count >= 0 && count <= max ? count : undefined;
}
