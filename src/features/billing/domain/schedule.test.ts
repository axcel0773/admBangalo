import { describe, expect, it } from "vitest";

import { isOwnReceiptPath, receiptPath, receiptProblem } from "./receipts";
import { allocatePayments, balanceDueDate, depositAndBalance, nextInstallment, unscheduledAmount } from "./schedule";

const TODAY = "2026-11-10";

const items = [
  { id: "b", description: "Saldo no check-in", amount: 700, due_date: "2026-12-20" },
  { id: "a", description: "Sinal 50%", amount: 700, due_date: "2026-11-05" },
];

describe("parcelas previstas", () => {
  it("distribui o pago pela ordem de vencimento", () => {
    const progress = allocatePayments(items, 900, TODAY);
    expect(progress.map((p) => [p.id, p.covered, p.remaining, p.status])).toEqual([
      ["a", 700, 0, "paid"],
      ["b", 200, 500, "partial"],
    ]);
  });

  it("marca vencida, vence hoje e a vencer", () => {
    expect(allocatePayments(items, 0, TODAY)[0]?.status).toBe("overdue");
    expect(allocatePayments(items, 0, "2026-11-05")[0]?.status).toBe("due_today");
    expect(allocatePayments(items, 700, TODAY)[1]?.status).toBe("upcoming");
  });

  it("estorno (pago negativo) não cobre nada", () => {
    expect(allocatePayments(items, -50, TODAY).every((p) => p.covered === 0)).toBe(true);
  });

  it("acha a próxima parcela e a data de vencimento do saldo", () => {
    expect(nextInstallment(allocatePayments(items, 700, TODAY))?.id).toBe("b");
    expect(balanceDueDate({ items, paid: 0, checkIn: "2026-12-20", today: TODAY })).toBe("2026-11-05");
    expect(balanceDueDate({ items: [], paid: 0, checkIn: "2026-12-20", today: TODAY })).toBe("2026-12-20");
  });

  it("aponta valor sem parcela", () => {
    expect(unscheduledAmount(items, 1500)).toBe(100);
    expect(unscheduledAmount(items, 1300)).toBe(-100);
  });

  it("sugere sinal hoje e saldo no check-in", () => {
    expect(depositAndBalance({ total: 1364.5, checkIn: "2026-12-20", today: TODAY })).toEqual([
      { description: "Sinal 50%", amount: 682.25, due_date: TODAY },
      { description: "Saldo no check-in", amount: 682.25, due_date: "2026-12-20" },
    ]);
    // check-in já passou: tudo vence hoje
    expect(depositAndBalance({ total: 100, checkIn: "2026-11-01", today: TODAY, depositPercent: 30 })[1]).toEqual({
      description: "Saldo no check-in",
      amount: 70,
      due_date: TODAY,
    });
  });
});

describe("comprovantes", () => {
  const owner = "11111111-1111-1111-1111-111111111111";
  const reservation = "cccccccc-0000-0000-0000-000000000001";

  it("monta o caminho na pasta do dono e da reserva", () => {
    expect(receiptPath({ ownerId: owner, reservationId: reservation, contentType: "image/jpeg", id: "abc-1" })).toBe(
      `${owner}/${reservation}/abc-1.jpg`,
    );
  });

  it("aceita só caminhos da própria pasta", () => {
    expect(isOwnReceiptPath(`${owner}/${reservation}/abc-1.pdf`, owner, reservation)).toBe(true);
    expect(isOwnReceiptPath(`outro/${reservation}/abc-1.pdf`, owner, reservation)).toBe(false);
    expect(isOwnReceiptPath(`${owner}/${reservation}/../x.pdf`, owner, reservation)).toBe(false);
    expect(isOwnReceiptPath(`${owner}/${reservation}/abc.exe`, owner, reservation)).toBe(false);
  });

  it("recusa tipo e tamanho fora do permitido", () => {
    expect(receiptProblem({ type: "application/pdf", size: 1000 })).toBeNull();
    expect(receiptProblem({ type: "text/plain", size: 10 })).toMatch(/foto/);
    expect(receiptProblem({ type: "image/png", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
  });
});
