import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { CardSection } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { listChalets } from "@/features/chalets";
import { CommissionList, listPaidCommissions, listPendingCommissions, totalCommissions } from "@/features/commissions";
import { expensesByCategory, ExpenseList, listMonthExpenses, totalExpenses } from "@/features/expenses";
import { endOfMonth, MonthNav, monthParam, parseMonthParam } from "@/features/finance";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Despesas" };

interface ExpensesPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const { mes } = await searchParams;
  const month = parseMonthParam(mes, todayIso());
  const [expenses, chalets, paidCommissions, pendingCommissions] = await Promise.all([
    listMonthExpenses(month),
    listChalets(),
    listPaidCommissions(month, endOfMonth(month)),
    listPendingCommissions(),
  ]);
  const chaletNames = Object.fromEntries(chalets.map((chalet) => [chalet.id, chalet.name]));
  const commissionsTotal = totalCommissions(paidCommissions);
  // Comissões pagas no mês entram no total como mais uma linha do resumo.
  const byCategory = [
    ...expensesByCategory(expenses).map(({ category, label, total }) => ({ key: category, label, total })),
    ...(commissionsTotal > 0 ? [{ key: "commissions", label: "Comissões de corretor", total: commissionsTotal }] : []),
  ].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  const monthTotal = totalExpenses([...expenses, { amount: commissionsTotal }]);

  return (
    <>
      <PageHeader
        title="Despesas"
        description="O lucro do mês no Financeiro é o recebido menos estas despesas e as comissões pagas."
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
        {byCategory.length > 0 ? (
          <CardSection title="Resumo do mês" titleId="expenses-summary">
            <p className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">Total de despesas</span>
              <Money value={monthTotal} className="font-display text-2xl font-semibold" />
            </p>
            <ul className="divide-y divide-line">
              {byCategory.map((row) => (
                <li key={row.key} className="flex items-center justify-between py-2 text-sm">
                  <span>{row.label}</span>
                  <Money value={row.total} className="font-semibold" />
                </li>
              ))}
            </ul>
          </CardSection>
        ) : null}
        <CommissionList
          title="Comissões a pagar"
          titleId="commissions-pending"
          rows={pendingCommissions}
          kind="pending"
          description="Entram nas despesas do mês em que forem pagas."
        />
        <CommissionList title="Comissões pagas no mês" titleId="commissions-paid" rows={paidCommissions} kind="paid" />
        <ExpenseList expenses={expenses} chaletNames={chaletNames} />
      </PageBody>
    </>
  );
}
