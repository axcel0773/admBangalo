import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-card bg-surface shadow-card", className)} {...props} />;
}

interface CardSectionProps extends Omit<ComponentProps<"section">, "title"> {
  title: ReactNode;
  /** Ação à direita do título (link "ver tudo", botão…). */
  action?: ReactNode;
  titleId?: string;
}

/** Cartão com título acessível (aria-labelledby). */
export function CardSection({
  title,
  action,
  titleId,
  className,
  children,
  ...props
}: CardSectionProps) {
  const headingId = titleId ?? `section-${String(title).toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section
      aria-labelledby={headingId}
      className={cn("rounded-card bg-surface p-4 shadow-card md:p-6", className)}
      {...props}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={headingId} className="font-display text-xl font-semibold md:text-[22px]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
