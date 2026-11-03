import { Wallet } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Financeiro" };

export default function FinancePage() {
  return (
    <ComingSoon
      title="Financeiro"
      icon={<Wallet />}
      description="Previsto, recebido e a receber por mês, com taxas de limpeza e energia."
      milestone="parte 4"
    />
  );
}
