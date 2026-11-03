import { Users } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Hóspedes" };

export default function GuestsPage() {
  return (
    <ComingSoon
      title="Hóspedes"
      icon={<Users />}
      description="Cadastro com busca por nome, CPF ou telefone e histórico de estadias."
      milestone="parte 3"
    />
  );
}
