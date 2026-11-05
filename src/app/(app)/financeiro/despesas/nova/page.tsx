import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { listChalets } from "@/features/chalets";
import { createExpense, ExpenseForm } from "@/features/expenses";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Nova despesa" };

export default async function NewExpensePage() {
  const chalets = await listChalets();
  const chaletOptions = chalets.map((chalet) => ({ value: chalet.id, label: chalet.name }));

  return (
    <>
      <PageHeader title="Nova despesa" back={{ href: routes.expenses, label: "Despesas" }} />
      <PageBody className="max-w-3xl">
        <ExpenseForm action={createExpense} chaletOptions={chaletOptions} today={todayIso()} />
      </PageBody>
    </>
  );
}
