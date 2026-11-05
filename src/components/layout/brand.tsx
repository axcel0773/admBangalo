import { TreePalm } from "lucide-react";

import { cn } from "@/lib/cn";

interface BrandProps {
  name: string;
  tagline?: string;
  className?: string;
}

export function Brand({ name, tagline = "Gestão de hospedagem", className }: BrandProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-11 items-center justify-center rounded-[14px] bg-primary text-on-primary">
        <TreePalm className="size-6" aria-hidden="true" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-[19px] font-semibold">{name}</p>
        <p className="text-xs text-ink-muted">{tagline}</p>
      </div>
    </div>
  );
}
