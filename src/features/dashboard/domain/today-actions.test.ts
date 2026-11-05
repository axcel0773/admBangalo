import { describe, expect, it } from "vitest";

import { buildTodayActions } from "./today-actions";
import type { QuoteRow, Receivable, StayRow } from "./types";

const TODAY = "2026-11-05";

const stay = (over: Partial<StayRow> = {}): StayRow => ({
  reservation_id: "r1",
  chalet_id: "c1",
  chalet_name: "Bangalô Ipê",
  main_guest_name: "Maria Souza",
  check_in: "2026-11-06",
  check_out: "2026-11-08",
  nights: 2,
  guests_count: 2,
  status: "pending",
  grand_total: 800,
  paid_total: 0,
  balance_due: 800,
  payment_status: "unpaid",
  ...over,
});

const receivable = (over: Partial<Receivable> = {}): Receivable => ({
  reservationId: "r9",
  guestName: "João Lima",
  chaletName: "Bangalô Jabuticaba",
  amount: 500,
  dueDate: "2026-11-01",
  dueStatus: "overdue",
  ...over,
});

const quote = (over: Partial<QuoteRow> = {}): QuoteRow => ({ id: "q1", guest_name: "Ana Dias", valid_until: "2026-11-06", ...over });

const run = (over: Partial<Parameters<typeof buildTodayActions>[0]> = {}) =>
  buildTodayActions({ today: TODAY, receivables: [], stays: [], quotes: [], ...over });

describe("ações de hoje", () => {
  it("sem nada pendente, lista vazia", () => {
    expect(run()).toEqual([]);
  });

  it("saldo vencido é urgente; vence hoje é aviso; futuro não entra", () => {
    const actions = run({
      receivables: [
        receivable({ reservationId: "a", dueStatus: "today", dueDate: TODAY }),
        receivable({ reservationId: "b" }),
        receivable({ reservationId: "c", dueStatus: "upcoming", dueDate: "2026-11-20" }),
      ],
    });
    expect(actions.map((a) => [a.id, a.severity])).toEqual([
      ["balance-b", "danger"],
      ["balance-a", "warning"],
    ]);
    expect(actions[0]?.title).toBe("Saldo vencido · João Lima");
  });

  it("chegada em até 2 dias sem nenhum pagamento entra; com pagamento ou muito distante, não", () => {
    const actions = run({
      stays: [
        stay({ reservation_id: "hoje", check_in: TODAY }),
        stay({ reservation_id: "amanha" }),
        stay({ reservation_id: "pago", paid_total: 100 }),
        stay({ reservation_id: "longe", check_in: "2026-11-09" }),
        stay({ reservation_id: "passada", check_in: "2026-11-04" }),
      ],
    });
    expect(actions.map((a) => a.id)).toEqual(["unpaid-hoje", "unpaid-amanha"]);
    expect(actions[0]?.title).toContain("Chega hoje sem pagamento");
    expect(actions[1]?.title).toContain("Chega amanhã sem pagamento");
  });

  it("a mesma reserva não aparece duas vezes: saldo vencido vence", () => {
    const actions = run({
      receivables: [receivable({ reservationId: "r1" })],
      stays: [stay({ reservation_id: "r1" }), stay({ reservation_id: "r1" })],
    });
    expect(actions.map((a) => a.id)).toEqual(["balance-r1"]);
  });

  it("orçamento a vencer em até 2 dias; vencido ou distante não", () => {
    const actions = run({
      quotes: [
        quote({ id: "hoje", valid_until: TODAY }),
        quote({ id: "dois", valid_until: "2026-11-07" }),
        quote({ id: "tres", valid_until: "2026-11-08" }),
        quote({ id: "ontem", valid_until: "2026-11-04" }),
      ],
    });
    expect(actions.map((a) => a.id)).toEqual(["quote-hoje", "quote-dois"]);
    expect(actions[0]?.title).toContain("vence hoje");
    expect(actions[0]?.target).toEqual({ kind: "quote", id: "hoje" });
  });

  it("ordena por urgência, depois por data, e respeita o limite", () => {
    const actions = run({
      receivables: [receivable({ reservationId: "x" })],
      stays: [stay({ reservation_id: "y" })],
      quotes: [quote()],
      limit: 2,
    });
    expect(actions.map((a) => a.type)).toEqual(["overdue-balance", "arrival-unpaid"]);
  });

  it("estadia cancelada não gera ação", () => {
    expect(run({ stays: [stay({ status: "cancelled" })] })).toEqual([]);
  });
});
