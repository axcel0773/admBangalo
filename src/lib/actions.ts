import type { FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

/**
 * Ações sem formulário de dados (remover, sincronizar, mudar status).
 * Erros previstos (MutationError) voltam como FormState e aparecem ao lado do
 * botão, pelo <ActionForm>; em produção o Next esconde a mensagem de erros
 * lançados, então lançar mostraria só a tela genérica de erro.
 * redirect() e erros inesperados continuam subindo normalmente.
 */
export async function attempt(task: () => Promise<void>, success = "Pronto."): Promise<FormState> {
  try {
    await task();
  } catch (error) {
    if (error instanceof MutationError) return { status: "error", message: error.message };
    throw error;
  }
  return { status: "success", message: success };
}
