/** Legenda das barras do calendário (desktop). */
export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-soft">
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-3.5 w-7 rounded-full border border-primary/40 bg-primary-soft" />
        Confirmada
      </span>
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-6 rounded-full border-2 border-dashed border-primary/50" />
        Pendente
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-3.5 w-7 rounded-md border border-line-strong"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--color-muted) 0 4px, var(--color-subtle) 4px 8px)" }}
        />
        Bloqueado / outra plataforma
      </span>
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-4 border-l-2 border-dashed border-primary/50" />
        Hoje
      </span>
      <span className="text-ink-muted">Clique numa reserva para abrir · num dia livre para reservar</span>
    </div>
  );
}
