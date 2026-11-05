import { addDays, daysBetween, formatDate, formatShortDate, type IsoDate } from "@/lib/dates";
import { formatCurrency, formatDecimal, pluralize } from "@/lib/format";

/** Dias de validade oferecidos ao criar o orçamento (o primeiro é o padrão). */
export const VALIDITY_OPTIONS = [7, 3, 15, 30] as const;
export const DEFAULT_VALIDITY_DAYS = VALIDITY_OPTIONS[0];

// `type` (e não interface) para caber no jsonb do banco.
export type QuoteLine = { description: string; amount: number; pending?: boolean };

/** Linha de taxa do cálculo (mesma forma que a reserva usa). */
export interface QuoteChargeInput {
  description: string;
  mode: string;
  quantity: number;
  unitAmount: number;
  total: number;
}

/** "Limpeza", "Pet (2 × R$ 30,00)", "Energia elétrica (calculada na saída)". */
export function chargeLineLabel(charge: QuoteChargeInput): string {
  if (charge.mode === "metered") return `${charge.description} (calculada na saída)`;
  if (charge.quantity !== 1) {
    return `${charge.description} (${formatDecimal(charge.quantity)} × ${formatCurrency(charge.unitAmount)})`;
  }
  return charge.description;
}

/** Linhas do orçamento: hospedagem + taxas aplicadas. O que o hóspede vê é exatamente isto. */
export function buildQuoteLines(input: {
  nights: number;
  nightlyRate: number;
  discount: number;
  lodging: number;
  charges: QuoteChargeInput[];
}): QuoteLine[] {
  const lodgingLabel =
    `Hospedagem: ${pluralize(input.nights, "noite", "noites")} × ${formatCurrency(input.nightlyRate)}` +
    (input.discount > 0 ? ` − desconto ${formatCurrency(input.discount)}` : "");
  return [
    { description: lodgingLabel, amount: input.lodging },
    // Taxa medida (energia) ainda não tem valor: não entra no total, só aparece como aviso.
    ...input.charges.map((charge) => ({
      description: chargeLineLabel(charge),
      amount: charge.total,
      // Taxa medida (energia): o valor sai na saída, então aparece como “a calcular”.
      ...(charge.mode === "metered" ? { pending: true } : {}),
    })),
  ];
}

export function validUntilFrom(today: IsoDate, days: number): IsoDate {
  return addDays(today, days);
}

/** Lê o jsonb `lines` do banco com segurança. */
export function parseQuoteLines(value: unknown): QuoteLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { description, amount, pending } = item as Record<string, unknown>;
    if (typeof description !== "string" || typeof amount !== "number") return [];
    // Orçamentos antigos não tinham a marca; a frase da taxa medida a revela.
    const isPending = pending === true || (amount === 0 && description.endsWith("(calculada na saída)"));
    return [isPending ? { description, amount, pending: true } : { description, amount }];
  });
}

/** Tudo o que a tela, o PDF e a mensagem do orçamento mostram, já em texto. */
export interface QuoteDocument {
  number: string;
  issuer: string;
  issuerPhone: string | null;
  issuedAt: string;
  validUntil: string;
  expired: boolean;
  guestName: string;
  chaletName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  stay: string;
  people: string;
  items: QuoteLine[];
  total: number;
  /** Sinal sugerido para garantir a reserva (0 = não pedir sinal). */
  deposit: number;
  notes: string | null;
  pixKey: string | null;
}

export interface QuoteDocumentInput {
  quote: {
    id: string;
    guest_name: string;
    check_in: IsoDate;
    check_out: IsoDate;
    adults: number;
    children: number;
    lines: unknown;
    total: number;
    deposit_amount: number;
    notes: string | null;
    valid_until: IsoDate;
    created_at: string;
  };
  chalet: { name: string; check_in_time: string; check_out_time: string };
  issuer: string;
  issuerPhone: string | null;
  pixKey: string | null;
  today: IsoDate;
}

export function buildQuoteDocument({ quote, chalet, issuer, issuerPhone, pixKey, today }: QuoteDocumentInput): QuoteDocument {
  const nights = Math.max(daysBetween(quote.check_in, quote.check_out), 0);
  return {
    number: quote.id.slice(0, 8).toUpperCase(),
    issuer,
    issuerPhone,
    issuedAt: formatDate(quote.created_at.slice(0, 10)),
    validUntil: formatDate(quote.valid_until),
    expired: quote.valid_until < today,
    guestName: quote.guest_name,
    chaletName: chalet.name,
    checkIn: `${formatDate(quote.check_in)} às ${chalet.check_in_time.slice(0, 5)}`,
    checkOut: `${formatDate(quote.check_out)} às ${chalet.check_out_time.slice(0, 5)}`,
    nights,
    stay:
      `${chalet.name} · entrada ${formatShortDate(quote.check_in)} às ${chalet.check_in_time.slice(0, 5)}` +
      ` · saída ${formatShortDate(quote.check_out)} às ${chalet.check_out_time.slice(0, 5)} · ${pluralize(nights, "noite", "noites")}`,
    people: pluralize(quote.adults + quote.children, "pessoa", "pessoas"),
    items: parseQuoteLines(quote.lines),
    total: quote.total,
    deposit: quote.deposit_amount,
    notes: quote.notes,
    pixKey,
  };
}

/** Nome do arquivo: orcamento-A1B2C3D4-maria-souza.pdf */
export function quoteFileName(doc: Pick<QuoteDocument, "number" | "guestName">): string {
  const slug = doc.guestName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return `orcamento-${doc.number}${slug ? `-${slug}` : ""}.pdf`;
}

/** Mensagem pronta para o WhatsApp. */
export function quoteMessage(doc: QuoteDocument): string {
  const firstName = doc.guestName.trim().split(/\s+/)[0] || doc.guestName;
  const message = [
    `Olá, ${firstName}! Segue o orçamento da sua hospedagem no ${doc.chaletName} 🏡`,
    "",
    `📅 ${doc.stay.replace(`${doc.chaletName} · `, "")}`,
    `👥 ${doc.people}`,
    `💰 Total: ${formatCurrency(doc.total)}`,
    ...(doc.deposit > 0 ? [`✅ Sinal para garantir a reserva: ${formatCurrency(doc.deposit)}`] : []),
    `⏳ Válido até ${doc.validUntil}`,
    "",
    `Para reservar é só me avisar. ${doc.issuer}`,
  ].join("\n");
  // O toLocaleString do real usa espaço não separável (U+00A0); no link ele vira %C2%A0.
  return message.replace(/ /g, " ");
}
