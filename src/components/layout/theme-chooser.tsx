"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import {
  parseThemeChoice,
  THEME_CHOICES,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type ThemeChoice,
} from "@/lib/theme";

/** Círculo com a letra A: o lucide não tem um ícone de "automático". */
function AutoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8.2 16.5 12 7l3.8 9.5M9.6 13.6h4.8" />
    </svg>
  );
}

const ICONS = { light: Sun, dark: Moon, system: AutoIcon } as const;
const ORDER: ThemeChoice[] = ["light", "dark", "system"];

const listeners = new Set<() => void>();

function readChoice(): ThemeChoice {
  try {
    return parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Aplica a escolha no <html> e na cor da barra do navegador. */
function applyChoice(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);

  const dark = choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", dark ? THEME_COLORS.dark : THEME_COLORS.light);
    meta.removeAttribute("media");
  });
}

/** Escolha de aparência na tela de Configurações: claro, escuro ou automático (segue o aparelho). */
export function ThemeChooser({ className }: { className?: string }) {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as ThemeChoice);

  function select(next: ThemeChoice) {
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sem armazenamento (aba privada): vale só até recarregar.
    }
    applyChoice(next);
    listeners.forEach((listener) => listener());
  }

  // Ao abrir com escolha salva, ajusta também a cor da barra do navegador.
  useEffect(() => {
    if (choice !== "system") applyChoice(choice);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  // No automático, acompanha o aparelho se ele mudar com o app aberto.
  useEffect(() => {
    if (choice !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyChoice("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [choice]);

  return (
    <div role="radiogroup" aria-label="Aparência" className={cn("grid grid-cols-3 gap-2", className)}>
      {ORDER.map((value) => {
        const Icon = ICONS[value];
        const selected = value === choice;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => select(value)}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-sm transition-colors",
              selected
                ? "border-primary bg-primary-soft font-semibold text-primary-ink"
                : "border-line bg-surface text-ink-soft hover:bg-subtle",
            )}
          >
            <Icon className="size-6" />
            {THEME_CHOICES[value].label}
          </button>
        );
      })}
    </div>
  );
}
