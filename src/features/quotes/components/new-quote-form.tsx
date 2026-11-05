"use client";

import { useActionState, useState } from "react";

import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow, FormSection } from "@/components/ui/form-layout";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextareaField } from "@/components/ui/textarea-field";
import { blockWarning, overlappingBlocks, type ChaletBlock } from "@/features/availability/client";
import { MAX_CHALET_GUESTS } from "@/features/chalets/domain";
import {
  nightlyBreakdown,
  nightsOf,
  QuoteSummary,
  quoteDraft,
  StayStep,
  validateDraft,
  type FeeForQuote,
  type SeasonRate,
} from "@/features/reservations/client";
import { addDays, type IsoDate } from "@/lib/dates";
import { fieldError, idleFormState } from "@/lib/forms";
import { formatCurrency, formatMoneyInput, pluralize } from "@/lib/format";
import { parseMoney } from "@/lib/money";

import { createQuote } from "../actions";
import { DEFAULT_VALIDITY_DAYS, VALIDITY_OPTIONS } from "../domain/quote-document";

interface ChaletForQuoteForm {
  id: string;
  name: string;
  color: string;
  base_guests: number;
  max_guests: number;
  base_nightly_rate: number;
}

interface NewQuoteFormProps {
  chalets: ChaletForQuoteForm[];
  fees: FeeForQuote[];
  seasons: SeasonRate[];
  blocks: ChaletBlock[];
  today: IsoDate;
  prefill: { chaletId?: string; checkIn?: IsoDate };
}

/** Novo orçamento: mesma estadia e mesmo cálculo da reserva, mas sem criar nada no calendário. */
export function NewQuoteForm({ chalets, fees, seasons, blocks, today, prefill }: NewQuoteFormProps) {
  const [state, formAction] = useActionState(createQuote, idleFormState);

  const initialChalet = chalets.find((c) => c.id === prefill.chaletId) ?? chalets[0];
  const initialCheckIn = prefill.checkIn ?? today;

  const [chaletId, setChaletId] = useState(initialChalet?.id ?? "");
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string>(addDays(initialCheckIn, 2));
  const [adults, setAdults] = useState(Math.min(2, initialChalet?.max_guests ?? 2));
  const [children, setChildren] = useState(0);
  // Diária: segue a sugestão (base ou média da temporada) até o dono digitar outra.
  const [nightlyRate, setNightlyRate] = useState("");
  const [rateTouched, setRateTouched] = useState(false);
  const [discount, setDiscount] = useState("");

  const chalet = chalets.find((c) => c.id === chaletId) ?? null;
  const nights = nightsOf(checkIn, checkOut);
  const breakdown =
    chalet && nights > 0
      ? nightlyBreakdown({
          checkIn,
          checkOut,
          baseRate: chalet.base_nightly_rate,
          seasons: seasons.filter((season) => season.chalet_id === chalet.id),
        })
      : null;
  const suggestedRate = breakdown?.average ?? chalet?.base_nightly_rate ?? 0;
  const rateText = rateTouched ? nightlyRate : formatMoneyInput(suggestedRate);
  const rate = parseMoney(rateText) ?? 0;
  const discountValue = parseMoney(discount) ?? 0;
  const rateHint = rateTouched
    ? undefined
    : breakdown?.seasonal
      ? "Média das noites, com a tarifa de temporada."
      : "Diária base do chalé.";

  const blocked = chalet && nights > 0 ? blockWarning(overlappingBlocks(blocks, chalet.id, checkIn, checkOut)) : null;
  const minNightsWarning = breakdown?.minNightsIssue
    ? `A temporada “${breakdown.minNightsIssue.label}” pede no mínimo ${pluralize(breakdown.minNightsIssue.minNights, "noite", "noites")}.`
    : null;

  const draft = { chalet, checkIn, checkOut, adults, children, nightlyRate: rate, discount: discountValue };
  const issues = validateDraft(draft);
  const quote = quoteDraft(draft, fees);
  const error = (name: string) => fieldError(state, name);

  function changeCheckIn(value: string) {
    setCheckIn(value);
    if (value && checkOut && nightsOf(value, checkOut) < 1) setCheckOut(addDays(value, 1));
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4 md:gap-6">
      <FormAlert state={state} />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex flex-col gap-4 md:gap-6">
          <StayStep
            chalets={chalets}
            chalet={chalet}
            chaletId={chaletId}
            onChaletChange={(id) => {
              setChaletId(id);
              setRateTouched(false);
            }}
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInChange={changeCheckIn}
            onCheckOutChange={setCheckOut}
            nights={nights}
            seasonal={Boolean(breakdown?.seasonal)}
            blocked={blocked}
            minNightsWarning={minNightsWarning}
            dateIssue={issues.dates}
            capacityIssue={issues.capacity}
            maxGuests={chalet?.max_guests ?? MAX_CHALET_GUESTS}
            adults={adults}
            childCount={children}
            onAdultsChange={setAdults}
            onChildrenChange={setChildren}
            error={error}
          />

          <FormSection title="Para quem é o orçamento">
            <FieldRow>
              <Field label="Nome do hóspede" name="guest_name" placeholder="Maria Souza" required autoComplete="off" error={error("guest_name")} />
              <Field
                label="WhatsApp (opcional)"
                name="guest_phone"
                type="tel"
                inputMode="tel"
                mask="phone"
                placeholder="(11) 98765-4321"
                hint="Com o número, o botão de mensagem abre a conversa pronta."
                error={error("guest_phone")}
              />
            </FieldRow>
          </FormSection>

          <FormSection title="Valores">
            <FieldRow>
              <Field
                label="Diária (R$)"
                name="nightly_rate"
                inputMode="decimal"
                mask="money"
                value={rateText}
                onChange={(event) => {
                  setNightlyRate(event.target.value);
                  setRateTouched(true);
                }}
                hint={rateHint}
                error={error("nightly_rate")}
              />
              <Field
                label="Desconto total (R$)"
                name="discount"
                inputMode="decimal"
                mask="money"
                placeholder="0,00"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                error={error("discount")}
              />
            </FieldRow>
            <SelectField
              label="Validade do orçamento"
              name="validity_days"
              defaultValue={String(DEFAULT_VALIDITY_DAYS)}
              options={VALIDITY_OPTIONS.map((days) => ({ value: String(days), label: `${pluralize(days, "dia", "dias")} a partir de hoje` }))}
              error={error("validity_days")}
            />
            <TextareaField
              label="Observações (aparecem no orçamento)"
              name="notes"
              placeholder="Aceitamos pets, café da manhã não incluso…"
              error={error("notes")}
            />
          </FormSection>

          {quote ? (
            <Card className="p-4 md:p-6 lg:hidden">
              <QuoteSummary
                quote={quote}
                nights={nights}
                nightlyRate={rate}
                discount={discountValue}
                seasonGroups={breakdown?.seasonal && !rateTouched ? breakdown.groups : undefined}
              />
            </Card>
          ) : null}
        </div>

        <aside aria-label="Resumo do orçamento" className="hidden lg:sticky lg:top-6 lg:block">
          <Card className="p-6">
            <p className="mb-3 font-display text-lg font-semibold">{chalet?.name ?? "Resumo"}</p>
            {quote ? (
              <QuoteSummary
                quote={quote}
                nights={nights}
                nightlyRate={rate}
                discount={discountValue}
                seasonGroups={breakdown?.seasonal && !rateTouched ? breakdown.groups : undefined}
              />
            ) : (
              <p className="text-sm text-ink-muted">Escolha chalé e datas para ver os valores.</p>
            )}
          </Card>
        </aside>
      </div>

      <div className="keyboard-static sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="min-w-0 flex-1 md:hidden">
          <p className="text-[11px] text-ink-muted">Total{nights > 0 ? ` · ${pluralize(nights, "noite", "noites")}` : ""}</p>
          <p className="font-display text-xl leading-tight font-semibold">{quote ? formatCurrency(quote.total) : "—"}</p>
        </div>
        <SubmitButton size="lg" pendingLabel="Criando…">
          Criar orçamento
        </SubmitButton>
      </div>
    </form>
  );
}
