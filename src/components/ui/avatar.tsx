import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const avatarVariants = cva(
  "inline-flex shrink-0 items-center overflow-hidden justify-center rounded-full font-semibold text-on-primary select-none",
  {
    variants: {
      size: {
        sm: "size-8 text-[11px]",
        md: "size-10 text-xs",
        lg: "size-12 text-sm",
        xl: "size-16 text-xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** Paleta quente; a cor sai do nome para ser estável entre telas. */
const AVATAR_COLORS = ["#E07B39", "#1F6FB2", "#2A9D8F", "#8B5A6B", "#6B4E36", "#14508A"] as const;

export function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  color?: string;
  /** Foto; sem ela (ou se falhar), aparecem as iniciais. */
  src?: string | null;
  className?: string;
}

export function Avatar({ name, color, size, src, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(avatarVariants({ size }), className)}
      style={{ backgroundColor: color ?? avatarColor(name) }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL assinada do Storage, já reduzida no envio
        <img src={src} alt="" className="size-full rounded-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
