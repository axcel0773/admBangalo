import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createGuestsRepository } from "./data/guests.repository";
import { guestsCsv, type Guest, type GuestStay, type GuestSummary } from "./domain";

export async function guestsRepository() {
  return createGuestsRepository(await createSupabaseServerClient());
}

/** Lista para a tela de hóspedes: cada um com nº de estadias e a última. */
export async function searchGuests(term?: string): Promise<GuestSummary[]> {
  const repo = await guestsRepository();
  const guests = await repo.search(term);
  const stays = await repo.listStays(guests.map((guest) => guest.id));

  return guests.map((guest) => {
    const own = stays.filter((stay) => stay.main_guest_id === guest.id);
    return { ...guest, staysCount: own.length, lastStay: own[0] ?? null };
  });
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
