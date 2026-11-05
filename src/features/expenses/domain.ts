import { roundMoney } from "@/features/reservations/domain";
import type { Tables } from "@/types/database";

export type Expense = Tables<"expenses">;
export type ExpenseCategory = Expense["category"];

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  energy: "Energia",
  cleaning: "Limpeza",
  maintenance: "Manutenção",
  supplies: "Compras e insumos",
  taxes: "Impostos e taxas",
  other: "Outras",
};

export const EXPENSE_CATEGORY_OPTIONS = (Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((value) => ({
  value,
  label: EXPENSE_CATEGORIES[value],
}));

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return Object.hasOwn(EXPENSE_CATEGORIES, value);
}

export function totalExpenses(expenses: Pick<Expense, "amount">[]): number {
  return roundMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0));
}

export interface CategoryTotal {
  category: ExpenseCategory;
  label: string;
  total: number;
}

/** Total por categoria, da maior para a menor; categorias sem gasto não aparecem. */
export function expensesByCategory(expenses: Pick<Expense, "amount" | "category">[]): CategoryTotal[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const expense of expenses) totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  return [...totals.entries()]
    .map(([category, total]) => ({ category, label: EXPENSE_CATEGORIES[category], total: roundMoney(total) }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

/** Lucro de caixa do mês: o que entrou (pagamentos − estornos) menos o que saiu. Pode ser negativo. */
export function monthProfit(cashIn: number, expenses: number): number {
  return roundMoney(cashIn - expenses);
}
