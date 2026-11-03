"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Field } from "@/components/ui/field";
import { inputClassName } from "@/components/ui/input-styles";
import { cn } from "@/lib/cn";

export type GuestMode = "existing" | "new";

export interface GuestOption {
  id: string;
  full_name: string;
  phone: string | null;
}

export interface NewGuestDraft {
  full_name: string;
  phone: string;
  document: string;
}

interface GuestPickerProps {
  guests: GuestOption[];
  mode: GuestMode;
  onModeChange: (mode: GuestMode) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  newGuest: NewGuestDraft;
  onNewGuestChange: (guest: NewGuestDraft) => void;
  errors: Partial<Record<"main_guest_id" | "new_guest_name" | "new_guest_phone" | "new_guest_document", string>>;
}

const VISIBLE_RESULTS = 6;

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Responsável pela reserva: escolher um hóspede cadastrado ou cadastrar na hora. */
export function GuestPicker({
  guests,
  mode,
  onModeChange,
  selectedId,
  onSelect,
  newGuest,
  onNewGuestChange,
  errors,
}: GuestPickerProps) {
  const [term, setTerm] = useState("");

  const results = useMemo(() => {
    const query = normalize(term.trim());
    const matches = query
      ? guests.filter((guest) => normalize(`${guest.full_name} ${guest.phone ?? ""}`).includes(query))
      : guests;
    const selected = guests.find((guest) => guest.id === selectedId);
    const top = matches.slice(0, VISIBLE_RESULTS);
    // Mantém o escolhido visível mesmo fora do filtro.
    return selected && !top.includes(selected) ? [selected, ...top.slice(0, VISIBLE_RESULTS - 1)] : top;
  }, [guests, term, selectedId]);

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Hóspede responsável" className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {(
          [
            ["existing", "Já cadastrado"],
            ["new", "Novo hóspede"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => onModeChange(value)}
            className={cn(
              "h-10 rounded-xl text-[13px]",
              mode === value ? "bg-surface font-bold shadow-sm" : "text-ink-soft",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <input type="hidden" name="guest_mode" value={mode} />

      {mode === "existing" ? (
        <div className="flex flex-col gap-2">
          <label className="relative block">
            <span className="sr-only">Buscar hóspede</span>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por nome ou telefone"
              className={cn(inputClassName, "pl-11")}
            />
          </label>

          {guests.length === 0 ? (
            <p className="py-3 text-sm text-ink-muted">Nenhum hóspede cadastrado ainda. Use “Novo hóspede”.</p>
          ) : results.length === 0 ? (
            <p className="py-3 text-sm text-ink-muted">Ninguém encontrado. Cadastre como novo hóspede.</p>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface px-3">
              {results.map((guest) => (
                <li key={guest.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
                    <input
                      type="radio"
                      name="main_guest_id"
                      value={guest.id}
                      checked={guest.id === selectedId}
                      onChange={() => onSelect(guest.id)}
                      className="size-5 accent-[var(--color-primary)]"
                    />
                    <Avatar name={guest.full_name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{guest.full_name}</span>
                      {guest.phone ? <span className="block text-xs text-ink-muted">{guest.phone}</span> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {errors.main_guest_id ? <p className="text-xs font-semibold text-danger-ink">{errors.main_guest_id}</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Field
            label="Nome do responsável"
            name="new_guest_name"
            value={newGuest.full_name}
            onChange={(event) => onNewGuestChange({ ...newGuest, full_name: event.target.value })}
            autoComplete="off"
            error={errors.new_guest_name}
          />
          <Field
            label="Telefone / WhatsApp"
            name="new_guest_phone"
            type="tel"
            inputMode="tel"
            value={newGuest.phone}
            onChange={(event) => onNewGuestChange({ ...newGuest, phone: event.target.value })}
            placeholder="(11) 98765-4321"
            error={errors.new_guest_phone}
          />
          <Field
            label="CPF ou documento (opcional)"
            name="new_guest_document"
            value={newGuest.document}
            onChange={(event) => onNewGuestChange({ ...newGuest, document: event.target.value })}
            error={errors.new_guest_document}
          />
        </div>
      )}
    </div>
  );
}
