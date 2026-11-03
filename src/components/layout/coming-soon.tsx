import { Hammer } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";

import { PageBody, PageHeader } from "./page-header";

interface ComingSoonProps {
  title: string;
  description: string;
  /** Em qual parte do roadmap a tela entra. */
  milestone: string;
  icon?: ReactNode;
}

/** Página reservada para uma feature das próximas partes. */
export function ComingSoon({ title, description, milestone, icon }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} />
      <PageBody>
        <EmptyState
          icon={icon ?? <Hammer />}
          title="Em construção"
          description={`${description} Entra na ${milestone}.`}
        />
      </PageBody>
    </>
  );
}
