import { MutationError } from "@/lib/supabase/errors";

/**
 * IDs passados com `.bind(null, id)` para Server Actions chegam do navegador sem
 * criptografia: qualquer um pode trocar o valor. O RLS já impede mexer em dados
 * de outro dono; isto barra lixo antes de chegar ao banco (erro claro em vez de 500).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const INVALID_ID_MESSAGE = "Registro inválido. Atualize a página e tente de novo.";

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export function assertIds(...values: unknown[]): void {
  if (!values.every(isUuid)) throw new MutationError(INVALID_ID_MESSAGE);
}
