import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getMyProfile } from "@/features/profile/services";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const profile = await getMyProfile();

  return (
    <>
      <PageHeader title="Perfil" back={{ href: routes.settings, label: "Configurações" }} />
      <PageBody className="max-w-3xl">
        <ProfileForm profile={profile} />
      </PageBody>
    </>
  );
}
