import { CalendarClock, X } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatShortDate, type IsoDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

import { addDepositPlan, addInstallment, removeInstallment } from "../actions";
import { unscheduledAmount, type InstallmentProgress, type InstallmentStatus } from "../domain/schedule";
import type { PixCharge } from "../services";
import { InstallmentForm } from "./installment-form";
import { PixCopy } from "./pix-copy";

const STATUS: Record<InstallmentStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: "Paga", tone: "success" },
  partial: { label: "Parcial", tone: "warning" },
  overdue: { label: "Vencida", tone: "danger" },
  due_today: { label: "Vence hoje", tone: "warning" },
  upcoming: { label: "A vencer", tone: "neutral" },
};

interface ScheduleCardProps {
  reservationId: string;
  schedule: InstallmentProgress[];
  total: number;
  checkIn: IsoDate;
  today: IsoDate;
  cancelled: boolean;
  nextPix: (PixCharge & { installmentId: string }) | null;
}

/** Parcelas previstas (sinal, parcelas, saldo) com vencimento e situação. */
export function ScheduleCard({ reservationId, schedule, total, checkIn, today, cancelled, nextPix }: ScheduleCardProps) {
  const gap = unscheduledAmount(schedule, total);

  return (
    <CardSection title="Parcelas" titleId="reservation-schedule">
      {schedule.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            Sem parcelas, o saldo vence no check-in. Combine sinal e saldo para o Painel avisar na data certa.
          </p>
          {!cancelled && total > 0 ? (
            <ActionForm action={addDepositPlan.bind(null, reservationId)}>
              <SubmitButton variant="soft" block pendingLabel="Criando…">
                <CalendarClock aria-hidden="true" />
                Sinal 50% hoje + saldo no check-in
              </SubmitButton>
            </ActionForm>
          ) : null}
        </div>
      ) : (
        <ul className="mb-3 divide-y divide-line">
          {schedule.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {item.description}
                    <Badge tone={STATUS[item.status].tone}>{STATUS[item.status].label}</Badge>
                  </span>
                  <span className="block text-xs text-ink-muted">
                    vence {formatShortDate(item.due_date)}
                    {item.status === "partial" || (item.covered > 0 && item.remaining > 0)
                      ? ` · falta ${formatCurrency(item.remaining)}`
                      : ""}
                  </span>
                </span>
                <span className="text-[15px] font-bold tabular-nums">{formatCurrency(item.amount)}</span>
                <ActionForm action={removeInstallment.bind(null, reservationId, item.id)} className="contents">
                  <ConfirmSubmit
                    message={`Remover a parcela “${item.description}”? Pagamentos já lançados não mudam.`}
                    confirmLabel="Remover"
                    pendingLabel="Removendo…"
                    triggerSize="icon"
                    triggerLabel={`Remover ${item.description}`}
                    block={false}
                    className="size-11 text-ink-muted md:size-9"
                  >
                    <X aria-hidden="true" />
                  </ConfirmSubmit>
                </ActionForm>
              </div>
              {nextPix?.installmentId === item.id ? (
                <div className="rounded-2xl bg-primary-strong p-3">
                  <p className="mb-2 text-xs text-[#cfdcc2]">Cobrar só esta parcela: {formatCurrency(nextPix.amount)}</p>
                  <PixCopy payload={nextPix.payload} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {schedule.length > 0 && gap !== 0 ? (
        <p className="mb-3 rounded-xl bg-accent-soft px-3 py-2 text-xs font-semibold text-accent-ink">
          {gap > 0
            ? `${formatCurrency(gap)} do total ainda sem parcela.`
            : `As parcelas passam do total em ${formatCurrency(-gap)}.`}
        </p>
      ) : null}

      {!cancelled && schedule.length > 0 ? (
        <InstallmentForm
          action={addInstallment.bind(null, reservationId)}
          suggestedAmount={Math.max(gap, 0)}
          suggestedDate={checkIn > today ? checkIn : today}
        />
      ) : null}
    </CardSection>
  );
}
