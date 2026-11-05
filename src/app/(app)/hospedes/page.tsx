import { Download, UserPlus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { SearchForm } from "@/components/ui/search-form";
import { filterGuests, GUEST_FILTERS, GuestList, isGuestFilter, searchGuests, type GuestFilter } from "@/features/guests";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Hóspedes" };

interface GuestsPageProps {
  searchParams: Promise<{ q?: string; filtro?: string }>;
}

function hrefFor(filter: GuestFilter, q?: string): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filtro", filter);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `${routes.guests}?${query}` : routes.guests;
}

export default async function GuestsPage({ searchParams }: GuestsPageProps) {
  const { q, filtro } = await searchParams;
  const filter: GuestFilter = isGuestFilter(filtro) ? filtro : "all";
  const guests = filterGuests(await searchGuests(q), filter);
  const chips = (Object.keys(GUEST_FILTERS) as GuestFilter[]).map((key) => ({
    href: hrefFor(key, q),
    label: GUEST_FILTERS[key],
    active: key === filter,
  }));

  return (
    <>
      <PageHeader
        title="Hóspedes"
        eyebrow={q ? `${pluralize(guests.length, "resultado", "resultados")} para “${q}”` : undefined}
        actions={
          <>
            {/* <a> comum: é um download, não uma navegação do Next. */}
            <a
              href={`${routes.guests}/exportar`}
              download
              aria-label="Exportar hóspedes (CSV)"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Download aria-hidden="true" />
              <span className="hidden sm:inline">Exportar</span>
            </a>
            <ButtonLink href={routes.newGuest} size="sm" aria-label="Novo hóspede">
              <UserPlus aria-hidden="true" />
              <span className="hidden sm:inline">Novo hóspede</span>
            </ButtonLink>
          </>
        }
      />
      <PageBody className="max-w-3xl">
        <SearchForm
          label="Buscar hóspede"
          placeholder="Nome, CPF ou telefone"
          defaultValue={q}
          hiddenParams={filter === "all" ? undefined : { filtro: filter }}
        />
        <FilterChips label="Filtrar hóspedes" chips={chips} />
        <GuestList guests={guests} searched={Boolean(q) || filter !== "all"} />
      </PageBody>
    </>
  );
}
