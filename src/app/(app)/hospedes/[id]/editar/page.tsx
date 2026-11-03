import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { paths } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { getGuest, GuestForm, updateGuest } from "@/features/guests";

export const metadata: Metadata = { title: "Editar hóspede" };

export default async function EditGuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guest = await getGuest(id);
  if (!guest) notFound();

  return (
    <>
      <PageHeader title="Editar hóspede" back={{ href: paths.guest(guest.id), label: guest.full_name }} />
      <PageBody className="max-w-3xl">
        <GuestForm action={updateGuest.bind(null, guest.id)} cancelHref={paths.guest(guest.id)} guest={guest} />
      </PageBody>
    </>
  );
}
