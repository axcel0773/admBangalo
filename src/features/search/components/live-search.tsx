"use client";

import { ArrowRight, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconTile } from "@/components/ui/icon-tile";
import { ListCard, ListRow } from "@/components/ui/list-row";

import { searchSuggest } from "../actions";
import {
  completionFor,
  matchPages,
  normalizeSearchTerm,
  SEARCH_MIN_LENGTH,
  type SearchResults,
} from "../domain";
import { SEARCH_PAGES } from "../pages";
import { SearchResultsView } from "./search-results";

const DEBOUNCE_MS = 200;

/**
 * Busca ao vivo: completa a palavra em cinza (Tab ou → aceita), mostra as páginas
 * que combinam ("Ir para") e, abaixo, hóspedes, reservas e orçamentos enquanto digita.
 */
export function LiveSearch({ initialTerm = "" }: { initialTerm?: string }) {
  const [value, setValue] = useState(initialTerm);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const term = normalizeSearchTerm(value);
    const ticket = ++latest.current;
    if (!term) {
      setResults(null);
      setFailed(false);
      return;
    }
    const timer = setTimeout(() => {
      searchSuggest(term)
        .then((found) => {
          if (ticket !== latest.current) return;
          setResults(found);
          setFailed(false);
          // Mantém o endereço compartilhável sem recarregar a página.
          window.history.replaceState(null, "", `?q=${encodeURIComponent(term)}`);
        })
        .catch(() => {
          if (ticket === latest.current) setFailed(true);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const completion = completionFor(SEARCH_PAGES, value);
  const pages = matchPages(SEARCH_PAGES, value);
  const term = normalizeSearchTerm(value);
  // Resultado de uma busca anterior não deve aparecer sob outro termo.
  const fresh = results && term && results.term === term ? results : null;

  function accept() {
    if (!completion) return false;
    setValue(completion);
    return true;
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          inputRef.current?.blur();
        }}
        className="relative h-12 rounded-control border border-line-strong bg-surface focus-within:border-primary"
      >
        <label htmlFor="live-search-q" className="sr-only">
          Buscar páginas, hóspedes, reservas e orçamentos
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ink-muted" />
        {/* Camada com a palavra completa: o texto digitado fica invisível e só o resto aparece em cinza. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center overflow-hidden pr-4 pl-11 text-base whitespace-pre">
          <span className="text-transparent">{value}</span>
          {completion ? <span className="text-ink-muted/70">{completion.slice(value.length)}</span> : null}
        </div>
        <input
          ref={inputRef}
          id="live-search-q"
          type="search"
          name="q"
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          value={value}
          placeholder="Página, nome, telefone ou bangalô"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            const atEnd = event.currentTarget.selectionStart === value.length;
            if ((event.key === "Tab" && !event.shiftKey) || (event.key === "ArrowRight" && atEnd)) {
              if (accept()) event.preventDefault();
            }
          }}
          className="absolute inset-0 w-full bg-transparent pr-4 pl-11 text-base text-ink outline-none placeholder:text-ink-muted/70 [&::-webkit-search-cancel-button]:hidden"
        />
      </form>

      {!term ? (
        <p className="text-sm text-ink-muted">
          Digite pelo menos {SEARCH_MIN_LENGTH} letras: páginas, hóspedes, reservas e orçamentos aparecem enquanto você escreve.
        </p>
      ) : null}

      {pages.length > 0 ? (
        <section className="flex flex-col gap-2" aria-label="Páginas">
          <h2 className="px-1 text-sm font-semibold text-ink-soft">Ir para</h2>
          <ListCard>
            {pages.slice(0, 5).map((page) => (
              <ListRow
                key={page.href}
                href={page.href}
                leading={<IconTile tone="accent"><ArrowRight /></IconTile>}
                title={page.label}
                subtitle={page.description}
              />
            ))}
          </ListCard>
        </section>
      ) : null}

      {failed ? (
        <p role="alert" className="text-sm font-semibold text-danger-ink">
          Não foi possível buscar agora. Confira a conexão e tente de novo.
        </p>
      ) : fresh ? (
        <SearchResultsView results={fresh} hasPages={pages.length > 0} />
      ) : term ? (
        <p className="text-sm text-ink-muted" aria-live="polite">Buscando…</p>
      ) : null}

    </div>
  );
}
