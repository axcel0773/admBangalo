"use client";

import { ChevronLeft } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { FormSection } from "@/components/ui/form-layout";
import { StepIndicator } from "@/components/ui/step-indicator";
import { SubmitButton } from "@/components/ui/submit-button";
import { blockWarning, overlappingBlocks, type ChaletBlock } from "@/features/availability/domain/blocks";
import { MAX_CHALET_GUESTS } from "@/features/chalets/domain";
import { addDays, type IsoDate } from "@/lib/dates";
import { fieldError, idleFormState } from "@/lib/forms";
import { formatCurrency, formatMoneyInput, pluralize } from "@/lib/format";
import { parseMoney } from "@/lib/money";

import { createReservation } from "../../actions";
import { nightsOf, quoteDraft, validateDraft, type FeeForQuote } from "../../domain/quote";
import { nightlyBreakdown, type SeasonRate } from "../../domain/seasons";
import { QuoteSummary } from "../quote-summary";
import type { ChaletOption } from "./chalet-picker";
import { CompanionsFields, type CompanionDraft } from "./companions-fields";
import { PricingStep } from "./pricing-step";
import { StayStep } from "./stay-step";
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
  seasons: SeasonRate[];
  blocks: ChaletBlock[];
  today: IsoDate;
  prefill: {
    chaletId?: string;
    checkIn?: IsoDate;
    checkOut?: IsoDate;
    adults?: number;
    children?: number;
    guestId?: string;
    /** Responsável novo vindo de um orçamento. */
    guestName?: string;
    guestPhone?: string;
    /** Orçamento de origem (vira "aceito" quando a reserva é criada). */
    quoteId?: string;
  };
}

export function NewReservationForm({ chalets, fees, guests, seasons, blocks, today, prefill }: NewReservationFormProps) {
  const [state, formAction] = useActionState(createReservation, idleFormState);
  const topRef = useRef<HTMLDivElement>(null);

  const initialChalet = chalets.find((c) => c.id === prefill.chaletId) ?? chalets[0];
  const initialCheckIn = prefill.checkIn ?? today;

  const [step, setStep] = useState(0);
  const [chaletId, setChaletId] = useState(initialChalet?.id ?? "");
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const maxGuests = initialChalet?.max_guests ?? MAX_CHALET_GUESTS;
  const prefillCheckOut = prefill.checkOut && prefill.checkOut > initialCheckIn ? prefill.checkOut : undefined;
  const [checkOut, setCheckOut] = useState<string>(prefillCheckOut ?? addDays(initialCheckIn, 2));
  const [adults, setAdults] = useState(Math.min(Math.max(prefill.adults ?? 2, 1), maxGuests));
  const [children, setChildren] = useState(Math.min(prefill.children ?? 0, Math.max(maxGuests - Math.max(prefill.adults ?? 2, 1), 0)));
  const [source, setSource] = useState("whatsapp");
  const [guestMode, setGuestMode] = useState<GuestMode>(
    prefill.guestName ? "new" : prefill.guestId || guests.length > 0 ? "existing" : "new",
  );
  const [guestId, setGuestId] = useState(prefill.guestId ?? "");
  const [newGuest, setNewGuest] = useState<NewGuestDraft>({
    full_name: prefill.guestName ?? "",
    phone: prefill.guestPhone ?? "",
    document: "",
  });
  const [companions, setCompanions] = useState<CompanionDraft[]>([]);
  // Diária: segue a sugestão (base ou média da temporada) até o dono digitar outra.
  const [nightlyRate, setNightlyRate] = useState("");
  const [rateTouched, setRateTouched] = useState(false);
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(true);
  const [stepError, setStepError] = useState<string | null>(null);

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
  const blocked = chalet && nights > 0 ? blockWarning(overlappingBlocks(blocks, chalet.id, checkIn, checkOut)) : null;
  const minNightsWarning = breakdown?.minNightsIssue
    ? `A temporada “${breakdown.minNightsIssue.label}” pede no mínimo ${pluralize(breakdown.minNightsIssue.minNights, "noite", "noites")}.`
    : null;
  const rateHint = rateTouched
    ? undefined
    : breakdown?.seasonal
      ? "Média das noites, com a tarifa de temporada."
      : "Diária base do bangalô.";
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
    setRateTouched(false);
  }

  function changeCheckIn(value: string) {
    setCheckIn(value);
    if (value && checkOut && nightsOf(value, checkOut) < 1) setCheckOut(addDays(value, 1));
  }

  /** Validação leve por etapa; a validação completa é no servidor e no banco. */
  function stepProblem(index: number): string | null {
    if (index === 0) {
      if (!chalet) return "Escolha o bangalô.";
      if (!checkIn || !checkOut) return "Informe as datas de entrada e saída.";
      return issues.dates ?? issues.capacity ?? (blocked?.blocking ? blocked.message : null);
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
      {prefill.quoteId ? <input type="hidden" name="quote_id" value={prefill.quoteId} /> : null}
      <input type="hidden" name="companions" value={JSON.stringify(visibleCompanions)} />
      <input type="hidden" name="status" value={confirmed ? "confirmed" : "pending"} />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Etapa 1 — Estadia (os campos ficam no DOM em todas as etapas para irem no envio) */}
          <div hidden={step !== 0} className="flex flex-col gap-4 md:gap-6">
            <StayStep
              chalets={chalets}
              chalet={chalet}
              chaletId={chaletId}
              onChaletChange={chooseChalet}
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
              source={source}
              onSourceChange={setSource}
              error={error}
            />
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
            <PricingStep
              rateText={rateText}
              rateHint={rateHint}
              onRateChange={(value) => {
                setNightlyRate(value);
                setRateTouched(true);
              }}
              discount={discount}
              onDiscountChange={setDiscount}
              notes={notes}
              onNotesChange={setNotes}
              confirmed={confirmed}
              onConfirmedChange={setConfirmed}
              error={error}
            />
            {quote ? (
              <Card className="p-4 md:p-6 lg:hidden">
                <QuoteSummary quote={quote} nights={nights} nightlyRate={rate} discount={discountValue} seasonGroups={breakdown?.seasonal && !rateTouched ? breakdown.groups : undefined} />
              </Card>
            ) : null}
          </div>
        </div>

        {/* Desktop: resumo sempre visível ao lado */}
        <aside aria-label="Resumo da reserva" className="hidden lg:sticky lg:top-6 lg:block">
          <Card className="p-6">
            <p className="mb-3 font-display text-lg font-semibold">{chalet?.name ?? "Resumo"}</p>
            {quote ? (
              <QuoteSummary quote={quote} nights={nights} nightlyRate={rate} discount={discountValue} seasonGroups={breakdown?.seasonal && !rateTouched ? breakdown.groups : undefined} />
            ) : (
              <p className="text-sm text-ink-muted">Escolha bangalô e datas para ver os valores.</p>
            )}
          </Card>
        </aside>
      </div>

      {/* Barra de ações: fixa acima da navegação no celular */}
      <div className="keyboard-static sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
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
