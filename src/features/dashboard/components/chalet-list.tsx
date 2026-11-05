import { House } from "lucide-react";
import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

import type { ChaletOverview } from "../domain/types";

import { ChaletCard } from "./chalet-card";

/** Celular: carrossel horizontal com snap. Desktop: grade. */
export function ChaletList({ chalets }: { chalets: ChaletOverview[] }) {
  if (chalets.length === 0) {
    return (
      <EmptyState
        icon={<House />}
        title="Cadastre seu primeiro bangalô"
        description="Com os bangalôs cadastrados, o painel mostra ocupação, chegadas e valores."
        action={<ButtonLink href={routes.newChalet}>Cadastrar bangalô</ButtonLink>}
      />
    );
  }

  return (
    <section aria-labelledby="chalets-title">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="chalets-title" className="font-display text-xl font-semibold md:text-2xl">
          Seus bangalôs
        </h2>
        <Link href={routes.calendar} className="text-sm font-semibold">
          Ver ocupação
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4.5 md:overflow-visible md:px-0 lg:grid-cols-3">
        {chalets.map((chalet) => (
          <ChaletCard key={chalet.id} chalet={chalet} />
        ))}
      </div>
    </section>
  );
}
