import { formatShortDate, type IsoDate } from "@/lib/dates";
import { formatCurrency, formatDecimal, pluralize } from "@/lib/format";

import { PAYMENT_KIND_LABELS, PAYMENT_METHOD_LABELS, type PaymentKind, type PaymentMethod } from "./payments";

/** Tudo o que o recibo mostra, já em texto. A tela e o PDF leem daqui, então saem iguais. */
export interface ReceiptData {
  number: string;
  issuer: string;
  issuerPhone: string | null;
  issuedAt: string;
  guestName: string;
  guestDocument: string | null;
  stay: string;
  people: string;
  items: { description: string; amount: number }[];
  total: number;
  payments: { paidAt: IsoDate; kindLabel: string; methodLabel: string; label: string; amount: number; refund: boolean }[];
  paid: number;
  balance: number;
}

export interface ReceiptInput {
  reservationId: string;
  issuer: string;
  issuerPhone: string | null;
  today: IsoDate;
  guest: { full_name: string; document: string | null };
  guestNames: string[];
  chalet: { name: string; check_in_time: string; check_out_time: string };
  reservation: {
    check_in: IsoDate;
    check_out: IsoDate;
    nights: number;
    nightly_rate: number;
    discount: number;
    lodging_total: number;
    adults: number;
    children: number;
  };
  charges: {
    description: string;
    mode: string;
    quantity: number;
    unit_amount: number;
    total: number;
  }[];
  payments: { paid_at: IsoDate; kind: PaymentKind; method: PaymentMethod; amount: number }[];
  grandTotal: number;
  paid: number;
  balanceDue: number;
}

/** "Energia elétrica (12,5 kWh × R$ 1,00)", "Limpeza", "Pet (2 × R$ 30,00)". */
export function chargeLabel(charge: ReceiptInput["charges"][number]): string {
  if (charge.mode === "metered") {
    return `${charge.description} (${formatDecimal(charge.quantity)} kWh × ${formatCurrency(charge.unit_amount)})`;
  }
  if (charge.quantity !== 1) {
    return `${charge.description} (${formatDecimal(charge.quantity)} × ${formatCurrency(charge.unit_amount)})`;
  }
  return charge.description;
}

export function buildReceiptData(input: ReceiptInput): ReceiptData {
  const { reservation, chalet } = input;
  const lodging =
    `Hospedagem: ${pluralize(reservation.nights, "noite", "noites")} × ${formatCurrency(reservation.nightly_rate)}` +
    (reservation.discount > 0 ? ` − desconto ${formatCurrency(reservation.discount)}` : "");

  return {
    number: input.reservationId.slice(0, 8).toUpperCase(),
    issuer: input.issuer,
    issuerPhone: input.issuerPhone,
    issuedAt: formatShortDate(input.today),
    guestName: input.guest.full_name,
    guestDocument: input.guest.document,
    stay:
      `${chalet.name} · entrada ${formatShortDate(reservation.check_in)} às ${chalet.check_in_time.slice(0, 5)}` +
      ` · saída ${formatShortDate(reservation.check_out)} às ${chalet.check_out_time.slice(0, 5)}`,
    people:
      input.guestNames.join(", ") || pluralize(reservation.adults + reservation.children, "pessoa", "pessoas"),
    items: [
      { description: lodging, amount: reservation.lodging_total },
      ...input.charges.map((charge) => ({ description: chargeLabel(charge), amount: charge.total })),
    ],
    total: input.grandTotal,
    payments: input.payments.map((payment) => ({
      paidAt: payment.paid_at,
      kindLabel: PAYMENT_KIND_LABELS[payment.kind],
      methodLabel: PAYMENT_METHOD_LABELS[payment.method],
      label: `${formatShortDate(payment.paid_at)} · ${PAYMENT_KIND_LABELS[payment.kind]} · ${PAYMENT_METHOD_LABELS[payment.method]}`,
      amount: payment.amount,
      refund: payment.kind === "refund",
    })),
    paid: input.paid,
    balance: Math.max(input.balanceDue, 0),
  };
}

/** Nome do arquivo: recibo-A1B2C3D4-maria-souza.pdf */
export function receiptFileName(data: Pick<ReceiptData, "number" | "guestName">): string {
  const slug = data.guestName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return `recibo-${data.number}${slug ? `-${slug}` : ""}.pdf`;
}
