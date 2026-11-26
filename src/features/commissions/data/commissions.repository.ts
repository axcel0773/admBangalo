import "server-only";

import type { IsoDate } from "@/lib/dates";
import { MutationError, assertMutation } from "@/lib/supabase/errors";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import type { CommissionInput, CommissionPaymentInput } from "../schemas";

/** Comissão de uma reserva, com o que as listas mostram. */
export type CommissionRow = Pick<
  Tables<"reservations">,
  "id" | "check_in" | "status" | "broker_name" | "commission_amount" | "commission_paid_on" | "commission_method"
> & { guest_name: string };

const ROW_COLUMNS =
  "id, check_in, status, main_guest_id, broker_name, commission_amount, commission_paid_on, commission_method";

export function createCommissionsRepository(db: DbClient) {
  /** Junta o nome do hóspede responsável a cada linha (uma consulta para todas). */
  async function withGuestNames(
    rows: (Omit<CommissionRow, "guest_name"> & { main_guest_id: string })[],
  ): Promise<CommissionRow[]> {
    if (rows.length === 0) return [];
    const ids = [...new Set(rows.map((row) => row.main_guest_id))];
    const guests = unwrapList(await db.from("guests").select("id, full_name").in("id", ids), "Listar hóspedes");
    const names = new Map(guests.map((guest) => [guest.id, guest.full_name]));
    return rows.map(({ main_guest_id, ...row }) => ({ ...row, guest_name: names.get(main_guest_id) ?? "Hóspede" }));
  }

  /** Atualiza só as colunas da comissão; confere que a reserva existe (e é do dono, pelo RLS). */
  async function update(
    reservationId: string,
    changes: Partial<Pick<Tables<"reservations">, "broker_name" | "commission_amount" | "commission_paid_on" | "commission_method">>,
    failure: string,
  ): Promise<void> {
    const result = await db.from("reservations").update(changes).eq("id", reservationId).select("id");
    assertMutation(result, failure);
    if (!result.data || result.data.length === 0) throw new MutationError("Reserva não encontrada.");
  }

  return {
    /** Nomes de corretores já usados (para sugerir ao digitar). */
    async listBrokerNames(): Promise<(string | null)[]> {
      const result = await db.from("reservations").select("broker_name").not("broker_name", "is", null).limit(500);
      return unwrapList(result, "Listar corretores").map((row) => row.broker_name);
    },

    async save(reservationId: string, input: CommissionInput): Promise<void> {
      await update(
        reservationId,
        { broker_name: input.broker_name, commission_amount: input.amount },
        "Não foi possível salvar a comissão.",
      );
    },

    async markPaid(reservationId: string, input: CommissionPaymentInput): Promise<void> {
      const { data, error } = await db.from("reservations").select("commission_amount").eq("id", reservationId).maybeSingle();
      if (error || !data) throw new MutationError("Reserva não encontrada.");
      if (data.commission_amount === null) throw new MutationError("Esta reserva não tem comissão.");
      await update(
        reservationId,
        { commission_paid_on: input.paid_on, commission_method: input.method },
        "Não foi possível marcar a comissão como paga.",
      );
    },

    async markUnpaid(reservationId: string): Promise<void> {
      await update(reservationId, { commission_paid_on: null, commission_method: null }, "Não foi possível desfazer o pagamento.");
    },

    async remove(reservationId: string): Promise<void> {
      await update(
        reservationId,
        { broker_name: null, commission_amount: null, commission_paid_on: null, commission_method: null },
        "Não foi possível remover a comissão.",
      );
    },

    /** Comissões pagas no período (entram nas despesas do mês em que foram pagas). */
    async listPaidBetween(from: IsoDate, to: IsoDate): Promise<CommissionRow[]> {
      const result = await db
        .from("reservations")
        .select(ROW_COLUMNS)
        .gte("commission_paid_on", from)
        .lte("commission_paid_on", to)
        .order("commission_paid_on", { ascending: false });
      return withGuestNames(unwrapList(result, "Listar comissões pagas"));
    },

    /** Comissões ainda a pagar, de qualquer mês. */
    async listPending(): Promise<CommissionRow[]> {
      const result = await db
        .from("reservations")
        .select(ROW_COLUMNS)
        .not("commission_amount", "is", null)
        .is("commission_paid_on", null)
        .order("check_in", { ascending: true });
      return withGuestNames(unwrapList(result, "Listar comissões a pagar"));
    },
  };
}
