import { Wrench, X } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { CardSection } from "@/components/ui/card";
import { InlineEdit } from "@/components/ui/inline-edit";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { SubmitButton } from "@/components/ui/submit-button";
import { Tip } from "@/components/ui/tip";
import { roundMoney } from "@/features/reservations/domain";
import { formatShortDate, type IsoDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

import { addInstallment, addSplitPlan, editInstallment, fixScheduleGap, removeInstallment } from "../actions";
import {
  scheduleGapFixes,
  unscheduledAmount,
  type InstallmentProgress,
  type InstallmentStatus,
  type ScheduleGapFix,
} from "../domain/schedule";
import type { PixCharge } from "../services";
import { InstallmentEditForm } from "./installment-edit-form";
import { InstallmentForm } from "./installment-form";
import { SplitPlanForm } from "./split-plan-form";
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
  /** Total já recebido (o "Sinal (pago)" ao dividir e nos consertos). */
  paid: number;
  firstPaidOn: string | null;
}

function fixLabel(fix: ScheduleGapFix): string {
  if (fix.kind === "paid_deposit") return `Usar o pago (${formatCurrency(fix.amount)}) como sinal`;
  if (fix.kind === "new_installment") return `Criar parcela de ${formatCurrency(fix.amount)}`;
  return `Ajustar a última parcela para ${formatCurrency(fix.newAmount)}`;
}

/** Parcelas previstas (sinal, parcelas, saldo) com vencimento e situação. */
export function ScheduleCard({
  reservationId,
  schedule,
  total,
  checkIn,
  today,
  cancelled,
  nextPix,
  paid,
  firstPaidOn,
}: ScheduleCardProps) {
  const gap = unscheduledAmount(schedule, total);
  const fixes = cancelled ? [] : scheduleGapFixes({ items: schedule, total, paid });

  return (
    <CardSection title="Parcelas" titleId="reservation-schedule">
      {!cancelled ? (
        <Tip id="parcelas" className="mb-3">
          Combine aqui o sinal e o resto. O Painel avisa no dia de cobrar cada parcela.
        </Tip>
      ) : null}
      {schedule.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            Sem parcelas, o saldo vence no check-in. Combine sinal e saldo para o Painel avisar na data certa.
          </p>
          {!cancelled && total > 0 && paid < total ? (
            <SplitPlanForm
              action={addSplitPlan.bind(null, reservationId)}
              total={total}
              paid={Math.max(paid, 0)}
              paidOn={firstPaidOn ?? undefined}
              checkIn={checkIn}
              today={today}
            />
          ) : null}
        </div>
      ) : (
        <ul className="mb-3 divide-y divide-line">
          {schedule.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-3">
              <InlineEdit
                label={item.description}
                rowClassName="flex flex-wrap items-center gap-x-2 gap-y-2"
                editor={
                  <InstallmentEditForm
                    action={editInstallment.bind(null, reservationId, item.id)}
                    initial={{ description: item.description, amount: item.amount, due_date: item.due_date }}
                    covered={item.covered}
                  />
                }
                below={
                  nextPix?.installmentId === item.id ? (
                    <div className="rounded-2xl bg-primary-strong p-3">
                      <p className="mb-2 text-xs text-on-primary/75">Cobrar só esta parcela: {formatCurrency(nextPix.amount)}</p>
                      <PixCopy payload={nextPix.payload} />
                    </div>
                  ) : null
                }
                trailing={
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
                }
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {item.description}
                    <Badge tone={STATUS[item.status].tone}>{STATUS[item.status].label}</Badge>
                  </span>
                  <span className="block text-xs text-ink-muted">
                    vence {formatShortDate(item.due_date)}
                    {item.status !== "paid" && item.covered > 0 && item.remaining > 0
                      ? ` · falta ${formatCurrency(item.remaining)}`
                      : ""}
                  </span>
                </span>
                <span className="text-[15px] font-bold tabular-nums">{formatCurrency(item.amount)}</span>
              </InlineEdit>
            </li>
          ))}
        </ul>
      )}

      {schedule.length > 0 && gap !== 0 ? (
        <div className="mb-3 flex flex-col gap-2">
          <p role="status" className="rounded-xl bg-accent-soft px-3 py-2.5 text-sm text-accent-ink">
            <span className="block font-semibold">
              As parcelas somam {formatCurrency(roundMoney(total - gap))}
            </span>
            O total da reserva é {formatCurrency(total)}.{" "}
            {gap > 0 ? `Faltam ${formatCurrency(gap)} sem parcela.` : `Passam ${formatCurrency(-gap)} do total.`}
          </p>
          {fixes.map((fix, index) => (
            <ActionForm key={fix.kind} action={fixScheduleGap.bind(null, reservationId, fix.kind)}>
              <SubmitButton
                variant={index === 0 ? "primary" : "secondary"}
                block
                pendingLabel="Ajustando…"
                // Rótulos com valor podem passar da largura do celular: quebram em duas linhas.
                className="h-auto min-h-12 py-2.5 text-center leading-snug whitespace-normal"
              >
                {index === 0 ? <Wrench aria-hidden="true" /> : null}
                {fixLabel(fix)}
              </SubmitButton>
            </ActionForm>
          ))}
        </div>
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
