import { CalendarPlus } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Nova reserva" };

export default function NewReservationPage() {
  return (
    <ComingSoon
      title="Nova reserva"
      icon={<CalendarPlus />}
      description="Formulário em 3 etapas (estadia, hóspedes, valores) com prévia calculada pelas regras de preço."
      milestone="parte 3"
    />
  );
}
