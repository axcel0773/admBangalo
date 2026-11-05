import "server-only";

import { addDays, type IsoDate } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createCleaningRepository } from "./data/cleaning.repository";
import { buildCleaningTasks, cleaningWindow, type CleaningTask } from "./domain";

export async function cleaningRepository() {
  return createCleaningRepository(await createSupabaseServerClient());
}

export async function listCleaningTasks(today: IsoDate): Promise<CleaningTask[]> {
  const repository = await cleaningRepository();
  const { from, to } = cleaningWindow(today);
  // Entradas até 60 dias depois da janela bastam para achar a próxima entrada.
  const stays = await repository.listStays(from, addDays(to, 60));
  const inWindow = stays.filter((stay) => stay.checkOut >= from && stay.checkOut <= to).map((stay) => stay.reservationId);
  return buildCleaningTasks(stays, await repository.listDone(inWindow), today);
}
