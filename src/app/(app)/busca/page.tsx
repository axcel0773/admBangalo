import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { SearchForm } from "@/components/ui/search-form";
import { normalizeSearchTerm, SEARCH_MIN_LENGTH, SearchResultsView, searchAll } from "@/features/search";

export const metadata: Metadata = { title: "Buscar" };

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const term = normalizeSearchTerm(q);
  const results = term ? await searchAll(term) : null;

  return (
    <>
      <PageHeader title="Buscar" description="Hóspedes, reservas e orçamentos em um só lugar." />
      <PageBody className="max-w-3xl">
        <SearchForm
          action={routes.search}
          defaultValue={q}
          placeholder="Nome, telefone ou bangalô"
          label="Buscar hóspedes, reservas e orçamentos"
        />
        {results ? (
          <SearchResultsView results={results} />
        ) : (
          <p className="text-sm text-ink-muted">Digite pelo menos {SEARCH_MIN_LENGTH} letras e toque em buscar.</p>
        )}
      </PageBody>
    </>
  );
}
