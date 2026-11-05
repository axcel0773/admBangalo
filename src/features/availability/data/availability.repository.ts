import "server-only";

import { addDays, type IsoDate } from "@/lib/dates";
import { MutationError, assertMutation, friendlyDbMessage } from "@/lib/supabase/errors";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import type { ChaletBlock } from "../domain/blocks";
import type { IcalEvent } from "../domain/ical";
import type { BlockInput, IcalSourceInput } from "../schemas";

export type IcalSource = Tables<"chalet_ical_sources">;

const BLOCK_COLUMNS = "id, chalet_id, starts_on, ends_on, reason, source";

/** Bloqueios, calendários externos e link iCal. O RLS limita ao dono logado. */
export function createAvailabilityRepository(db: DbClient) {
  return {
    /** Bloqueios que cruzam [from, to). */
    async listBlocksBetween(from: IsoDate, to: IsoDate): Promise<ChaletBlock[]> {
      const result = await db
        .from("chalet_blocks")
        .select(BLOCK_COLUMNS)
        .lt("starts_on", to)
        .gt("ends_on", from)
        .order("starts_on");
      return unwrapList(result, "Listar bloqueios");
    },

    async listChaletBlocks(chaletId: string, from: IsoDate): Promise<ChaletBlock[]> {
      const result = await db
        .from("chalet_blocks")
        .select(BLOCK_COLUMNS)
        .eq("chalet_id", chaletId)
        .gte("ends_on", from)
        .order("starts_on");
      return unwrapList(result, "Listar bloqueios do bangalô");
    },

    async createBlock(chaletId: string, input: BlockInput): Promise<void> {
      assertMutation(
        await db.from("chalet_blocks").insert({
          chalet_id: chaletId,
          reason: input.reason,
          starts_on: input.first_night,
          ends_on: addDays(input.last_night, 1),
          source: "manual",
        }),
        "Não foi possível bloquear as datas.",
      );
    },

    async deleteManualBlock(chaletId: string, blockId: string): Promise<void> {
      assertMutation(
        await db.from("chalet_blocks").delete().eq("id", blockId).eq("chalet_id", chaletId).eq("source", "manual"),
        "Não foi possível remover o bloqueio.",
      );
    },

    // ---- Calendários externos ----------------------------------------------

    async listSources(chaletId?: string): Promise<IcalSource[]> {
      let query = db.from("chalet_ical_sources").select("*").order("created_at");
      if (chaletId) query = query.eq("chalet_id", chaletId);
      return unwrapList(await query, "Listar calendários externos");
    },

    async createSource(chaletId: string, input: IcalSourceInput): Promise<IcalSource> {
      const { data, error } = await db
        .from("chalet_ical_sources")
        .insert({ chalet_id: chaletId, label: input.label, url: input.url })
        .select("*")
        .single();
      if (error || !data) {
        throw new MutationError(
          error?.code === "23505"
            ? "Esse link já está cadastrado neste bangalô."
            : friendlyDbMessage(error ?? {}, "Não foi possível salvar o calendário."),
        );
      }
      return data;
    },

    async deleteSource(chaletId: string, sourceId: string): Promise<void> {
      // Os bloqueios importados dele saem junto (on delete cascade).
      assertMutation(
        await db.from("chalet_ical_sources").delete().eq("id", sourceId).eq("chalet_id", chaletId),
        "Não foi possível remover o calendário.",
      );
    },

    /** Troca os bloqueios importados desta origem pelos eventos atuais. */
    async replaceImportedBlocks(source: IcalSource, events: IcalEvent[]): Promise<void> {
      assertMutation(
        await db.from("chalet_blocks").delete().eq("ical_source_id", source.id),
        "Não foi possível atualizar o calendário.",
      );
      if (events.length === 0) return;
      assertMutation(
        await db.from("chalet_blocks").insert(
          events.map((event) => ({
            chalet_id: source.chalet_id,
            starts_on: event.start,
            ends_on: event.end,
            reason: source.label,
            source: "ical" as const,
            ical_source_id: source.id,
            external_uid: event.uid.slice(0, 200),
          })),
        ),
        "Não foi possível atualizar o calendário.",
      );
    },

    async markSynced(sourceId: string, error: string | null): Promise<void> {
      await db
        .from("chalet_ical_sources")
        .update({ last_synced_at: new Date().toISOString(), last_error: error })
        .eq("id", sourceId);
    },

    // ---- Link iCal do bangalô -------------------------------------------------

    async findToken(chaletId: string): Promise<string | null> {
      const { data } = await db.from("chalets").select("ical_token").eq("id", chaletId).maybeSingle();
      return data?.ical_token ?? null;
    },

    async regenerateToken(chaletId: string): Promise<void> {
      assertMutation(
        await db.from("chalets").update({ ical_token: crypto.randomUUID() }).eq("id", chaletId),
        "Não foi possível gerar um novo link.",
      );
    },

    /** Datas ocupadas do bangalô dono do token (função ical_feed; funciona sem login). */
    async feed(token: string) {
      const { data, error } = await db.rpc("ical_feed", { p_token: token });
      if (error) throw new MutationError(friendlyDbMessage(error, "Calendário indisponível."));
      return data ?? [];
    },
  };
}

export type AvailabilityRepository = ReturnType<typeof createAvailabilityRepository>;
