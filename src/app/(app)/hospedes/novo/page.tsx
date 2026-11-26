import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { createGuest, GuestForm, listGuestContacts } from "@/features/guests";

export const metadata: Metadata = { title: "Novo hóspede" };

export default async function NewGuestPage() {
  const contacts = await listGuestContacts();
  return (
    <>
      <PageHeader title="Novo hóspede" back={{ href: routes.guests, label: "Hóspedes" }} />
      <PageBody className="max-w-3xl">
        <GuestForm action={createGuest} cancelHref={routes.guests} contacts={contacts} />
      </PageBody>
    </>
  );
}
