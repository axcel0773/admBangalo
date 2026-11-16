import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { todayIso } from "@/lib/dates";
import { PAGE_MAX, paginate } from "@/lib/search-params";

import { createGuestsRepository } from "./data/guests.repository";

import { guestsCsv, isBirthdayMonth, isRecurringGuest, type Guest, type GuestStay, type GuestSummary } from "./domain";

export async function guestsRepository() {
  return createGuestsRepository(await createSupabaseServerClient());
}

export interface GuestPage {
  guests: GuestSummary[];
  /** Tamanho da próxima página para o link "Ver mais"; null quando já está tudo na tela. */
  nextSize: number | null;
}

/**
 * Lista para a tela de hóspedes: cada um com nº de estadias e a última.
 * `size` vem da URL. Com filtro (recorrentes, aniversariantes) use `PAGE_MAX`:
 * o filtro precisa olhar todos, não só a primeira página.
 */
export async function searchGuests(term?: string, size = PAGE_MAX): Promise<GuestPage> {
  const repo = await guestsRepository();
  const { items: guests, nextSize } = paginate(await repo.search(term, size + 1), size);
  const stays = await repo.listStays(guests.map((guest) => guest.id));

  const today = todayIso();

  const staysByGuest = new Map<string, typeof stays>();
  for (const stay of stays) staysByGuest.set(stay.main_guest_id, [...(staysByGuest.get(stay.main_guest_id) ?? []), stay]);

  const summaries = guests.map((guest) => {
    const own = staysByGuest.get(guest.id) ?? [];
    return {
      ...guest,
      staysCount: own.length,
      lastStay: own[0] ?? null,
      recurring: isRecurringGuest(own),
      birthdayThisMonth: isBirthdayMonth(guest.birth_date, today),
    };
  });
  return { guests: summaries, nextSize };
}

export async function getGuestWithStays(
  id: string,
): Promise<{ guest: Guest; stays: GuestStay[] } | null> {
  const repo = await guestsRepository();
  const guest = await repo.findById(id);
  if (!guest) return null;
  return { guest, stays: await repo.listStays([id]) };
}

export async function getGuest(id: string): Promise<Guest | null> {
  return (await guestsRepository()).findById(id);
}

export async function getGuestsCsv(): Promise<string> {
  return guestsCsv(await (await guestsRepository()).listAll());
}
