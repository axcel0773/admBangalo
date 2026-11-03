import "server-only";

import { listChalets } from "@/features/chalets/services";
import { reservationsRepository } from "@/features/reservations/services";
import { addDays, type IsoDate } from "@/lib/dates";

import type { CalendarChalet, CalendarStay } from "./domain";

/** Chalés ativos e estadias que cruzam o período [start, start + days). */
export async function getCalendarData(
  start: IsoDate,
  days: number,
): Promise<{ chalets: CalendarChalet[]; stays: CalendarStay[] }> {
  const lastDay = addDays(start, days - 1);

  const [chalets, stays] = await Promise.all([
    listChalets({ onlyActive: true }),
    reservationsRepository().then((repo) =>
      repo.list({
        statuses: ["pending", "confirmed", "checked_in", "checked_out"],
        // inclui quem sai no primeiro dia (aparece como "saída" na agenda)
        endingFrom: start,
        startingUntil: lastDay,
        limit: 500,
      }),
    ),
  ]);

  return {
    chalets: chalets.map(({ id, name, color, max_guests }) => ({ id, name, color, max_guests })),
    stays,
  };
}
