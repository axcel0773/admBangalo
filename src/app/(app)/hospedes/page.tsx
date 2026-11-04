import { Download, UserPlus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { SearchForm } from "@/components/ui/search-form";
import { GuestList, searchGuests } from "@/features/guests";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Hóspedes" };

interface GuestsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function GuestsPage({ searchParams }: GuestsPageProps) {
  const { q } = await searchParams;
  const guests = await searchGuests(q);

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
        <SearchForm label="Buscar hóspede" placeholder="Nome, CPF ou telefone" defaultValue={q} />
        <GuestList guests={guests} searched={Boolean(q)} />
      </PageBody>
    </>
  );
}
