import type { Metadata } from "next";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { LiveSearch } from "@/features/search";

export const metadata: Metadata = { title: "Buscar" };

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  return (
    <>
      <PageHeader title="Buscar" description="Páginas, hóspedes, reservas e orçamentos em um só lugar." />
      <PageBody className="max-w-3xl">
        <LiveSearch initialTerm={(q ?? "").slice(0, 60)} />
      </PageBody>
    </>
  );
}
