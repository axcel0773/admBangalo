import { describe, expect, it } from "vitest";

import { confirmationMessage, type ConfirmationInput } from "./messages";

const base: ConfirmationInput = {
  guestName: "Maria Souza",
  chaletName: "Chalé Ipê",
  businessName: "Chalés da Serra",
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
        "Olá, Maria! Sua reserva no Chalé Ipê está confirmada ✅",
        "",
        "📅 Entrada: quinta-feira, 10/12, a partir das 14:00",
        "📅 Saída: domingo, 13/12, até 12:00",
        "👥 3 pessoas · 3 noites",
        "💰 Total: R$ 1.284,50 · pago R$ 600,00 · falta R$ 684,50",
        "",
        "Qualquer dúvida, é só chamar. Chalés da Serra",
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
