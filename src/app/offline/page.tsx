import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        icon={<WifiOff />}
        title="Você está sem conexão"
        description="Esta tela ainda não foi aberta com internet neste aparelho. As telas que você já abriu aparecem sem conexão; para salvar reservas e pagamentos, conecte-se de novo."
      />
    </main>
  );
}
