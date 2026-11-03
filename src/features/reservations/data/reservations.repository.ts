import "server-only";

import type { IsoDate } from "@/lib/dates";
import { MutationError, assertMutation, friendlyDbMessage } from "@/lib/supabase/errors";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";
import type { Json, Tables, Views } from "@/types/database";

import type { ReservationStatus } from "../domain/types";

export type ReservationListItem = Pick<
  Views<"reservation_financials">,
  | "reservation_id"
  | "chalet_id"
  | "chalet_name"
  | "main_guest_name"
  | "check_in"
  | "check_out"
  | "nights"
  | "guests_count"
  | "status"
  | "grand_total"
  | "balance_due"
  | "payment_status"
>;

const LIST_COLUMNS =
  "reservation_id, chalet_id, chalet_name, main_guest_name, check_in, check_out, nights, guests_count, status, grand_total, balance_due, payment_status";

export interface ReservationFilters {
  statuses?: ReservationStatus[];
  chaletId?: string;
  /** Só estadias que terminam a partir desta data. */
  endingFrom?: IsoDate;
  /** Só estadias que terminaram antes desta data. */
  endedBefore?: IsoDate;
  /** Só estadias que começam até esta data (inclusive). */
  startingUntil?: IsoDate;
  ascending?: boolean;
  limit?: number;
}

export interface ReservationDetailRecord {
  reservation: Tables<"reservations">;
  financials: Views<"reservation_financials">;
  chalet: Pick<Tables<"chalets">, "id" | "name" | "color" | "check_in_time" | "check_out_time" | "max_guests">;
  mainGuest: Pick<Tables<"guests">, "id" | "full_name" | "phone" | "email" | "document">;
  guests: Tables<"reservation_guests">[];
  charges: Tables<"reservation_charges">[];
}

export function createReservationsRepository(db: DbClient) {
  return {
    async list(filters: ReservationFilters = {}): Promise<ReservationListItem[]> {
      let query = db
        .from("reservation_financials")
        .select(LIST_COLUMNS)
        .order("check_in", { ascending: filters.ascending ?? true })
        .limit(filters.limit ?? 100);
      if (filters.statuses?.length) query = query.in("status", filters.statuses);
      if (filters.chaletId) query = query.eq("chalet_id", filters.chaletId);
      if (filters.endingFrom) query = query.gte("check_out", filters.endingFrom);
      if (filters.endedBefore) query = query.lt("check_out", filters.endedBefore);
      if (filters.startingUntil) query = query.lte("check_in", filters.startingUntil);
      return unwrapList(await query, "Listar reservas");
    },

    async findDetail(id: string): Promise<ReservationDetailRecord | null> {
      const { data: reservation, error } = await db.from("reservations").select("*").eq("id", id).maybeSingle();
      if (error) throw new MutationError(friendlyDbMessage(error, "Não foi possível abrir a reserva."));
      if (!reservation) return null;

      const [financials, chalet, mainGuest, guests, charges] = await Promise.all([
        db.from("reservation_financials").select("*").eq("reservation_id", id).single(),
        db
          .from("chalets")
          .select("id, name, color, check_in_time, check_out_time, max_guests")
          .eq("id", reservation.chalet_id)
          .single(),
        db.from("guests").select("id, full_name, phone, email, document").eq("id", reservation.main_guest_id).single(),
        db.from("reservation_guests").select("*").eq("reservation_id", id).order("is_main", { ascending: false }).order("created_at"),
        db.from("reservation_charges").select("*").eq("reservation_id", id).order("created_at"),
      ]);

      if (!financials.data || !chalet.data || !mainGuest.data) return null;

      return {
        reservation,
        financials: financials.data,
        chalet: chalet.data,
        mainGuest: mainGuest.data,
        guests: unwrapList(guests, "Listar hóspedes da reserva"),
        charges: unwrapList(charges, "Listar cobranças da reserva"),
      };
    },

    /** Cria reserva + hóspedes numa transação (função create_reservation). */
    async create(payload: Json): Promise<string> {
      const { data, error } = await db.rpc("create_reservation", { payload });
      if (error) throw new MutationError(friendlyDbMessage(error, "Não foi possível criar a reserva."));
      if (!data) throw new MutationError("Não foi possível criar a reserva.");
      return data;
    },

    async updateStatus(
      id: string,
      changes: Partial<Pick<Tables<"reservations">, "status" | "checked_in_at" | "checked_out_at" | "cancelled_at">>,
    ): Promise<void> {
      assertMutation(await db.from("reservations").update(changes).eq("id", id), "Não foi possível mudar o status.");
    },

    async findStatus(id: string): Promise<ReservationStatus | null> {
      const { data } = await db.from("reservations").select("status").eq("id", id).maybeSingle();
      return data?.status ?? null;
    },
  };
}

export type ReservationsRepository = ReturnType<typeof createReservationsRepository>;
