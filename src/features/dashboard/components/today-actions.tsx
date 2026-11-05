import { AlertTriangle, CircleCheck, Clock3, FileText } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { paths } from "@/components/layout/navigation";
import { CardSection } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { IconTile } from "@/components/ui/icon-tile";

import type { TodayAction } from "../domain/types";

const toneBySeverity = {
  danger: { tile: "accent", icon: <AlertTriangle />, text: "text-danger-ink" },
  warning: { tile: "accent", icon: <Clock3 />, text: "text-accent-ink" },
  info: { tile: "primary", icon: <FileText />, text: "text-primary-ink" },
} as const satisfies Record<TodayAction["severity"], { tile: "primary" | "accent"; icon: ReactNode; text: string }>;

function hrefFor(action: TodayAction): string {
  return action.target.kind === "quote" ? paths.quote(action.target.id) : paths.reservation(action.target.id);
}

/** O que precisa de atenção hoje: cada item leva direto à tela que resolve. */
export function TodayActions({ actions }: { actions: TodayAction[] }) {
  return (
    <CardSection title="Precisa de atenção" titleId="actions-title">
      {actions.length === 0 ? (
        <p className="flex items-center gap-2 py-4 text-sm text-ink-muted">
          <CircleCheck aria-hidden="true" className="size-5 text-primary" />
          Tudo em dia por aqui.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {actions.map((action) => {
            const tone = toneBySeverity[action.severity];
            return (
              <li key={action.id}>
                <Link href={hrefFor(action)} className="flex items-center gap-3 py-3 text-ink">
                  <IconTile tone={tone.tile}>{tone.icon}</IconTile>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{action.title}</span>
                    <span className={cn("block truncate text-xs", tone.text)}>{action.subtitle}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </CardSection>
  );
}
