import { cn } from "@/lib/cn";

interface BrandProps {
  name: string;
  tagline?: string;
  className?: string;
}

/**
 * Símbolo da marca (o mesmo do ícone do app): um "b" com o topo da haste em diagonal,
 * como a água do telhado, e o sol nascendo na barriga. Cores pelos tokens, então
 * acompanha o modo escuro.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={className}>
      <path d="M138 126 212 86v334h-74z" className="fill-primary stroke-primary" strokeWidth="8" strokeLinejoin="round" />
      <circle cx="292" cy="326" r="86" fill="none" className="stroke-primary" strokeWidth="58" />
      <path d="M236 338a56 56 0 0 1 112 0z" className="fill-accent" />
    </svg>
  );
}

export function Brand({ name, tagline = "Gestão de hospedagem", className }: BrandProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-11 items-center justify-center rounded-[14px] bg-surface ring-1 ring-line">
        <BrandMark className="size-9" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-[19px] font-semibold">{name}</p>
        <p className="text-xs text-ink-muted">{tagline}</p>
      </div>
    </div>
  );
}
