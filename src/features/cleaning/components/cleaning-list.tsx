import { Check, MessageCircle, Sparkles, Undo2 } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";
import { SubmitButton } from "@/components/ui/submit-button";
import { encodeForUrl } from "@/features/guests";
import { formatShortDate, type IsoDate } from "@/lib/dates";

import { setCleaningDone } from "../actions";
import { cleaningMessage, cleaningUrgency, type CleaningTask, type CleaningUrgency } from "../domain";

const URGENCY: Record<CleaningUrgency, { label: string; tone: BadgeTone }> = {
  late: { label: "Atrasada", tone: "danger" },
  today: { label: "Hoje", tone: "warning" },
  same_day: { label: "Entra hóspede hoje", tone: "warning" },
  upcoming: { label: "Agendada", tone: "neutral" },
  done: { label: "Feita", tone: "success" },
};

export function CleaningList({ tasks, today }: { tasks: CleaningTask[]; today: IsoDate }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles />}
        title="Nenhuma saída por perto"
        description="Quando houver hóspedes saindo, a limpeza de cada bangalô aparece aqui."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => {
        const urgency = cleaningUrgency(task, today);
        const info = URGENCY[urgency];
        return (
          <li key={task.reservationId} className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <IconTile tone={task.done ? "primary" : "accent"}>
                <Sparkles />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{task.chaletName}</p>
                <p className="truncate text-xs text-ink-muted">
                  Saída {formatShortDate(task.dueOn)} · {task.guestName}
                  {task.nextCheckIn ? ` · próxima entrada ${formatShortDate(task.nextCheckIn)}` : ""}
                </p>
              </div>
              <Badge tone={info.tone}>{info.label}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ActionForm action={setCleaningDone.bind(null, task.reservationId, !task.done)} className="flex flex-wrap">
                <SubmitButton variant={task.done ? "secondary" : "primary"} size="sm" pendingLabel="Salvando…">
                  {task.done ? <Undo2 aria-hidden="true" /> : <Check aria-hidden="true" />}
                  {task.done ? "Desfazer" : "Marcar como feita"}
                </SubmitButton>
              </ActionForm>
              {task.done ? null : (
                <ButtonLink
                  variant="soft"
                  size="sm"
                  href={`https://api.whatsapp.com/send?text=${encodeForUrl(cleaningMessage(task))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden="true" />
                  Avisar faxineira
                </ButtonLink>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
