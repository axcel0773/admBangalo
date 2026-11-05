import { Receipt, Trash2 } from "lucide-react";

import { routes } from "@/components/layout/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";
import { Money } from "@/components/ui/money";
import { formatShortDate } from "@/lib/dates";

import { deleteExpense } from "../actions";
import { EXPENSE_CATEGORIES, type Expense } from "../domain";

interface ExpenseListProps {
  expenses: Expense[];
  chaletNames: Record<string, string>;
}

export function ExpenseList({ expenses, chaletNames }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<Receipt />}
        title="Nenhuma despesa neste mês"
        description="Lance luz, limpeza, manutenção e compras para o Financeiro mostrar o lucro."
        action={<ButtonLink href={routes.newExpense}>Lançar despesa</ButtonLink>}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {expenses.map((expense) => {
        const scope = expense.chalet_id ? (chaletNames[expense.chalet_id] ?? "Bangalô removido") : "Geral";
        return (
          <li key={expense.id} className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <IconTile tone="accent">
                <Receipt />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">
                  {expense.description || EXPENSE_CATEGORIES[expense.category]}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {formatShortDate(expense.spent_on)} · {EXPENSE_CATEGORIES[expense.category]} · {scope}
                </p>
              </div>
              <Money value={expense.amount} className="text-sm font-semibold" />
            </div>
            <ActionForm action={deleteExpense.bind(null, expense.id)}>
              <ConfirmSubmit
                message="Excluir esta despesa? Não dá para desfazer."
                confirmLabel="Sim, excluir"
                pendingLabel="Excluindo…"
                triggerVariant="secondary"
                triggerSize="sm"
                block={false}
              >
                <Trash2 aria-hidden="true" />
                Excluir
              </ConfirmSubmit>
            </ActionForm>
          </li>
        );
      })}
    </ul>
  );
}
