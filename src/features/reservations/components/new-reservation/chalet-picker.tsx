"use client";

import { House } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatCurrencyRounded } from "@/lib/format";

export interface ChaletOption {
  id: string;
  name: string;
  color: string;
  max_guests: number;
  base_nightly_rate: number;
}

interface ChaletPickerProps {
  chalets: ChaletOption[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

/** Cartões de bangalô como radio (um toque escolhe; teclado navega com as setas). */
export function ChaletPicker({ chalets, value, onChange, error }: ChaletPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Bangalô</legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2.5">
        {chalets.map((chalet) => {
          const selected = chalet.id === value;
          return (
            <label
              key={chalet.id}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-[18px] border-2 bg-surface px-2 py-3 text-center transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                selected ? "border-primary shadow-[0_8px_18px_rgb(31_111_178/0.15)]" : "border-transparent shadow-card",
              )}
            >
              <input
                type="radio"
                name="chalet_id"
                value={chalet.id}
                checked={selected}
                onChange={() => onChange(chalet.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-[14px] text-on-primary"
                style={{ backgroundColor: chalet.color }}
              >
                <House className="size-5" />
              </span>
              <span className="text-[13px] leading-tight font-bold">{chalet.name.replace(/^(Chalé|Bangalô)\s+/i, "")}</span>
              <span className="text-[11px] text-ink-muted">
                até {chalet.max_guests} · {formatCurrencyRounded(chalet.base_nightly_rate)}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-danger-ink">{error}</p> : null}
    </fieldset>
  );
}
