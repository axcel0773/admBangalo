import "server-only";

import { parseDateRange, toDateRange, type SeasonRate } from "@/features/reservations/domain/seasons";
import type { IsoDate } from "@/lib/dates";
import { assertMutation } from "@/lib/supabase/errors";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import type { SeasonRateInput } from "../schemas";

/** Linha do banco → temporada com datas de início e fim (fim exclusivo). */
function toSeason(row: Tables<"chalet_rates">): SeasonRate | null {
  const range = parseDateRange(row.period);
  if (!range) return null;
  return {
    id: row.id,
    chalet_id: row.chalet_id,
    label: row.label,
    start: range.start,
    end: range.end,
    nightly_rate: row.nightly_rate,
    min_nights: row.min_nights,
  };
}

const sortByStart = (a: SeasonRate, b: SeasonRate) => a.start.localeCompare(b.start);

export function createSeasonRatesRepository(db: DbClient) {
  return {
    async listByChalet(chaletId: string): Promise<SeasonRate[]> {
      const result = await db.from("chalet_rates").select("*").eq("chalet_id", chaletId);
      return unwrapList(result, "Listar temporadas")
        .map(toSeason)
        .filter((season): season is SeasonRate => season !== null)
        .sort(sortByStart);
    },

    /** Temporadas que ainda não acabaram (para a prévia da nova reserva). */
    async listCurrent(today: IsoDate): Promise<SeasonRate[]> {
      const result = await db.from("chalet_rates").select("*");
      return unwrapList(result, "Listar temporadas")
        .map(toSeason)
        .filter((season): season is SeasonRate => season !== null && season.end > today)
        .sort(sortByStart);
    },

    async create(chaletId: string, input: SeasonRateInput): Promise<void> {
      assertMutation(
        await db.from("chalet_rates").insert({
          chalet_id: chaletId,
          label: input.label,
          period: toDateRange(input.first_night, input.last_night),
          nightly_rate: input.nightly_rate,
          min_nights: input.min_nights,
        }),
        "Não foi possível salvar a temporada.",
      );
    },

    async remove(chaletId: string, id: string): Promise<void> {
      assertMutation(
        await db.from("chalet_rates").delete().eq("id", id).eq("chalet_id", chaletId),
        "Não foi possível remover a temporada.",
      );
    },
  };
}
