import { describe, expect, it } from "vitest";

import {
  arrivalReminderMessage,
  availableReminders,
  balanceReminderMessage,
  confirmationMessage,
  receiptMessage,
  thanksMessage,
  type ConfirmationInput,
  type ReceiptInput,
} from "./messages";

const base: ConfirmationInput = {
  guestName: "Maria Souza",
  chaletName: "Bangalô Ipê",
  businessName: "Bangalôs da Serra",
  status: "confirmed",
  checkIn: "2026-12-10",
  checkOut: "2026-12-13",
  checkInTime: "14:00:00",
  checkOutTime: "12:00:00",
  guests: 3,
  nights: 3,
  total: 1284.5,
  paid: 600,
};

const plain = (text: string) => text.replace(/ /g, " ");

describe("mensagem de confirmação", () => {
  it("traz datas, horários, pessoas e saldo", () => {
    expect(plain(confirmationMessage(base))).toBe(
      [
        "Olá, Maria! Sua reserva no Bangalô Ipê está confirmada ✅",
        "",
        "📅 Entrada: quinta-feira, 10/12, a partir das 14:00",
        "📅 Saída: domingo, 13/12, até 12:00",
        "👥 3 pessoas · 3 noites",
        "💰 Total: R$ 1.284,50 · pago R$ 600,00 · falta R$ 684,50",
        "",
        "Qualquer dúvida, é só chamar. Bangalôs da Serra",
      ].join("\n"),
    );
  });

  it("pendente avisa que confirma com o sinal; sem pagamento mostra só o total", () => {
    const text = plain(confirmationMessage({ ...base, status: "pending", paid: 0 }));
    expect(text).toMatch(/confirmada após o sinal/);
    expect(text).toContain("💰 Total: R$ 1.284,50\n");
  });

  it("quitada agradece; singular para 1 noite e 1 pessoa", () => {
    const text = plain(confirmationMessage({ ...base, paid: 1284.5, guests: 1, nights: 1 }));
    expect(text).toContain("tudo pago, obrigado!");
    expect(text).toContain("👥 1 pessoa · 1 noite");
  });
});

describe("mensagem do recibo", () => {
  const receipt: ReceiptInput = {
    guestName: "Maria Souza",
    chaletName: "Bangalô Ipê",
    issuer: "Bangalôs da Serra",
    number: "A1B2C3D4",
    checkIn: "2026-12-10",
    checkOut: "2026-12-13",
    total: 1284.5,
    paid: 600,
    payments: [
      { paidAt: "2026-11-01", kindLabel: "Sinal", methodLabel: "Pix", amount: 650, refund: false },
      { paidAt: "2026-11-05", kindLabel: "Estorno", methodLabel: "Pix", amount: 50, refund: true },
    ],
  };

  it("resume hospedagem, pagamentos e saldo", () => {
    expect(plain(receiptMessage(receipt))).toBe(
      [
        "🧾 Recibo nº A1B2C3D4",
        "Olá, Maria! Segue o recibo da sua hospedagem no Bangalô Ipê.",
        "",
        "📅 10/12 a 13/12",
        "💰 Total: R$ 1.284,50",
        "",
        "Pagamentos:",
        "• 01/11 · Sinal · Pix: R$ 650,00",
        "• 05/11 · Estorno · Pix: −R$ 50,00",
        "",
        "✅ Total pago: R$ 600,00",
        "⏳ Saldo a pagar: R$ 684,50",
        "",
        "Bangalôs da Serra",
      ].join("\n"),
    );
  });

  it("quitado agradece; sem pagamentos omite a lista", () => {
    const text = plain(receiptMessage({ ...receipt, paid: 1284.5, payments: [] }));
    expect(text).toContain("Tudo quitado, obrigado!");
    expect(text).not.toContain("Pagamentos:");
    expect(text).not.toContain("Saldo a pagar");
  });
});

describe("lembretes", () => {
  it("chegada traz dia, horários e saldo; sem saldo omite a linha de valor", () => {
    const text = plain(arrivalReminderMessage(base));
    expect(text).toContain("Chegada: quinta-feira, 10/12, a partir das 14:00");
    expect(text).toContain("Saída: 13/12, até 12:00");
    expect(text).toContain("Saldo a acertar: R$ 684,50");
    expect(plain(arrivalReminderMessage({ ...base, paid: 1284.5 }))).not.toContain("Saldo");
  });

  it("cobrança mostra total, pago e quanto falta", () => {
    expect(plain(balanceReminderMessage(base))).toContain("Total: R$ 1.284,50 · pago R$ 600,00 · falta R$ 684,50");
  });

  it("agradecimento usa o primeiro nome e assina com o negócio", () => {
    const text = thanksMessage(base);
    expect(text).toContain("Olá, Maria!");
    expect(text).toContain("Bangalôs da Serra");
  });

  it("antes da estadia: chegada e cobrança (há saldo)", () => {
    const kinds = availableReminders(base, "2026-12-01").map((reminder) => reminder.kind);
    expect(kinds).toEqual(["arrival", "balance"]);
  });

  it("depois da saída e quitada: só agradecimento", () => {
    const kinds = availableReminders({ ...base, paid: 1284.5 }, "2026-12-14").map((reminder) => reminder.kind);
    expect(kinds).toEqual(["thanks"]);
  });

  it("pendente não lembra a chegada; cancelada não tem lembretes", () => {
    expect(availableReminders({ ...base, status: "pending" }, "2026-12-01").map((r) => r.kind)).toEqual(["balance"]);
    expect(availableReminders({ ...base, status: "cancelled" }, "2026-12-01")).toEqual([]);
  });

  it("no dia da chegada ainda lembra; no dia da saída já agradece", () => {
    expect(availableReminders({ ...base, paid: 1284.5 }, "2026-12-10").map((r) => r.kind)).toEqual(["arrival"]);
    expect(availableReminders({ ...base, paid: 1284.5 }, "2026-12-13").map((r) => r.kind)).toEqual(["thanks"]);
  });
});
