"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-4 md:p-11">
      <EmptyState
        icon={<TriangleAlert />}
        title="Algo deu errado"
        description="Não conseguimos carregar esta tela. Verifique a conexão e tente de novo."
        action={<Button onClick={reset}>Tentar de novo</Button>}
      />
    </div>
  );
}
