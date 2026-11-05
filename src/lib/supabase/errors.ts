/**
 * Traduz erros do Postgres/PostgREST em mensagens para o proprietário.
 * As regras críticas vivem no banco; aqui só damos nome humano a elas.
 */
interface PostgresLikeError {
  code?: string;
  message?: string;
  details?: string | null;
}

const MESSAGES_BY_CONSTRAINT: Record<string, string> = {
  reservations_no_overlap: "Já existe uma reserva neste bangalô para essas datas.",
  guests_owner_document_uq: "Já existe um hóspede com esse documento.",
  reservation_guests_one_main: "A reserva só pode ter um hóspede responsável.",
  chalet_rates_chalet_id_period_excl: "Já existe uma temporada neste bangalô que cruza essas datas.",
  chalets_max_guests_limit: "Regra do condomínio: cada bangalô recebe no máximo 6 pessoas.",
  reservations_guests_limit: "Regra do condomínio: no máximo 6 pessoas por bangalô.",
};

export function friendlyDbMessage(error: PostgresLikeError, fallback: string): string {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;

  for (const [constraint, message] of Object.entries(MESSAGES_BY_CONSTRAINT)) {
    if (text.includes(constraint)) return message;
  }

  switch (error.code) {
    case "23P01": // exclusion_violation
      return MESSAGES_BY_CONSTRAINT.reservations_no_overlap ?? fallback;
    case "23514": // check_violation
      // Mensagens dos nossos triggers/funções já vêm em português (ex.: capacidade do bangalô);
      // as automáticas do Postgres começam com "new row".
      return error.message && !error.message.startsWith("new row")
        ? error.message
        : "Algum valor está fora do permitido.";
    case "23505": // unique_violation
      return "Esse registro já existe.";
    case "23503": // foreign_key_violation
      return "Este registro está em uso e não pode ser removido.";
    case "42501": // RLS
      return "Você não tem permissão para esta ação.";
    default:
      return fallback;
  }
}

/** Erro de escrita com mensagem já pronta para a tela. */
export class MutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MutationError";
  }
}

/** Lança MutationError amigável quando a resposta do Supabase traz erro. */
export function assertMutation(
  result: { error: PostgresLikeError | null },
  fallback: string,
): void {
  if (result.error) throw new MutationError(friendlyDbMessage(result.error, fallback));
}
