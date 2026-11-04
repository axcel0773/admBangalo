import type { Metadata } from "next";

import { ChaletLandscape } from "@/components/illustrations/chalet-landscape";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Entrar" };

interface LoginPageProps {
  searchParams: Promise<{ next?: string; erro?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, erro } = await searchParams;

  return (
    <main className="px-safe flex min-h-dvh flex-col md:flex-row">
      <div className="h-56 md:h-auto md:flex-1">
        <ChaletLandscape />
      </div>

      <div className="-mt-8 flex flex-1 items-start justify-center rounded-t-[28px] bg-canvas px-5 pt-8 pb-10 md:mt-0 md:items-center md:rounded-none md:px-12" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}>
        <div className="w-full max-w-sm">
          <Brand name="Chalés" className="mb-8" />
          <h1 className="font-display text-3xl font-semibold">Bem-vindo de volta</h1>
          <p className="mt-2 mb-6 text-[15px] text-ink-muted">
            Entre para ver reservas, hóspedes e valores dos seus chalés.
          </p>

          {erro === "link" ? (
            <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-ink">
              O link expirou ou já foi usado. Peça um novo.
            </p>
          ) : null}

          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
