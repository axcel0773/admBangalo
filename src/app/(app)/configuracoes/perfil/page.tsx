import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { requireOwner } from "@/features/auth/session";
import { AvatarUploader } from "@/features/profile/components/avatar-uploader";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getMyProfile } from "@/features/profile/services";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const [profile, owner] = await Promise.all([getMyProfile(), requireOwner()]);

  return (
    <>
      <PageHeader title="Perfil" back={{ href: routes.settings, label: "Configurações" }} />
      <PageBody className="max-w-3xl">
        <section aria-label="Foto de perfil" className="rounded-card bg-surface p-4 shadow-card md:p-6">
          <AvatarUploader ownerId={owner.id} name={owner.fullName} avatarUrl={owner.avatarUrl} />
        </section>
        <ProfileForm profile={profile} />
      </PageBody>
    </>
  );
}
