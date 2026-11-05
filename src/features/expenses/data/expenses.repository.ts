import "server-only";

import type { IsoDate } from "@/lib/dates";
import { MutationError, assertMutation } from "@/lib/supabase/errors";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { Expense } from "../domain";
import type { ExpenseInput } from "../schemas";

export function createExpensesRepository(db: DbClient) {
  return {
    /** Despesas com data entre `from` e `to` (inclusive), mais recentes primeiro. */
    async listBetween(from: IsoDate, to: IsoDate): Promise<Expense[]> {
      const result = await db
        .from("expenses")
        .select("*")
        .gte("spent_on", from)
        .lte("spent_on", to)
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false });
      return unwrapList(result, "Listar despesas");
    },

    async create(input: ExpenseInput): Promise<void> {
      assertMutation(await db.from("expenses").insert(input), "Não foi possível lançar a despesa.");
    },

    async remove(id: string): Promise<void> {
      const result = await db.from("expenses").delete().eq("id", id).select("id");
      assertMutation(result, "Não foi possível excluir a despesa.");
      if (!result.data || result.data.length === 0) throw new MutationError("Despesa não encontrada.");
    },
  };
}
