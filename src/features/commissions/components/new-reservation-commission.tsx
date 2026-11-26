"use client";

import { Field } from "@/components/ui/field";
import { FieldRow } from "@/components/ui/form-layout";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { SwitchField } from "@/components/ui/switch-field";
import { PAYMENT_METHOD_LABELS } from "@/features/billing/domain/payments";

import { BrokerNameField, CommissionAmountField } from "./commission-fields";

const METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }));

export interface CommissionDraft {
  enabled: boolean;
  brokerName: string;
  amount: string;
  status: "pending" | "paid";
  paidOn: string;
  method: string;
}

export const emptyCommissionDraft = (today: string): CommissionDraft => ({
  enabled: false,
  brokerName: "",
  amount: "",
  status: "pending",
  paidOn: today,
  method: "pix",
});

interface NewReservationCommissionProps {
  draft: CommissionDraft;
  onChange: (draft: CommissionDraft) => void;
  brokers: string[];
  /** Total previsto da reserva (para os atalhos de %). */
  total: number;
  today: string;
  error: (name: string) => string | undefined;
}

/** Passo Hóspedes da nova reserva: "Veio por corretor" e, se sim, nome, comissão e situação. */
export function NewReservationCommission({ draft, onChange, brokers, total, today, error }: NewReservationCommissionProps) {
  const set = (changes: Partial<CommissionDraft>) => onChange({ ...draft, ...changes });

  return (
    <div className="flex flex-col gap-4">
      <SwitchField
        label="Veio por corretor"
        description={draft.enabled ? undefined : "Ligue para registrar a comissão."}
        name="has_commission"
        checked={draft.enabled}
        onChange={(event) => set({ enabled: event.target.checked })}
      />
      {draft.enabled ? (
        <div className="animate-expand flex origin-top flex-col gap-4">
          <BrokerNameField
            name="broker_name"
            value={draft.brokerName}
            onChange={(brokerName) => set({ brokerName })}
            brokers={brokers}
            error={error("broker_name")}
          />
          <CommissionAmountField
            name="commission_amount"
            value={draft.amount}
            onChange={(amount) => set({ amount })}
            total={total}
            error={error("commission_amount")}
          />
          <SegmentedControl
            label="Situação"
            name="commission_status"
            options={[
              { value: "pending", label: "A pagar" },
              { value: "paid", label: "Já paga" },
            ]}
            value={draft.status}
            onChange={(status) => set({ status })}
          />
          {draft.status === "paid" ? (
            <FieldRow className="animate-expand origin-top">
              <Field
                label="Paga em"
                name="commission_paid_on"
                type="date"
                value={draft.paidOn}
                max={today}
                onChange={(event) => set({ paidOn: event.target.value })}
                required
                error={error("commission_paid_on")}
              />
              <SelectField
                label="Forma"
                name="commission_method"
                options={METHOD_OPTIONS}
                value={draft.method}
                onChange={(event) => set({ method: event.target.value })}
                error={error("commission_method")}
              />
            </FieldRow>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Problema simples para segurar o "Continuar" do passo (o servidor valida de novo). */
export function commissionDraftProblem(draft: CommissionDraft): string | null {
  if (!draft.enabled) return null;
  if (!draft.brokerName.trim()) return "Informe o nome do corretor.";
  if (!draft.amount.trim()) return "Informe o valor da comissão.";
  if (draft.status === "paid" && !draft.paidOn) return "Informe a data em que a comissão foi paga.";
  return null;
}
