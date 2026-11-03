import { LogOut } from "lucide-react";
import type { Metadata } from "next";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { requireOwner } from "@/features/auth/session";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const owner = await requireOwner();

  return (
    <>
      <PageHeader title="Configurações" />
      <PageBody>
        <Card className="flex items-center gap-4 p-5">
          <Avatar name={owner.fullName} color="#C0643A" size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">{owner.fullName}</p>
            <p className="truncate text-sm text-ink-muted">{owner.email}</p>
          </div>
        </Card>

        <Card className="p-5 text-sm text-ink-muted">
          Cadastro de chalés, taxas (limpeza, energia, pessoa extra) e tarifas sazonais entra na
          parte 3.
        </Card>

        <form action={signOut}>
          <Button type="submit" variant="secondary" block size="lg">
            <LogOut aria-hidden="true" />
            Sair da conta
          </Button>
        </form>
      </PageBody>
    </>
  );
}
