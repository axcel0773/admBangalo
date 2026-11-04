import "server-only";

import { addDays, todayIso, type IsoDate } from "@/lib/dates";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createAvailabilityRepository, type IcalSource } from "./data/availability.repository";
import type { ChaletBlock } from "./domain/blocks";
import { buildIcs, icalUrlProblem, parseIcs, relevantEvents } from "./domain/ical";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_ICS_BYTES = 2_000_000;
/** O calendário abre e, se faz mais tempo que isso, sincroniza sozinho. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
const AUTO_SYNC_BUDGET_MS = 6_000;

export async function availabilityRepository() {
  return createAvailabilityRepository(await createSupabaseServerClient());
}

const MAX_REDIRECTS = 3;

/** Lê o corpo aos pedaços e para ao passar do limite, sem carregar tudo na memória. */
async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_ICS_BYTES) {
      await reader.cancel();
      throw new Error("O calendário é grande demais.");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

/**
 * Baixa o .ics com prazo e tamanho máximos. Os redirecionamentos são seguidos à mão,
 * conferindo cada destino: um site público não pode mandar o servidor para a rede interna.
 */
async function fetchIcs(startUrl: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let url = startUrl;
    let response: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const problem = icalUrlProblem(url);
      if (problem) throw new Error(problem);
      response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
        redirect: "manual",
        headers: { accept: "text/calendar, text/plain;q=0.9, */*;q=0.1", "user-agent": "admBangalo-ical/1.0" },
      });
      const location = response.headers.get("location");
      if (response.status < 300 || response.status >= 400 || !location) break;
      url = new URL(location, url).toString();
      response = null;
    }
    if (!response) throw new Error("O calendário redirecionou vezes demais.");
    if (!response.ok) throw new Error(`O calendário respondeu com erro ${response.status}.`);
    const text = await readLimited(response);
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("O link não é de um calendário .ics.");
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("O calendário demorou demais para responder.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Importa um calendário externo. Erros ficam registrados na origem, não derrubam a tela. */
export async function syncSource(source: IcalSource): Promise<{ ok: boolean; events: number; error?: string }> {
  const repo = await availabilityRepository();
  try {
    const events = relevantEvents(parseIcs(await fetchIcs(source.url)), addDays(todayIso(), -1));
    await repo.replaceImportedBlocks(source, events);
    await repo.markSynced(source.id, null);
    return { ok: true, events: events.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao sincronizar.";
    await repo.markSynced(source.id, message.slice(0, 200));
    return { ok: false, events: 0, error: message };
  }
}

export async function syncChaletSources(chaletId: string): Promise<void> {
  const sources = await (await availabilityRepository()).listSources(chaletId);
  await Promise.all(sources.map(syncSource));
}

/** Ao abrir o calendário: atualiza os links antigos, sem segurar a tela por muito tempo. */
export async function syncStaleSources(now: Date = new Date()): Promise<void> {
  const sources = await (await availabilityRepository()).listSources();
  const stale = sources.filter(
    (source) => !source.last_synced_at || now.getTime() - Date.parse(source.last_synced_at) > STALE_AFTER_MS,
  );
  if (stale.length === 0) return;
  await Promise.race([
    Promise.allSettled(stale.map(syncSource)),
    new Promise((resolve) => setTimeout(resolve, AUTO_SYNC_BUDGET_MS)),
  ]);
}

export async function listBlocksBetween(from: IsoDate, to: IsoDate): Promise<ChaletBlock[]> {
  return (await availabilityRepository()).listBlocksBetween(from, to);
}

export function icalFeedUrl(token: string): string {
  return `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/ical/${token}.ics`;
}

export interface ChaletAvailability {
  blocks: ChaletBlock[];
  sources: IcalSource[];
  feedUrl: string | null;
}

export async function getChaletAvailability(chaletId: string): Promise<ChaletAvailability> {
  const repo = await availabilityRepository();
  const [blocks, sources, token] = await Promise.all([
    repo.listChaletBlocks(chaletId, todayIso()),
    repo.listSources(chaletId),
    repo.findToken(chaletId),
  ]);
  return { blocks, sources, feedUrl: token ? icalFeedUrl(token) : null };
}

/** Conteúdo do link iCal público (só datas, nunca dados de hóspede). */
export async function getIcalFeed(token: string, now: Date = new Date()): Promise<string> {
  const rows = await (await availabilityRepository()).feed(token);
  const first = rows[0];
  // Token válido sem nenhuma reserva também devolve um calendário vazio: não dá para distinguir
  // de token inválido sem expor mais dados, então ambos respondem calendário vazio com nome genérico.
  return buildIcs({
    name: first ? `${first.chalet_name} (admBangalo)` : "admBangalo",
    stamp: now,
    events: rows.map((row) => ({ uid: row.uid, start: row.starts_on, end: row.ends_on, summary: row.summary })),
  });
}

export type { IcalSource };
