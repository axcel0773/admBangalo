import { Compass } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        icon={<Compass />}
        title="Página não encontrada"
        description="O endereço pode ter mudado ou a reserva foi removida."
        action={<ButtonLink href="/">Voltar ao painel</ButtonLink>}
      />
    </main>
  );
}
