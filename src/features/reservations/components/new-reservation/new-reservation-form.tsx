"use client";

import { ChevronLeft } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow, FormSection } from "@/components/ui/form-layout";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SelectField } from "@/components/ui/select-field";
import { StepIndicator } from "@/components/ui/step-indicator";
import { SubmitButton } from "@/components/ui/submit-button";
import { SwitchField } from "@/components/ui/switch-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { addDays, type IsoDate } from "@/lib/dates";
import { fieldError, idleFormState } from "@/lib/forms";
import { formatCurrency, formatMoneyInput, pluralize } from "@/lib/format";
import { parseMoney } from "@/lib/money";

import { createReservation } from "../../actions";
import { nightsOf, quoteDraft, validateDraft, type FeeForQuote } from "../../domain/quote";
import { SOURCE_LABELS } from "../../domain/status";
import { QuoteSummary } from "../quote-summary";
import { ChaletPicker, type ChaletOption } from "./chalet-picker";
import { CompanionsFields, type CompanionDraft } from "./companions-fields";
import { GuestPicker, type GuestMode, type GuestOption, type NewGuestDraft } from "./guest-picker";

const STEPS = ["Estadia", "Hóspedes", "Valores"];

/** Em qual etapa cada campo vive (para voltar até o erro que o servidor apontou). */
const FIELD_STEP: Record<string, number> = {
  chalet_id: 0,
  check_in: 0,
  check_out: 0,
  adults: 0,
  children: 0,
  source: 0,
  main_guest_id: 1,
  new_guest_name: 1,
  new_guest_phone: 1,
  new_guest_document: 1,
  companions: 1,
  nightly_rate: 2,
  discount: 2,
  notes: 2,
};

type ChaletForForm = ChaletOption & { base_guests: number };

interface NewReservationFormProps {
  chalets: ChaletForForm[];
  fees: FeeForQuote[];
  guests: GuestOption[];
  today: IsoDate;
  prefill: { chaletId?: string; checkIn?: IsoDate; guestId?: string };
}

export function NewReservationForm({ chalets, fees, guests, today, prefill }: NewReservationFormProps) {
  const [state, formAction] = useActionState(createReservation, idleFormState);
  const topRef = useRef<HTMLDivElement>(null);

  const initialChalet = chalets.find((c) => c.id === prefill.chaletId) ?? chalets[0];
  const initialCheckIn = prefill.checkIn ?? today;

  const [step, setStep] = useState(0);
  const [chaletId, setChaletId] = useState(initialChalet?.id ?? "");
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string>(addDays(initialCheckIn, 2));
  const [adults, setAdults] = useState(Math.min(2, initialChalet?.max_guests ?? 2));
  const [children, setChildren] = useState(0);
  const [source, setSource] = useState("whatsapp");
  const [guestMode, setGuestMode] = useState<GuestMode>(
    prefill.guestId || guests.length > 0 ? "existing" : "new",
  );
  const [guestId, setGuestId] = useState(prefill.guestId ?? "");
  const [newGuest, setNewGuest] = useState<NewGuestDraft>({ full_name: "", phone: "", document: "" });
  const [companions, setCompanions] = useState<CompanionDraft[]>([]);
  const [nightlyRate, setNightlyRate] = useState(formatMoneyInput(initialChalet?.base_nightly_rate ?? 0));
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(true);
  const [stepError, setStepError] = useState<string | null>(null);

  const chalet = chalets.find((c) => c.id === chaletId) ?? null;
  const nights = nightsOf(checkIn, checkOut);
  const rate = parseMoney(nightlyRate) ?? 0;
  const discountValue = parseMoney(discount) ?? 0;

  const draft = { chalet, checkIn, checkOut, adults, children, nightlyRate: rate, discount: discountValue };
  const issues = validateDraft(draft);
  // Sem useMemo: o React Compiler já memoiza este cálculo puro.
  const quote = quoteDraft(draft, fees);

  // Uma vaga de acompanhante por pessoa além do responsável; as últimas são as crianças.
  const companionSlots = Math.max(adults + children - 1, 0);
  const visibleCompanions = Array.from(
    { length: companionSlots },
    (_, index): CompanionDraft => companions[index] ?? { full_name: "", is_child: index >= companionSlots - children },
  );

  // Erro vindo do servidor: volta para a etapa do primeiro campo com problema.
  // Ajuste de estado durante a renderização (padrão recomendado pelo React em vez de setState no efeito).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "error") {
      const firstField = Object.keys(state.fieldErrors ?? {})[0];
      const target = firstField ? FIELD_STEP[firstField] : undefined;
      if (target !== undefined) setStep(target);
    }
  }

  // O efeito só sincroniza o DOM (rolagem), sem mexer em estado.
  useEffect(() => {
    if (state.status !== "error") return;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state]);

  const error = (name: string) => fieldError(state, name);

  function chooseChalet(id: string) {
    setChaletId(id);
    const next = chalets.find((c) => c.id === id);
    if (next) setNightlyRate(formatMoneyInput(next.base_nightly_rate));
  }

  function changeCheckIn(value: string) {
    setCheckIn(value);
    if (value && checkOut && nightsOf(value, checkOut) < 1) setCheckOut(addDays(value, 1));
  }

  /** Validação leve por etapa; a validação completa é no servidor e no banco. */
  function stepProblem(index: number): string | null {
    if (index === 0) {
      if (!chalet) return "Escolha o chalé.";
      if (!checkIn || !checkOut) return "Informe as datas de entrada e saída.";
      return issues.dates ?? issues.capacity ?? null;
    }
    if (index === 1) {
      if (guestMode === "existing" && !guestId) return "Escolha o hóspede responsável.";
      if (guestMode === "new" && !newGuest.full_name.trim()) return "Informe o nome do responsável.";
    }
    return null;
  }

  function goNext() {
    const problem = stepProblem(step);
    setStepError(problem);
    if (!problem) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function goBack() {
    setStepError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4 md:gap-6">
      <div ref={topRef} className="scroll-mt-4">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <FormAlert state={state} />
      {stepError ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-ink">
          {stepError}
        </p>
      ) : null}

      {/* Campos que não têm input nativo próprio */}
      <input type="hidden" name="companions" value={JSON.stringify(visibleCompanions)} />
      <input type="hidden" name="status" value={confirmed ? "confirmed" : "pending"} />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Etapa 1 — Estadia (os campos ficam no DOM em todas as etapas para irem no envio) */}
          <div hidden={step !== 0} className="flex flex-col gap-4 md:gap-6">
            <ChaletPicker chalets={chalets} value={chaletId} onChange={chooseChalet} error={error("chalet_id")} />

            <FormSection title="Datas">
              <FieldRow>
                <Field
                  label="Entrada"
                  name="check_in"
                  type="date"
                  value={checkIn}
                  onChange={(event) => changeCheckIn(event.target.value)}
                  error={error("check_in")}
                />
                <Field
                  label="Saída"
                  name="check_out"
                  type="date"
                  min={checkIn ? addDays(checkIn, 1) : undefined}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  error={error("check_out") ?? issues.dates}
                />
              </FieldRow>
              {nights > 0 ? (
                <p className="rounded-xl bg-primary-soft px-4 py-2.5 text-sm font-semibold text-primary-ink">
                  {pluralize(nights, "noite", "noites")}
                </p>
              ) : null}
            </FormSection>

            <FormSection title="Pessoas">
              <div className="divide-y divide-line">
                <NumberStepper
                  name="adults"
                  label="Adultos"
                  description={chalet ? `${chalet.base_guests} inclusos na diária` : undefined}
                  min={1}
                  max={30}
                  value={adults}
                  onChange={setAdults}
                />
                <NumberStepper name="children" label="Crianças" min={0} max={30} value={children} onChange={setChildren} />
              </div>
              {issues.capacity ? <p className="text-xs font-semibold text-danger-ink">{issues.capacity}</p> : null}
              <SelectField
                label="Como chegou a reserva"
                name="source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </FormSection>
          </div>

          {/* Etapa 2 — Hóspedes */}
          <div hidden={step !== 1} className="flex flex-col gap-4 md:gap-6">
            <FormSection title="Responsável pela reserva">
              <GuestPicker
                guests={guests}
                mode={guestMode}
                onModeChange={setGuestMode}
                selectedId={guestId}
                onSelect={setGuestId}
                newGuest={newGuest}
                onNewGuestChange={setNewGuest}
                errors={{
                  main_guest_id: error("main_guest_id"),
                  new_guest_name: error("new_guest_name"),
                  new_guest_phone: error("new_guest_phone"),
                  new_guest_document: error("new_guest_document"),
                }}
              />
            </FormSection>
            {companionSlots > 0 ? (
              <FormSection title="Quem mais vem">
                <CompanionsFields companions={visibleCompanions} onChange={setCompanions} />
              </FormSection>
            ) : null}
          </div>

          {/* Etapa 3 — Valores */}
          <div hidden={step !== 2} className="flex flex-col gap-4 md:gap-6">
            <FormSection title="Valores">
              <FieldRow>
                <Field
                  label="Diária (R$)"
                  name="nightly_rate"
                  inputMode="decimal"
                  value={nightlyRate}
                  onChange={(event) => setNightlyRate(event.target.value)}
                  error={error("nightly_rate")}
                />
                <Field
                  label="Desconto total (R$)"
                  name="discount"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  error={error("discount")}
                />
              </FieldRow>
              <TextareaField
                label="Observações"
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Horário de chegada, pedidos especiais…"
                error={error("notes")}
              />
              <SwitchField
                label="Reserva confirmada"
                description="Desligue se ainda aguarda o sinal ou a confirmação do hóspede."
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
            </FormSection>

            {quote ? (
              <Card className="p-4 md:p-6 lg:hidden">
                <QuoteSummary quote={quote} nights={nights} nightlyRate={rate} discount={discountValue} />
              </Card>
            ) : null}
          </div>
        </div>

        {/* Desktop: resumo sempre visível ao lado */}
        <aside aria-label="Resumo da reserva" className="hidden lg:sticky lg:top-6 lg:block">
          <Card className="p-6">
            <p className="mb-3 font-display text-lg font-semibold">{chalet?.name ?? "Resumo"}</p>
            {quote ? (
              <QuoteSummary quote={quote} nights={nights} nightlyRate={rate} discount={discountValue} />
            ) : (
              <p className="text-sm text-ink-muted">Escolha chalé e datas para ver os valores.</p>
            )}
          </Card>
        </aside>
      </div>

      {/* Barra de ações: fixa acima da navegação no celular */}
      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="min-w-0 flex-1 md:hidden">
          <p className="text-[11px] text-ink-muted">Previsto{nights > 0 ? ` · ${pluralize(nights, "noite", "noites")}` : ""}</p>
          <p className="font-display text-xl leading-tight font-semibold">{quote ? formatCurrency(quote.total) : "—"}</p>
        </div>
        {step > 0 ? (
          <Button variant="secondary" size="icon" onClick={goBack} aria-label="Etapa anterior" className="md:w-auto md:px-5">
            <ChevronLeft aria-hidden="true" />
            <span className="hidden md:inline">Voltar</span>
          </Button>
        ) : null}
        {isLastStep ? (
          <SubmitButton size="lg" pendingLabel="Criando…">
            Criar reserva
          </SubmitButton>
        ) : (
          <Button size="lg" onClick={goNext}>
            Continuar
          </Button>
        )}
      </div>
    </form>
  );
}
