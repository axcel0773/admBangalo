import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        primary: "bg-primary-soft text-primary",
        accent: "bg-accent-soft text-accent-ink",
        neutral: "bg-muted text-ink-soft",
        energy: "bg-energy-soft text-energy-ink",
        slate: "bg-[#dce6ea] text-[#4d6b7a]",
      },
      size: {
        sm: "size-8 rounded-[10px] [&_svg]:size-4",
        md: "size-10 rounded-xl [&_svg]:size-5",
        lg: "size-13 rounded-2xl [&_svg]:size-7",
      },
    },
    defaultVariants: { tone: "primary", size: "md" },
  },
);

interface IconTileProps extends VariantProps<typeof iconTileVariants> {
  children: ReactNode;
  className?: string;
}

/** Ícone dentro de um quadrado arredondado com fundo suave. */
export function IconTile({ tone, size, className, children }: IconTileProps) {
  return (
    <span aria-hidden="true" className={cn(iconTileVariants({ tone, size }), className)}>
      {children}
    </span>
  );
}
