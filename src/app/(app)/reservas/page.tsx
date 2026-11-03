import { NotebookTabs } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Reservas" };

export default function ReservationsPage() {
  return (
    <ComingSoon
      title="Reservas"
      icon={<NotebookTabs />}
      description="Lista de reservas com filtros por chalé, período e situação do pagamento."
      milestone="parte 3"
    />
  );
}
