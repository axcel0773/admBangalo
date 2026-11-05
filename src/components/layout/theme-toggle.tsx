"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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

interface ThemeToggleProps {
  /** "photo": botão redondo translúcido sobre a faixa azul. "sidebar": quadrado do menu lateral. */
  variant: "photo" | "sidebar";
  className?: string;
}

/** Botão de aparência: claro, escuro ou automático (segue o aparelho). */
export function ThemeToggle({ variant, className }: ThemeToggleProps) {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as ThemeChoice);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const select = useCallback((next: ThemeChoice) => {
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sem armazenamento (aba privada): vale só até recarregar.
    }
    applyChoice(next);
    listeners.forEach((listener) => listener());
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Ao abrir o app com escolha salva, ajusta também a cor da barra do navegador.
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

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    rootRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Icon = ICONS[choice];
  const label = `Aparência: ${THEME_CHOICES[choice].label.toLowerCase()}`;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "grid place-items-center transition-colors",
          variant === "photo"
            ? "size-11 rounded-full bg-white/20 text-white ring-1 ring-white/30 ring-inset hover:bg-white/30 focus-visible:outline-white"
            : "size-9 rounded-[10px] border border-line bg-surface text-ink-soft hover:bg-muted",
        )}
      >
        <Icon className={variant === "photo" ? "size-5" : "size-4"} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Aparência"
          className={cn(
            "absolute z-50 min-w-56 rounded-2xl border border-line bg-surface p-1.5 text-ink shadow-raised",
            variant === "photo" ? "top-full right-0 mt-2" : "bottom-full left-0 mb-2",
          )}
        >
          {ORDER.map((value) => {
            const OptionIcon = ICONS[value];
            const selected = value === choice;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => select(value)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm",
                  selected ? "bg-primary-soft font-semibold text-primary-ink" : "hover:bg-subtle",
                )}
              >
                <OptionIcon className="size-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  {THEME_CHOICES[value].label}
                  {THEME_CHOICES[value].hint ? (
                    <span className="block text-[11px] font-normal text-ink-muted">{THEME_CHOICES[value].hint}</span>
                  ) : null}
                </span>
                {selected ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
