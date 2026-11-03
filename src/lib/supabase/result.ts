interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export class RepositoryError extends Error {
  constructor(context: string, cause: string) {
    super(`${context}: ${cause}`);
    this.name = "RepositoryError";
  }
}

/** Extrai `data` de uma resposta do Supabase ou lança um erro com contexto. */
export function unwrap<T>(result: QueryResult<T>, context: string): T {
  if (result.error) throw new RepositoryError(context, result.error.message);
  if (result.data === null) throw new RepositoryError(context, "nenhum dado retornado");
  return result.data;
}

/** Para listas: `null` vira lista vazia. */
export function unwrapList<T>(result: QueryResult<T[]>, context: string): T[] {
  if (result.error) throw new RepositoryError(context, result.error.message);
  return result.data ?? [];
}
