import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { getGuestWithStays, GuestProfile } from "@/features/guests";

export const metadata: Metadata = { title: "Hóspede" };

export default async function GuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getGuestWithStays(id);
  if (!data) notFound();

  return (
    <>
      <PageHeader title="Ficha do hóspede" back={{ href: routes.guests, label: "Hóspedes" }} />
      <PageBody>
        <GuestProfile guest={data.guest} stays={data.stays} />
      </PageBody>
    </>
  );
}
