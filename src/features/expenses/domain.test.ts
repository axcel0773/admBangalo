import { describe, expect, it } from "vitest";

import { expensesByCategory, isExpenseCategory, monthProfit, totalExpenses } from "./domain";

describe("despesas", () => {
  const list = [
    { amount: 120.5, category: "energy" as const },
    { amount: 300, category: "maintenance" as const },
    { amount: 79.5, category: "energy" as const },
  ];

  it("soma em centavos", () => {
    expect(totalExpenses(list)).toBe(500);
    expect(totalExpenses([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
    expect(totalExpenses([])).toBe(0);
  });

  it("agrupa por categoria, da maior para a menor", () => {
    expect(expensesByCategory(list)).toEqual([
      { category: "maintenance", label: "Manutenção", total: 300 },
      { category: "energy", label: "Energia", total: 200 },
    ]);
    expect(expensesByCategory([])).toEqual([]);
  });

  it("lucro de caixa pode ser negativo", () => {
    expect(monthProfit(1000, 400)).toBe(600);
    expect(monthProfit(100, 250.5)).toBe(-150.5);
  });

  it("valida a categoria", () => {
    expect(isExpenseCategory("energy")).toBe(true);
    expect(isExpenseCategory("toString")).toBe(false);
    expect(isExpenseCategory("")).toBe(false);
  });
});
