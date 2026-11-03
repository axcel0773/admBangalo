import { NotebookTabs } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Reserva" };

export default function ReservationDetailPage() {
  return (
    <ComingSoon
      title="Detalhe da reserva"
      icon={<NotebookTabs />}
      description="Hóspedes, taxas, leitura do medidor de energia e pagamentos da reserva."
      milestone="parte 4"
    />
  );
}
