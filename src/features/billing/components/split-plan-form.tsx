"use client";

import { CalendarClock, Check } from "lucide-react";
import { useActionState, useState } from "react";

import { FormAlert } from "@/components/ui/form-alert";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SubmitButton } from "@/components/ui/submit-button";
import { SwitchField } from "@/components/ui/switch-field";
import { formatShortDate, type IsoDate } from "@/lib/dates";
import { idleFormState, type FormState } from "@/lib/forms";
import { formatCurrency, pluralize } from "@/lib/format";

import { SPLIT_COUNTS, splitPlan, type SplitCount } from "../domain/schedule";

const COUNT_OPTIONS = SPLIT_COUNTS.map((count) => ({ value: String(count) as `${SplitCount}`, label: `${count}x` }));

interface SplitPlanFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  total: number;
  /** Já recebido: entra como "Sinal (pago)" e só o resto é dividido. */
  paid?: number;
  paidOn?: IsoDate;
  checkIn: IsoDate;
  today: IsoDate;
}

/** Divide o total em 2–4 parcelas, com prévia. Com "só valores redondos" não sobra centavo quebrado. */
export function SplitPlanForm({ action, total, paid = 0, paidOn, checkIn, today }: SplitPlanFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [count, setCount] = useState<`${SplitCount}`>("2");
  const [wholeReais, setWholeReais] = useState(true);

  // Prévia com a mesma regra do servidor (que recalcula a partir do total do banco).
  const plan = splitPlan({ total, count: Number(count) as SplitCount, checkIn, today, wholeReais, paid, paidOn });

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <FormAlert state={state} />
      {paid > 0 ? (
        <p className="text-sm text-ink-muted">
          Já pago: {formatCurrency(paid)} · falta {formatCurrency(Math.round((total - paid) * 100) / 100)}. O pago vira o
          sinal e só o que falta é dividido.
        </p>
      ) : null}
      <SegmentedControl label={paid > 0 ? "Dividir o que falta em" : "Dividir em"} name="count" options={COUNT_OPTIONS} value={count} onChange={setCount} />
      <SwitchField
        name="whole_reais"
        label="Só valores redondos"
        description={paid > 0 ? "Sem centavos quebrados. A diferença fica na primeira parcela." : "Sem centavos quebrados. A diferença fica no sinal."}
        checked={wholeReais}
        onChange={(event) => setWholeReais(event.target.checked)}
      />

      <ul aria-label="Prévia das parcelas" className="divide-y divide-line border-y border-line">
        {plan.map((item) => (
          <li key={item.description} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0">
              <span className="block font-semibold">{item.description}</span>
              <span className="block text-xs text-ink-muted">
                {item.description === "Sinal (pago)"
                  ? `pago em ${formatShortDate(item.due_date)}`
                  : item.due_date === today
                    ? "Hoje"
                    : formatShortDate(item.due_date)}
              </span>
            </span>
            <span className="font-semibold tabular-nums">{formatCurrency(item.amount)}</span>
          </li>
        ))}
      </ul>
      <p className="flex items-center justify-between gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-[13px] font-semibold text-primary-ink">
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-4" aria-hidden="true" />A soma fecha
        </span>
        <span className="tabular-nums">{formatCurrency(total)}</span>
      </p>

      <SubmitButton variant="soft" block pendingLabel="Criando…">
        <CalendarClock aria-hidden="true" />
        Criar {pluralize(plan.length, "parcela", "parcelas")}
      </SubmitButton>
    </form>
  );
}
