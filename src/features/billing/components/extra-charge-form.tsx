"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatCurrency, formatMoneyInput } from "@/lib/format";
import { moneyProblem } from "@/lib/masks";
import { parseMoney } from "@/lib/money";
import { cn } from "@/lib/cn";

import { TAX_KIND_LABELS, TAX_KINDS, type TaxKind } from "../domain/charges";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

interface ExtraChargeFormProps {
  action: Action;
  /** Valor sugerido por tipo de taxa (das taxas cadastradas). */
  defaults: Partial<Record<TaxKind, number>>;
}

/**
 * Dois caminhos, fechados por padrão: "+ Taxa" (tipo e valor) e "+ Item quebrado"
 * (o que foi, quantidade e valor de cada).
 */
export function ExtraChargeForm({ action, defaults }: ExtraChargeFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [open, setOpen] = useState<"tax" | "item" | null>(null);

  // Fecha depois de salvar (ajuste durante a renderização, sem efeito).
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success") setOpen(null);
  }

  if (open === null) {
    return (
      <div className="flex flex-col gap-2">
        {state.status === "success" ? <FormAlert state={state} /> : null}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setOpen("tax")}>
            <Plus aria-hidden="true" />
            Taxa
          </Button>
          <Button variant="secondary" onClick={() => setOpen("item")}>
            <Plus aria-hidden="true" />
            Item quebrado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="animate-expand flex origin-top flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <p className="text-sm font-semibold">{open === "tax" ? "Nova taxa" : "Item quebrado ou consumo"}</p>
      <FormAlert state={state} />
      {open === "tax" ? <TaxFields state={state} defaults={defaults} /> : <ItemFields state={state} />}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(null)}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Adicionando…">
          Adicionar
        </SubmitButton>
      </div>
    </form>
  );
}

/** Taxa: toque no tipo e informe o valor (em "Outra", também o nome). */
function TaxFields({ state, defaults }: { state: FormState; defaults: Partial<Record<TaxKind, number>> }) {
  const initialKind = TAX_KINDS.find((option) => option === valueOf(state, "kind", "cleaning")) ?? "cleaning";
  const [kind, setKind] = useState<TaxKind>(initialKind);
  const [amount, setAmount] = useState(valueOf(state, "unit_amount", formatMoneyInput(defaults[kind] ?? null)));
  const [name, setName] = useState(valueOf(state, "description", ""));

  function choose(next: TaxKind) {
    setKind(next);
    // Troca o valor pelo sugerido do novo tipo, se houver.
    const suggested = defaults[next];
    if (suggested !== undefined) setAmount(formatMoneyInput(suggested));
  }

  return (
    <>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="quantity" value="1" />
      {kind !== "other" ? <input type="hidden" name="description" value={TAX_KIND_LABELS[kind]} /> : null}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-ink-soft">Qual taxa?</legend>
        <div className="flex flex-wrap gap-2">
          {TAX_KINDS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={kind === option}
              onClick={() => choose(option)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-sm font-semibold text-ink-soft transition-[color,background-color,border-color,transform] duration-200 active:scale-95",
                "aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-ink",
              )}
            >
              {TAX_KIND_LABELS[option]}
            </button>
          ))}
        </div>
      </fieldset>
      {kind === "other" ? (
        <Field
          label="Nome da taxa"
          name="description"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Taxa de check-out tardio"
          maxLength={80}
          required
          error={fieldError(state, "description")}
        />
      ) : null}
      <Field
        label="Valor (R$)"
        name="unit_amount"
        inputMode="decimal"
        mask="money"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        validate={(value) => moneyProblem(value, { required: true, positive: true })}
        placeholder="150,00"
        required
        error={fieldError(state, "unit_amount")}
      />
    </>
  );
}

/** Item quebrado ou consumo: o que foi, quantidade e valor de cada, com o total na hora. */
function ItemFields({ state }: { state: FormState }) {
  const [quantity, setQuantity] = useState(valueOf(state, "quantity", "1"));
  const [unit, setUnit] = useState(valueOf(state, "unit_amount", ""));
  const total = (Number.parseInt(quantity, 10) || 0) * (parseMoney(unit) ?? 0);

  return (
    <>
      <input type="hidden" name="kind" value="item" />
      <Field
        label="O que foi?"
        name="description"
        defaultValue={valueOf(state, "description")}
        placeholder="Copo quebrado, lenha, bebidas…"
        maxLength={80}
        required
        error={fieldError(state, "description")}
      />
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
        <Field
          label="Quantidade"
          name="quantity"
          inputMode="numeric"
          mask="integer"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          error={fieldError(state, "quantity")}
        />
        <Field
          label="Valor de cada (R$)"
          name="unit_amount"
          inputMode="decimal"
          mask="money"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          validate={(value) => moneyProblem(value, { required: true, positive: true })}
          placeholder="15,00"
          required
          error={fieldError(state, "unit_amount")}
        />
      </div>
      {total > 0 ? <p className="text-sm text-ink-muted">Total: {formatCurrency(total)}</p> : null}
    </>
  );
}
