import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Calendário" };

export default function CalendarPage() {
  return (
    <ComingSoon
      title="Calendário"
      icon={<CalendarDays />}
      description="Grade de ocupação por chalé, com reservas como barras e dias livres clicáveis."
      milestone="parte 3"
    />
  );
}
