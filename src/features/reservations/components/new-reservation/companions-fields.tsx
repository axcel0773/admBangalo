"use client";

import { inputClassName } from "@/components/ui/input-styles";
import { cn } from "@/lib/cn";

export interface CompanionDraft {
  full_name: string;
  is_child: boolean;
}

interface CompanionsFieldsProps {
  companions: CompanionDraft[];
  onChange: (companions: CompanionDraft[]) => void;
}

/** Nomes dos acompanhantes (opcionais), um campo por pessoa além do responsável. */
export function CompanionsFields({ companions, onChange }: CompanionsFieldsProps) {
  if (companions.length === 0) return null;

  function update(index: number, patch: Partial<CompanionDraft>) {
    onChange(companions.map((companion, i) => (i === index ? { ...companion, ...patch } : companion)));
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-[13px] font-semibold text-ink-soft">
        Acompanhantes <span className="font-normal text-ink-muted">(opcional, pode preencher depois)</span>
      </legend>
      {companions.map((companion, index) => (
        <div key={index} className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`companion-${index}`}>
            Acompanhante {index + 1}
          </label>
          <input
            id={`companion-${index}`}
            value={companion.full_name}
            onChange={(event) => update(index, { full_name: event.target.value })}
            placeholder={`Pessoa ${index + 2}`}
            className={cn(inputClassName, "flex-1")}
          />
          <label className="flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-control bg-subtle px-3 text-xs font-semibold">
            <input
              type="checkbox"
              checked={companion.is_child}
              onChange={(event) => update(index, { is_child: event.target.checked })}
              className="size-4 accent-[var(--color-primary)]"
            />
            Criança
          </label>
        </div>
      ))}
    </fieldset>
  );
}
