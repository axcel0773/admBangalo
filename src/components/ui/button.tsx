import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary shadow-primary hover:bg-primary-strong",
        secondary: "border border-line-strong bg-surface text-ink hover:bg-subtle",
        soft: "bg-primary-soft text-primary-ink hover:bg-primary-soft/80",
        accent: "bg-accent text-[#2b2620] hover:bg-accent/90",
        ghost: "text-ink-soft hover:bg-muted",
        inverted: "bg-surface text-primary-strong hover:bg-subtle",
      },
      size: {
        sm: "min-h-10 rounded-xl px-3.5 text-[13px]",
        md: "min-h-12 rounded-control px-5 text-sm",
        lg: "min-h-14 rounded-2xl px-6 text-[15px]",
        icon: "size-11 rounded-control",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps = ComponentProps<"button"> & ButtonVariants;

export function Button({ className, variant, size, block, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export type ButtonLinkProps = ComponentProps<typeof Link> & ButtonVariants;

/** Link com aparência de botão (navegação, não ação). */
export function ButtonLink({ className, variant, size, block, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}
