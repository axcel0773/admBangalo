import { Search } from "lucide-react";

import { cn } from "@/lib/cn";

import { inputClassName } from "./input-styles";

interface SearchFormProps {
  defaultValue?: string;
  placeholder: string;
  label: string;
  /** Outros parâmetros da URL a manter na busca. */
  hiddenParams?: Record<string, string>;
  className?: string;
}

/** Busca por GET (?q=): sem estado no cliente, compartilhável e funciona offline-first. */
export function SearchForm({ defaultValue, placeholder, label, hiddenParams, className }: SearchFormProps) {
  return (
    <form role="search" className={cn("relative", className)}>
      <label className="sr-only" htmlFor="search-q">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ink-muted"
      />
      <input
        id="search-q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(inputClassName, "pl-11")}
      />
      {Object.entries(hiddenParams ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </form>
  );
}
