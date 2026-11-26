/** Título de um bloco do Financeiro, com uma frase curta do que ele mostra. */
export function MoneyBlockHeading({ id, title, children }: { id: string; title: string; children: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 id={id} className="font-display text-xl font-semibold md:text-2xl">
        {title}
      </h2>
      <p className="text-sm text-ink-muted">{children}</p>
    </div>
  );
}
