import { formatCurrency, pluralize } from "@/lib/format";

/** Números do dia de um dono, vindos do banco (função `push_digest`). */
export interface DigestInput {
  arrivals: number;
  departures: number;
  overdueCount: number;
  overdueAmount: number;
}

export interface Digest {
  title: string;
  body: string;
  /** Tela aberta ao tocar na notificação. */
  url: string;
}

/**
 * Texto do aviso diário. Devolve null quando não há nada a dizer:
 * o plano gratuito só permite um envio por dia, então ele precisa valer a pena.
 */
export function buildDigest(input: DigestInput): Digest | null {
  const parts: string[] = [];
  if (input.arrivals > 0) parts.push(pluralize(input.arrivals, "chegada", "chegadas"));
  if (input.departures > 0) parts.push(pluralize(input.departures, "saída", "saídas"));
  if (input.overdueCount > 0) {
    parts.push(`${pluralize(input.overdueCount, "cobrança vencida", "cobranças vencidas")} (${formatCurrency(input.overdueAmount)})`);
  }
  if (parts.length === 0) return null;

  // Cobrança vencida sozinha leva para o Painel, onde ela aparece em "Precisa de atenção".
  return { title: "Bangalôs · hoje", body: parts.join(" · "), url: "/" };
}

export const TEST_MESSAGE = {
  title: "Bangalôs",
  body: "Tudo certo: as notificações estão funcionando neste aparelho.",
  url: "/configuracoes",
};
