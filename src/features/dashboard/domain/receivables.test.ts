import { describe, expect, it } from "vitest";

import {
  buildReceivableDetails,
  groupReceivables,
  isReceivableFilter,
  receivableMessage,
  summarizeReceivables,
} from "./receivables";
import type { StayRow } from "./types";

const stay = (id: string, checkIn: string, balance: number): StayRow => ({
  reservation_id: id,
  chalet_id: "c1",
  chalet_name: "Bangalô Asahi",
  main_guest_name: "Maria Souza",
  check_in: checkIn,
  check_out: "2026-12-30",
  nights: 2,
  guests_count: 2,
  status: "confirmed",
  grand_total: 1000,
  paid_total: 1000 - balance,
  balance_due: balance,
  payment_status: "partial",
});

const today = "2026-11-25";
const open = [stay("a", "2026-11-20", 620), stay("b", "2026-11-25", 450), stay("c", "2026-12-12", 870)];

describe("tela A receber", () => {
  const items = buildReceivableDetails(open, today, new Map(), new Map([["a", "(21) 99876-1234"]]));

  it("classifica pelo vencimento e traz telefone e valores da estadia", () => {
    expect(items.map((item) => [item.reservationId, item.dueStatus])).toEqual([
      ["a", "overdue"],
      ["b", "today"],
      ["c", "upcoming"],
    ]);
    expect(items[0]?.phone).toBe("(21) 99876-1234");
    expect(items[1]?.phone).toBeNull();
    expect(items[0]?.paid).toBe(380);
  });

  it("soma o total e por situação", () => {
    const summary = summarizeReceivables(items);
    expect(summary.total).toBe(1940);
    expect(summary.byStatus.overdue).toEqual({ total: 620, count: 1 });
    expect(summary.byStatus.upcoming.count).toBe(1);
  });

  it("agrupa na ordem vencidas, hoje, próximas e respeita o filtro", () => {
    expect(groupReceivables(items).map((group) => group.status)).toEqual(["overdue", "today", "upcoming"]);
    expect(groupReceivables(items, "today").map((group) => group.total)).toEqual([450]);
    expect(groupReceivables([], "all")).toEqual([]);
  });

  it("valida o filtro da URL", () => {
    expect(isReceivableFilter("overdue")).toBe(true);
    expect(isReceivableFilter("toString")).toBe(false);
    expect(isReceivableFilter(undefined)).toBe(false);
  });

  it("mensagem de cobrança com valor, vencimento e Pix", () => {
    const text = receivableMessage({ item: items[0]!, businessName: "Bangalôs Guaratiba", pixKey: "chave@exemplo.com" });
    expect(text).toContain("Olá, Maria!");
    expect(text).toMatch(/Valor em aberto: R\$ 620,00 \(venceu 20\/11\)/);
    expect(text).toContain("Chave Pix: chave@exemplo.com");
    expect(text).not.toContain(" ");
    expect(receivableMessage({ item: items[0]!, businessName: "X", pixKey: null })).not.toContain("Pix");
  });
});
