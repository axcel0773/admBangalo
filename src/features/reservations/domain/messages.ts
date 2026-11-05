import { formatLongDate, formatShortDate, todayIso, type IsoDate } from "@/lib/dates";

import type { ReservationStatus } from "./types";

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export interface ConfirmationInput {
  guestName: string;
  chaletName: string;
  businessName: string;
  status: ReservationStatus;
  checkIn: IsoDate;
  checkOut: IsoDate;
  /** "14:00:00" */
  checkInTime: string;
  checkOutTime: string;
  guests: number;
  nights: number;
  total: number;
  paid: number;
}

/** Mensagem pronta para o WhatsApp: dados da estadia e situação do pagamento. */
export function confirmationMessage(input: ConfirmationInput): string {
  const firstName = input.guestName.trim().split(/\s+/)[0] || input.guestName;
  const balance = Math.max(Math.round((input.total - input.paid) * 100) / 100, 0);
  const day = (date: IsoDate) => `${formatLongDate(date).split(",")[0]}, ${formatShortDate(date)}`;

  const opening =
    input.status === "pending"
      ? `Olá, ${firstName}! Recebemos seu pedido de reserva no ${input.chaletName}. Ela fica confirmada após o sinal.`
      : `Olá, ${firstName}! Sua reserva no ${input.chaletName} está confirmada ✅`;

  const payment =
    input.paid <= 0
      ? `💰 Total: ${brl(input.total)}`
      : balance > 0
        ? `💰 Total: ${brl(input.total)} · pago ${brl(input.paid)} · falta ${brl(balance)}`
        : `💰 Total: ${brl(input.total)} · tudo pago, obrigado!`;

  const message = [
    opening,
    "",
    `📅 Entrada: ${day(input.checkIn)}, a partir das ${input.checkInTime.slice(0, 5)}`,
    `📅 Saída: ${day(input.checkOut)}, até ${input.checkOutTime.slice(0, 5)}`,
    `👥 ${plural(input.guests, "pessoa", "pessoas")} · ${plural(input.nights, "noite", "noites")}`,
    payment,
    "",
    `Qualquer dúvida, é só chamar. ${input.businessName}`,
  ].join("\n");

  // O toLocaleString do real usa espaço não separável (U+00A0); no link ele vira %C2%A0 e alguns apps estranham.
  return message.replace(/\u00A0/g, " ");
}

export interface ReceiptPayment {
  paidAt: IsoDate;
  /** "Sinal", "Saldo"… */
  kindLabel: string;
  /** "Pix", "Dinheiro"… */
  methodLabel: string;
  amount: number;
  refund: boolean;
}

export interface ReceiptInput {
  guestName: string;
  chaletName: string;
  issuer: string;
  /** Número do recibo, o mesmo da página. */
  number: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  total: number;
  paid: number;
  payments: ReceiptPayment[];
}

/** Resumo do recibo para o WhatsApp (a página do recibo é privada, então vai o conteúdo, não o link). */
export function receiptMessage(input: ReceiptInput): string {
  const firstName = input.guestName.trim().split(/\s+/)[0] || input.guestName;
  const balance = Math.max(Math.round((input.total - input.paid) * 100) / 100, 0);

  const payments = input.payments.map(
    (payment) =>
      `• ${formatShortDate(payment.paidAt)} · ${payment.kindLabel} · ${payment.methodLabel}: ${payment.refund ? "−" : ""}${brl(payment.amount)}`,
  );

  const message = [
    `🧾 Recibo nº ${input.number}`,
    `Olá, ${firstName}! Segue o recibo da sua hospedagem no ${input.chaletName}.`,
    "",
    `📅 ${formatShortDate(input.checkIn)} a ${formatShortDate(input.checkOut)}`,
    `💰 Total: ${brl(input.total)}`,
    ...(payments.length > 0 ? ["", "Pagamentos:", ...payments] : []),
    "",
    `✅ Total pago: ${brl(Math.max(input.paid, 0))}`,
    balance > 0 ? `⏳ Saldo a pagar: ${brl(balance)}` : "Tudo quitado, obrigado!",
    "",
    input.issuer,
  ].join("\n");

  return message.replace(/\u00A0/g, " ");
}

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;
const noNbsp = (text: string) => text.replace(/\u00A0/g, " ");

/** Lembrete antes da chegada: dia, horário e valor ainda em aberto. */
export function arrivalReminderMessage(input: ConfirmationInput): string {
  const firstName = firstNameOf(input.guestName);
  const balance = Math.max(Math.round((input.total - input.paid) * 100) / 100, 0);
  const day = `${formatLongDate(input.checkIn).split(",")[0]}, ${formatShortDate(input.checkIn)}`;

  return noNbsp(
    [
      `Olá, ${firstName}! Está chegando a sua estadia no ${input.chaletName} 🌴`,
      "",
      `📅 Chegada: ${day}, a partir das ${input.checkInTime.slice(0, 5)}`,
      `📅 Saída: ${formatShortDate(input.checkOut)}, até ${input.checkOutTime.slice(0, 5)}`,
      ...(balance > 0 ? [`💰 Saldo a acertar: ${brl(balance)}`] : []),
      "",
      `Qualquer dúvida sobre como chegar, é só chamar. Te esperamos! ${input.businessName}`,
    ].join("\n"),
  );
}

/** Cobrança educada do saldo pendente. */
export function balanceReminderMessage(input: ConfirmationInput): string {
  const firstName = firstNameOf(input.guestName);
  const balance = Math.max(Math.round((input.total - input.paid) * 100) / 100, 0);

  return noNbsp(
    [
      `Olá, ${firstName}! Tudo bem? Passando para lembrar do saldo da sua reserva no ${input.chaletName}.`,
      "",
      `💰 Total: ${brl(input.total)} · pago ${brl(Math.max(input.paid, 0))} · falta ${brl(balance)}`,
      `📅 Estadia: ${formatShortDate(input.checkIn)} a ${formatShortDate(input.checkOut)}`,
      "",
      `Se já pagou, desconsidere e me avise para eu conferir. Obrigado! ${input.businessName}`,
    ].join("\n"),
  );
}

/** Agradecimento depois da saída. */
export function thanksMessage(input: ConfirmationInput): string {
  const firstName = firstNameOf(input.guestName);

  return noNbsp(
    [
      `Olá, ${firstName}! Obrigado por se hospedar no ${input.chaletName} 💙`,
      "",
      "Esperamos que tenha sido uma estadia incrível. Se puder, conte para nós como foi — sua opinião ajuda muito!",
      "",
      `Quando quiser voltar, é só chamar. ${input.businessName}`,
    ].join("\n"),
  );
}

export type ReminderKind = "arrival" | "balance" | "thanks";

export interface Reminder {
  kind: ReminderKind;
  label: string;
  message: string;
}

/**
 * Lembretes que fazem sentido para a reserva hoje:
 * chegada (ainda não começou), saldo (falta pagar) e agradecimento (já saiu).
 * Reservas canceladas não têm lembretes.
 */
export function availableReminders(input: ConfirmationInput, today: IsoDate = todayIso()): Reminder[] {
  if (input.status === "cancelled") return [];
  const reminders: Reminder[] = [];
  const balance = Math.round((input.total - input.paid) * 100) / 100;

  if (input.status === "confirmed" && input.checkIn >= today) {
    reminders.push({ kind: "arrival", label: "Lembrar da chegada", message: arrivalReminderMessage(input) });
  }
  if (balance > 0) {
    reminders.push({ kind: "balance", label: "Cobrar saldo", message: balanceReminderMessage(input) });
  }
  if (input.checkOut <= today) {
    reminders.push({ kind: "thanks", label: "Agradecer", message: thanksMessage(input) });
  }
  return reminders;
}
