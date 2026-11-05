"use client";

import { CalendarPlus, FileText, Plus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { routes } from "./navigation";

const OPTIONS: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: routes.newReservation, label: "Nova reserva", description: "Datas, hóspedes e valores", icon: CalendarPlus },
  { href: routes.newQuote, label: "Novo orçamento", description: "Simular e enviar ao hóspede", icon: FileText },
];

/** Botão central da barra inferior: abre a escolha entre nova reserva e novo orçamento. */
export function NewMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Criar novo"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-mt-8 flex size-[58px] items-center justify-center justify-self-center rounded-[20px] bg-primary text-on-primary shadow-[0_10px_22px_rgb(74_107_58/0.35)] active:scale-95"
      >
        <Plus className="size-6" strokeWidth={2.4} aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" role="dialog" aria-modal="true" aria-label="O que deseja criar?">
          <button
            type="button"
            aria-label="Fechar"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/45"
          />
          <div className="pb-safe relative w-full rounded-t-[26px] bg-surface px-4 pt-3 pb-6 shadow-[0_-10px_30px_rgb(43_38_32/0.2)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
            <h2 className="mb-3 font-display text-lg font-semibold">O que deseja criar?</h2>
            <ul className="flex flex-col gap-2">
              {OPTIONS.map(({ href, label, description, icon: Icon }, index) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    autoFocus={index === 0}
                    className="flex min-h-14 items-center gap-3 rounded-2xl bg-canvas p-3 active:scale-[0.99]"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-primary-soft text-primary-ink">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{label}</span>
                      <span className="block text-xs text-ink-muted">{description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
