import "server-only";

import type { ChaletBlock } from "@/features/availability/domain/blocks";
import { listBlocksBetween } from "@/features/availability/services";
import { listChalets, listCurrentSeasonRates } from "@/features/chalets/services";
import { listFees } from "@/features/fees/services";
import { guestsRepository } from "@/features/guests/services";
import { addDays, todayIso, type IsoDate } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  createReservationsRepository,
  type ReservationDetailRecord,
  type ReservationFilters,
  type ReservationListItem,
} from "./data/reservations.repository";
import type { ChaletForQuote, FeeForQuote } from "./domain/quote";
import type { SeasonRate } from "./domain/seasons";
import type { ReservationStatus } from "./domain/types";

export async function reservationsRepository() {
  return createReservationsRepository(await createSupabaseServerClient());
}

/* ---------- Lista ---------- */

export const RESERVATION_VIEWS = {
  upcoming: "Próximas",
  staying: "Hospedados",
  pending: "Pendentes",
  past: "Finalizadas",
  cancelled: "Canceladas",
} as const;

export type ReservationView = keyof typeof RESERVATION_VIEWS;

export function isReservationView(value: string | undefined): value is ReservationView {
  return value !== undefined && value in RESERVATION_VIEWS;
}

/** Cada aba da lista vira um conjunto de filtros. */
function filtersFor(view: ReservationView, today: IsoDate): ReservationFilters {
  switch (view) {
    case "upcoming":
      return { statuses: ["pending", "confirmed", "checked_in"], endingFrom: today };
    case "staying":
      return { statuses: ["checked_in"] };
    case "pending":
      return { statuses: ["pending"], endingFrom: today };
    case "past":
      return { statuses: ["checked_out", "checked_in", "confirmed"], endedBefore: today, ascending: false };
    case "cancelled":
      return { statuses: ["cancelled"], ascending: false };
  }
}

export async function listReservations(view: ReservationView, chaletId?: string): Promise<ReservationListItem[]> {
  const filters = filtersFor(view, todayIso());
  return (await reservationsRepository()).list({ ...filters, chaletId });
}

/* ---------- Nova reserva ---------- */

export interface NewReservationContext {
  chalets: (ChaletForQuote & { name: string; color: string })[];
  fees: FeeForQuote[];
  guests: { id: string; full_name: string; phone: string | null }[];
  /** Temporadas que ainda não acabaram, de todos os chalés. */
  seasons: SeasonRate[];
  /** Datas bloqueadas do próximo ano (manuais e de outras plataformas). */
  blocks: ChaletBlock[];
}

export async function getNewReservationContext(): Promise<NewReservationContext> {
  const today = todayIso();
  const [chalets, fees, guests, seasons, blocks] = await Promise.all([
    listChalets({ onlyActive: true }),
    listFees({ onlyActive: true }),
    guestsRepository().then((repo) => repo.search(undefined, 200)),
    listCurrentSeasonRates(),
    listBlocksBetween(today, addDays(today, 400)),
  ]);

  return {
    chalets: chalets.map(({ id, name, color, base_guests, max_guests, base_nightly_rate }) => ({
      id,
      name,
      color,
      base_guests,
      max_guests,
      base_nightly_rate,
    })),
    fees: fees.map(({ name, kind, mode, amount, chalet_id, active, auto_apply }) => ({
      name,
      kind,
      mode,
      amount,
      chalet_id,
      active,
      auto_apply,
    })),
    guests: guests
      .map(({ id, full_name, phone }) => ({ id, full_name, phone }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR")),
    seasons,
    blocks,
  };
}

/* ---------- Detalhe ---------- */

export async function getReservationDetail(id: string): Promise<ReservationDetailRecord | null> {
  return (await reservationsRepository()).findDetail(id);
}

export type { ReservationDetailRecord, ReservationListItem, ReservationStatus };
