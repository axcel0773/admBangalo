"use client";

import { Check, HandCoins, Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow } from "@/components/ui/form-layout";
import { useCloseInlineEdit } from "@/components/ui/inline-edit";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { PAYMENT_METHOD_LABELS } from "@/features/billing/domain/payments";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatMoneyInput } from "@/lib/format";

import { BrokerNameField, CommissionAmountField } from "./commission-fields";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }));

/** Fecha o painel quando a ação devolve sucesso (ajuste de estado na renderização, sem efeito). */
function useCloseOnSuccess(state: FormState, close: () => void) {
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success") close();
  }
}

interface CommissionFieldsFormProps {
  action: Action;
  brokers: string[];
  total: number;
  initial?: { brokerName: string; amount: number };
  title: string;
  onClose: () => void;
}

function CommissionFieldsForm({ action, brokers, total, initial, title, onClose }: CommissionFieldsFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  useCloseOnSuccess(state, onClose);
  const [brokerName, setBrokerName] = useState(valueOf(state, "broker_name", initial?.brokerName ?? ""));
  const [amount, setAmount] = useState(valueOf(state, "amount", formatMoneyInput(initial?.amount ?? null)));

  return (
    <form action={formAction} className="mb-3 flex flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <p className="text-xs font-semibold text-ink-muted">{title}</p>
      <FormAlert state={state} />
      <BrokerNameField name="broker_name" value={brokerName} onChange={setBrokerName} brokers={brokers} error={fieldError(state, "broker_name")} />
      <CommissionAmountField name="amount" value={amount} onChange={setAmount} total={total} error={fieldError(state, "amount")} />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Salvando…">
          <Check aria-hidden="true" />
          Salvar
        </SubmitButton>
      </div>
    </form>
  );
}

/** Edição pelo lápis (dentro do InlineEdit). */
export function CommissionEditForm(props: Omit<CommissionFieldsFormProps, "onClose" | "title">) {
  const close = useCloseInlineEdit();
  return <CommissionFieldsForm {...props} title="Editar comissão" onClose={close} />;
}

/** Reserva sem corretor: botão que abre o formulário. */
export function AddCommission({ action, brokers, total }: Pick<CommissionFieldsFormProps, "action" | "brokers" | "total">) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="secondary" block onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Adicionar comissão
      </Button>
    );
  }
  return (
    <div className="animate-expand origin-top">
      <CommissionFieldsForm action={action} brokers={brokers} total={total} title="Nova comissão" onClose={() => setOpen(false)} />
    </div>
  );
}

/** "Marcar como paga": abre data e forma do pagamento. */
export function PayCommission({ action, today }: { action: Action; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, idleFormState);
  useCloseOnSuccess(state, () => setOpen(false));

  if (!open) {
    return (
      <Button block onClick={() => setOpen(true)}>
        <HandCoins aria-hidden="true" />
        Marcar como paga
      </Button>
    );
  }

  return (
    <form action={formAction} className="animate-expand flex origin-top flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <p className="text-xs font-semibold text-ink-muted">Pagamento da comissão</p>
      <FormAlert state={state} />
      <FieldRow>
        <Field
          label="Paga em"
          name="paid_on"
          type="date"
          defaultValue={valueOf(state, "paid_on", today)}
          max={today}
          required
          error={fieldError(state, "paid_on")}
        />
        <SelectField
          label="Forma"
          name="method"
          options={METHOD_OPTIONS}
          defaultValue={valueOf(state, "method", "pix")}
          error={fieldError(state, "method")}
        />
      </FieldRow>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Salvando…">
          <Check aria-hidden="true" />
          Confirmar
        </SubmitButton>
      </div>
    </form>
  );
}
