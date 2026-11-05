import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { CardSection } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { listChalets } from "@/features/chalets";
import { expensesByCategory, ExpenseList, listMonthExpenses, totalExpenses } from "@/features/expenses";
import { MonthNav, monthParam, parseMonthParam } from "@/features/finance";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Despesas" };

interface ExpensesPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const { mes } = await searchParams;
  const month = parseMonthParam(mes, todayIso());
  const [expenses, chalets] = await Promise.all([listMonthExpenses(month), listChalets()]);
  const chaletNames = Object.fromEntries(chalets.map((chalet) => [chalet.id, chalet.name]));
  const byCategory = expensesByCategory(expenses);

  return (
    <>
      <PageHeader
        title="Despesas"
        description="O lucro do mês no Financeiro é o recebido menos estas despesas."
        back={{ href: routes.finance, label: "Financeiro" }}
        actions={
          <ButtonLink href={routes.newExpense} size="sm">
            <Plus aria-hidden="true" />
            Lançar despesa
          </ButtonLink>
        }
      />
      <PageBody className="max-w-3xl">
        <MonthNav month={month} className="self-start" hrefFor={(target) => `${routes.expenses}?mes=${monthParam(target)}`} />
        {expenses.length > 0 ? (
          <CardSection title="Resumo do mês" titleId="expenses-summary">
            <p className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">Total de despesas</span>
              <Money value={totalExpenses(expenses)} className="font-display text-2xl font-semibold" />
            </p>
            <ul className="divide-y divide-line">
              {byCategory.map((row) => (
                <li key={row.category} className="flex items-center justify-between py-2 text-sm">
                  <span>{row.label}</span>
                  <Money value={row.total} className="font-semibold" />
                </li>
              ))}
            </ul>
          </CardSection>
        ) : null}
        <ExpenseList expenses={expenses} chaletNames={chaletNames} />
      </PageBody>
    </>
  );
}
