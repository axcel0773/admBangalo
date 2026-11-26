"use client";

import { useId } from "react";

import { Field } from "@/components/ui/field";
import { formatMoneyInput } from "@/lib/format";
import { moneyProblem } from "@/lib/masks";
import { parseMoney } from "@/lib/money";

import { COMMISSION_PERCENTS, commissionForPercent, describeCommissionShare } from "../domain";

interface BrokerNameFieldProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  brokers: string[];
  error?: string;
}

/** Nome do corretor, sugerindo os que já apareceram em outras reservas. */
export function BrokerNameField({ name, value, onChange, brokers, error }: BrokerNameFieldProps) {
  const listId = useId();
  return (
    <>
      <Field
        label="Nome do corretor"
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        list={brokers.length > 0 ? listId : undefined}
        autoComplete="off"
        maxLength={80}
        required
        error={error}
        hint={brokers.length > 0 ? "Corretores já usados aparecem ao digitar." : undefined}
      />
      {brokers.length > 0 ? (
        <datalist id={listId}>
          {brokers.map((broker) => (
            <option key={broker} value={broker} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}

interface CommissionAmountFieldProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** Total da reserva, para os atalhos de porcentagem. */
  total: number;
  error?: string;
}

/** Valor da comissão em reais, com atalhos de 5, 10 e 15% do total. */
export function CommissionAmountField({ name, value, onChange, total, error }: CommissionAmountFieldProps) {
  const share = describeCommissionShare(parseMoney(value) ?? 0, total);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Field
        label="Comissão (R$)"
        name={name}
        inputMode="decimal"
        mask="money"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        validate={(raw) => moneyProblem(raw, { required: true, positive: true })}
        required
        error={error}
        hint={share ?? undefined}
      />
      {total > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Atalhos de porcentagem do total">
          {COMMISSION_PERCENTS.map((percent) => {
            const amount = commissionForPercent(total, percent);
            const text = formatMoneyInput(amount);
            const active = parseMoney(value) === amount;
            return (
              <button
                key={percent}
                type="button"
                onClick={() => onChange(text)}
                aria-pressed={active}
                className="inline-flex min-h-10 items-center rounded-full border border-line-strong px-3.5 text-sm font-semibold text-ink-soft transition-[color,background-color,border-color,transform] duration-200 active:scale-95 aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-ink"
              >
                {percent}%
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
