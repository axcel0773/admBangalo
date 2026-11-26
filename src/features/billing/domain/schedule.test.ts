import { describe, expect, it } from "vitest";

import { isOwnReceiptPath, receiptPath, receiptProblem } from "./receipts";
import {
  allocatePayments,
  balanceDueDate,
  isSplitCount,
  nextInstallment,
  scheduleGapFixes,
  splitPlan,
  unscheduledAmount,
} from "./schedule";

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

});

describe("dividir o total em parcelas", () => {
  const sum = (items: { amount: number }[]) => Math.round(items.reduce((total, item) => total + item.amount * 100, 0)) / 100;

  it("valores redondos: a sobra fica no sinal", () => {
    const plan = splitPlan({ total: 1250, count: 3, checkIn: "2026-12-12", today: "2026-11-25", wholeReais: true });
    expect(plan.map((item) => item.amount)).toEqual([418, 416, 416]);
    expect(sum(plan)).toBe(1250);
  });

  it("até o centavo: os centavos que sobram vão para as primeiras", () => {
    const plan = splitPlan({ total: 1250, count: 3, checkIn: "2026-12-12", today: "2026-11-25", wholeReais: false });
    expect(plan.map((item) => item.amount)).toEqual([416.67, 416.67, 416.66]);
    expect(sum(plan)).toBe(1250);
    expect(splitPlan({ total: 1000, count: 3, checkIn: "2026-12-12", today: TODAY, wholeReais: false }).map((i) => i.amount)).toEqual([
      333.34, 333.33, 333.33,
    ]);
  });

  it("total com centavos e redondos: só o sinal leva os centavos", () => {
    const plan = splitPlan({ total: 1364.5, count: 2, checkIn: "2026-12-20", today: TODAY, wholeReais: true });
    expect(plan.map((item) => item.amount)).toEqual([682.5, 682]);
    expect(sum(plan)).toBe(1364.5);
  });

  it("2x equivale ao antigo sinal de 50% + saldo no check-in", () => {
    expect(splitPlan({ total: 1364.5, count: 2, checkIn: "2026-12-20", today: TODAY, wholeReais: false })).toEqual([
      { description: "Sinal", amount: 682.25, due_date: TODAY },
      { description: "Saldo no check-in", amount: 682.25, due_date: "2026-12-20" },
    ]);
  });

  it("sinal hoje, saldo no check-in e as do meio espaçadas", () => {
    const plan = splitPlan({ total: 1200, count: 4, checkIn: "2026-11-19", today: TODAY, wholeReais: true });
    expect(plan.map((item) => [item.description, item.due_date])).toEqual([
      ["Sinal", "2026-11-10"],
      ["Parcela 2", "2026-11-13"],
      ["Parcela 3", "2026-11-16"],
      ["Saldo no check-in", "2026-11-19"],
    ]);
  });

  it("check-in já passou: tudo vence hoje; parcela zerada some", () => {
    const plan = splitPlan({ total: 2, count: 3, checkIn: "2026-11-01", today: TODAY, wholeReais: true });
    expect(plan).toEqual([{ description: "Sinal", amount: 2, due_date: TODAY }]);
  });

  it("aceita só 2, 3 ou 4 vezes", () => {
    expect([1, 2, 3, 4, 5].filter(isSplitCount)).toEqual([2, 3, 4]);
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

describe("parcelas: centavos, sinal já pago e consertos", () => {
  it("diferença de centavos não deixa a parcela vencida", () => {
    const reveillon = [
      { id: "s", description: "Sinal 50%", amount: 3500.01, due_date: "2026-11-05" },
      { id: "f", description: "Saldo no check-in", amount: 3500.01, due_date: "2026-12-27" },
    ];
    const progress = allocatePayments(reveillon, 3500, TODAY);
    expect(progress[0]?.status).toBe("paid");
    expect(nextInstallment(progress)?.id).toBe("f");
  });

  it("parcela sem nenhum pagamento continua vencida, mesmo pequena", () => {
    const tiny = [{ id: "t", description: "Taxa", amount: 0.5, due_date: "2026-11-01" }];
    expect(allocatePayments(tiny, 0, TODAY)[0]?.status).toBe("overdue");
  });

  it("divide só o que falta quando já houve pagamento", () => {
    const plan = splitPlan({
      total: 5500,
      count: 2,
      checkIn: "2027-02-04",
      today: TODAY,
      wholeReais: true,
      paid: 1500,
      paidOn: "2026-11-09",
    });
    expect(plan.map((item) => [item.description, item.amount])).toEqual([
      ["Sinal (pago)", 1500],
      ["Parcela 2", 2000],
      ["Saldo no check-in", 2000],
    ]);
    expect(plan[0]?.due_date).toBe("2026-11-09");
    expect(plan[2]?.due_date).toBe("2027-02-04");
    expect((plan[1]?.due_date ?? "") > TODAY).toBe(true);
  });

  it("sugere transformar o sinal pago em parcela quando faltam parcelas", () => {
    const carnaval = [{ id: "p2", description: "2", amount: 4000, due_date: "2027-02-04" }];
    const fixes = scheduleGapFixes({ items: carnaval, total: 5500, paid: 1500 });
    expect(fixes.map((fix) => fix.kind)).toEqual(["paid_deposit", "adjust_last", "new_installment"]);
    expect(fixes[1]).toMatchObject({ installmentId: "p2", newAmount: 5500 });
  });

  it("parcelas acima do total: só oferece tirar da última", () => {
    expect(scheduleGapFixes({ items, total: 1300, paid: 0 })).toEqual([
      { kind: "adjust_last", amount: -100, installmentId: "b", newAmount: 600 },
    ]);
    expect(scheduleGapFixes({ items, total: 1400, paid: 0 })).toEqual([]);
  });
});
