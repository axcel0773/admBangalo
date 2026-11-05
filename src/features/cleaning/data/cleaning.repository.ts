import "server-only";

import type { IsoDate } from "@/lib/dates";
import { assertMutation } from "@/lib/supabase/errors";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { CleaningStay } from "../domain";

export function createCleaningRepository(db: DbClient) {
  return {
    /** Estadias não canceladas que saem até `to` ou entram a partir de `from` (para achar a próxima entrada). */
    async listStays(from: IsoDate, to: IsoDate): Promise<CleaningStay[]> {
      const rows = unwrapList(
        await db
          .from("reservation_financials")
          .select("reservation_id, chalet_id, chalet_name, main_guest_name, check_in, check_out, status")
          .neq("status", "cancelled")
          .gte("check_out", from)
          .lte("check_in", to)
          .order("check_out"),
        "Listar saídas",
      );
      return rows.map((row) => ({
        reservationId: row.reservation_id,
        chaletId: row.chalet_id,
        chaletName: row.chalet_name,
        guestName: row.main_guest_name,
        checkIn: row.check_in,
        checkOut: row.check_out,
      }));
    },

    async listDone(reservationIds: string[]): Promise<Set<string>> {
      if (reservationIds.length === 0) return new Set();
      const rows = unwrapList(
        await db.from("cleaning_tasks").select("reservation_id").in("reservation_id", reservationIds),
        "Listar limpezas feitas",
      );
      return new Set(rows.map((row) => row.reservation_id));
    },

    async markDone(reservationId: string): Promise<void> {
      assertMutation(
        await db.from("cleaning_tasks").upsert({ reservation_id: reservationId }, { onConflict: "reservation_id" }),
        "Não foi possível marcar a limpeza.",
      );
    },

    async markUndone(reservationId: string): Promise<void> {
      assertMutation(
        await db.from("cleaning_tasks").delete().eq("reservation_id", reservationId),
        "Não foi possível desmarcar a limpeza.",
      );
    },
  };
}
