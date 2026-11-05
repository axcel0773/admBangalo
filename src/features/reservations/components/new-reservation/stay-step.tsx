"use client";

import { Field } from "@/components/ui/field";
import { FieldRow, FormSection } from "@/components/ui/form-layout";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SelectField } from "@/components/ui/select-field";
import type { blockWarning } from "@/features/availability/domain/blocks";
import { addDays } from "@/lib/dates";
import { pluralize } from "@/lib/format";

import { SOURCE_LABELS } from "../../domain/status";
import { ChaletPicker, type ChaletOption } from "./chalet-picker";

interface StayStepProps {
  chalets: ChaletOption[];
  chalet: ChaletOption | null;
  chaletId: string;
  onChaletChange: (id: string) => void;
  checkIn: string;
  checkOut: string;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  nights: number;
  seasonal: boolean;
  blocked: ReturnType<typeof blockWarning>;
  minNightsWarning: string | null;
  dateIssue?: string;
  capacityIssue?: string;
  maxGuests: number;
  adults: number;
  childCount: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  /** Sem `onSourceChange` o campo “Como chegou a reserva” não aparece (o orçamento não tem origem). */
  source?: string;
  onSourceChange?: (value: string) => void;
  error: (name: string) => string | undefined;
}

/** Etapa 1 da nova reserva: bangalô, datas, pessoas e origem. */
export function StayStep({
  chalets,
  chalet,
  chaletId,
  onChaletChange,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  nights,
  seasonal,
  blocked,
  minNightsWarning,
  dateIssue,
  capacityIssue,
  maxGuests,
  adults,
  childCount,
  onAdultsChange,
  onChildrenChange,
  source,
  onSourceChange,
  error,
}: StayStepProps) {
  return (
    <>
      <ChaletPicker chalets={chalets} value={chaletId} onChange={onChaletChange} error={error("chalet_id")} />

      <FormSection title="Datas">
        <FieldRow>
          <Field
            label="Entrada"
            name="check_in"
            type="date"
            value={checkIn}
            onChange={(event) => onCheckInChange(event.target.value)}
            error={error("check_in")}
          />
          <Field
            label="Saída"
            name="check_out"
            type="date"
            min={checkIn ? addDays(checkIn, 1) : undefined}
            value={checkOut}
            onChange={(event) => onCheckOutChange(event.target.value)}
            error={error("check_out") ?? dateIssue}
          />
        </FieldRow>
        {nights > 0 ? (
          <p className="rounded-xl bg-primary-soft px-4 py-2.5 text-sm font-semibold text-primary-ink">
            {pluralize(nights, "noite", "noites")}
            {seasonal ? " · com tarifa de temporada" : ""}
          </p>
        ) : null}
        {blocked ? (
          <p
            role="status"
            className={
              blocked.blocking
                ? "rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger-ink"
                : "rounded-xl bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent-ink"
            }
          >
            {blocked.message}
          </p>
        ) : null}
        {minNightsWarning ? (
          <p role="status" className="rounded-xl bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent-ink">
            {minNightsWarning} Você pode seguir mesmo assim.
          </p>
        ) : null}
      </FormSection>

      <FormSection title="Pessoas">
        <div className="divide-y divide-line">
          <NumberStepper
            name="adults"
            label="Adultos"
            description={chalet ? `até ${maxGuests} pessoas no total` : undefined}
            min={1}
            max={Math.max(1, maxGuests - childCount)}
            value={adults}
            onChange={onAdultsChange}
          />
          <NumberStepper
            name="children"
            label="Crianças"
            min={0}
            max={Math.max(0, maxGuests - adults)}
            value={childCount}
            onChange={onChildrenChange}
          />
        </div>
        {capacityIssue ? <p className="text-xs font-semibold text-danger-ink">{capacityIssue}</p> : null}
        {onSourceChange ? (
          <SelectField
            label="Como chegou a reserva"
            name="source"
            value={source ?? "direct"}
            onChange={(event) => onSourceChange(event.target.value)}
            options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        ) : null}
      </FormSection>
    </>
  );
}
