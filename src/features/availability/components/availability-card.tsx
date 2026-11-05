import { AlertTriangle, CalendarOff, RefreshCw, X } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { CopyField } from "@/components/ui/copy-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { addDays, formatShortDate } from "@/lib/dates";

import {
  addIcalSource,
  createBlock,
  deleteBlock,
  regenerateIcalLink,
  removeIcalSource,
  syncChaletCalendars,
} from "../actions";
import type { ChaletAvailability } from "../services";
import { BlockForm } from "./block-form";
import { IcalSourceForm } from "./ical-source-form";

const syncedFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function nightsLabel(startsOn: string, endsOn: string): string {
  const last = addDays(endsOn, -1);
  return startsOn === last ? formatShortDate(startsOn) : `${formatShortDate(startsOn)} a ${formatShortDate(last)}`;
}

/** Bloqueios, calendários de outras plataformas e o link iCal deste bangalô. */
export function AvailabilityCard({ chaletId, availability }: { chaletId: string; availability: ChaletAvailability }) {
  const manual = availability.blocks.filter((block) => block.source === "manual");
  const imported = availability.blocks.filter((block) => block.source === "ical");

  return (
    <CardSection title="Disponibilidade" titleId="availability">
      {/* Bloqueios manuais */}
      <h3 className="mb-1 text-sm font-bold">Datas bloqueadas</h3>
      <p className="mb-3 text-sm text-ink-muted">Manutenção ou uso próprio: o calendário mostra e a nova reserva não deixa usar.</p>
      {manual.length > 0 ? (
        <ul className="mb-3 divide-y divide-line">
          {manual.map((block) => (
            <li key={block.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
              <CalendarOff className="size-4 text-ink-muted" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{block.reason}</span>
                <span className="block text-xs text-ink-muted">noites de {nightsLabel(block.starts_on, block.ends_on)}</span>
              </span>
              <ActionForm action={deleteBlock.bind(null, chaletId, block.id)} className="contents">
                <ConfirmSubmit
                  message={`Liberar as datas de “${block.reason}”?`}
                  confirmLabel="Liberar"
                  pendingLabel="Liberando…"
                  triggerSize="icon"
                  triggerLabel={`Remover bloqueio ${block.reason}`}
                  block={false}
                  className="size-11 text-ink-muted md:size-9"
                >
                  <X aria-hidden="true" />
                </ConfirmSubmit>
              </ActionForm>
            </li>
          ))}
        </ul>
      ) : null}
      <BlockForm action={createBlock.bind(null, chaletId)} />

      {/* Importar de outras plataformas */}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="mb-1 text-sm font-bold">Calendários de outras plataformas</h3>
        <p className="mb-3 text-sm text-ink-muted">
          As datas ocupadas no Airbnb/Booking aparecem aqui como bloqueio. Atualiza sozinho ao abrir o calendário (a cada 6 h).
        </p>
        {availability.sources.length > 0 ? (
          <ul className="mb-3 divide-y divide-line">
            {availability.sources.map((source) => (
              <li key={source.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">{source.label}</span>
                  <span className="block truncate text-xs text-ink-muted">{new URL(source.url).hostname}</span>
                  {source.last_error ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-danger-ink">
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      {source.last_error}
                    </span>
                  ) : source.last_synced_at ? (
                    <span className="block text-xs text-ink-muted">
                      lido em {syncedFormatter.format(new Date(source.last_synced_at))} ·{" "}
                      {imported.filter((block) => block.reason === source.label).length} período(s)
                    </span>
                  ) : null}
                </span>
                <ActionForm action={removeIcalSource.bind(null, chaletId, source.id)} className="contents">
                  <ConfirmSubmit
                    message={`Desligar “${source.label}”? As datas importadas dele somem do calendário.`}
                    confirmLabel="Desligar"
                    pendingLabel="Desligando…"
                    triggerSize="icon"
                    triggerLabel={`Desligar ${source.label}`}
                    block={false}
                    className="size-11 text-ink-muted md:size-9"
                  >
                    <X aria-hidden="true" />
                  </ConfirmSubmit>
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-col gap-2">
          {availability.sources.length > 0 ? (
            <ActionForm action={syncChaletCalendars.bind(null, chaletId)}>
              <SubmitButton variant="secondary" block pendingLabel="Sincronizando…">
                <RefreshCw aria-hidden="true" />
                Sincronizar agora
              </SubmitButton>
            </ActionForm>
          ) : null}
          <IcalSourceForm action={addIcalSource.bind(null, chaletId)} />
        </div>
      </div>

      {/* Exportar para outras plataformas */}
      {availability.feedUrl ? (
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
          <h3 className="text-sm font-bold">Levar estas reservas para o Airbnb/Booking</h3>
          <CopyField
            label="Link iCal deste bangalô"
            value={availability.feedUrl}
            hint="Cole em “Importar calendário” na outra plataforma. Só mostra datas ocupadas, sem dados de hóspedes."
          />
          <ActionForm action={regenerateIcalLink.bind(null, chaletId)}>
            <ConfirmSubmit
              message="Gerar um novo link? O antigo para de funcionar e você precisa colar o novo nas plataformas."
              confirmLabel="Gerar novo"
              pendingLabel="Gerando…"
              triggerVariant="ghost"
              triggerSize="sm"
              block={false}
              className="text-ink-soft"
            >
              Gerar novo link
            </ConfirmSubmit>
          </ActionForm>
        </div>
      ) : null}
    </CardSection>
  );
}
