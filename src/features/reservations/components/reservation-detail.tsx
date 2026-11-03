import { MessageCircle, Phone, Zap } from "lucide-react";
import Link from "next/link";

import { paths } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardSection } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { whatsappUrl } from "@/features/guests/domain";
import { formatLongDate } from "@/lib/dates";
import { formatCurrency, formatDecimal, pluralize } from "@/lib/format";

import type { ReservationDetailRecord } from "../data/reservations.repository";
import { paidRatio } from "../domain/payments";
import { SOURCE_LABELS } from "../domain/status";
import { PaymentStatusBadge } from "./payment-status-badge";
import { ReservationStatusBadge } from "./reservation-status-badge";
import { StatusActions } from "./status-actions";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function ReservationDetail({ detail }: { detail: ReservationDetailRecord }) {
  const { reservation, financials, chalet, mainGuest, guests, charges } = detail;
  const whatsapp = whatsappUrl(mainGuest.phone, `Olá, ${mainGuest.full_name.split(" ")[0]}! Sobre sua reserva no ${chalet.name}:`);
  const people = reservation.adults + reservation.children;

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Resumo */}
        <Card className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex flex-wrap gap-2">
            <ReservationStatusBadge status={reservation.status} />
            {reservation.status !== "cancelled" ? <PaymentStatusBadge status={financials.payment_status} /> : null}
            <Badge tone="neutral">via {SOURCE_LABELS[reservation.source]}</Badge>
          </div>

          <Link href={paths.guest(mainGuest.id)} className="flex items-center gap-3 text-ink">
            <Avatar name={mainGuest.full_name} size="lg" />
            <span className="min-w-0">
              <span className="block truncate font-display text-2xl font-semibold">{mainGuest.full_name}</span>
              <span className="block text-sm text-ink-muted">
                {chalet.name} · {pluralize(reservation.nights, "noite", "noites")} · {pluralize(people, "pessoa", "pessoas")}
              </span>
            </span>
          </Link>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-canvas px-4 py-3">
              <p className="text-xs font-medium text-ink-muted">Entrada</p>
              <p className="text-[15px] font-bold">{capitalize(formatLongDate(reservation.check_in))}</p>
              <p className="text-xs text-ink-muted">a partir de {chalet.check_in_time.slice(0, 5)}</p>
            </div>
            <div className="rounded-2xl bg-canvas px-4 py-3">
              <p className="text-xs font-medium text-ink-muted">Saída</p>
              <p className="text-[15px] font-bold">{capitalize(formatLongDate(reservation.check_out))}</p>
              <p className="text-xs text-ink-muted">até {chalet.check_out_time.slice(0, 5)}</p>
            </div>
          </div>

          <StatusActions reservationId={reservation.id} status={reservation.status} />

          {whatsapp || mainGuest.phone ? (
            <div className="grid grid-cols-2 gap-2.5">
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "soft" })}>
                  <MessageCircle aria-hidden="true" />
                  WhatsApp
                </a>
              ) : null}
              {mainGuest.phone ? (
                <a href={`tel:${mainGuest.phone.replace(/\D/g, "")}`} className={buttonVariants({ variant: "secondary" })}>
                  <Phone aria-hidden="true" />
                  Ligar
                </a>
              ) : null}
            </div>
          ) : null}
        </Card>

        {/* Pessoas */}
        <CardSection title={`Quem vem (${people})`} titleId="reservation-guests">
          <ul className="divide-y divide-line">
            {guests.map((guest) => (
              <li key={guest.id} className="flex items-center gap-3 py-3">
                <Avatar name={guest.full_name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{guest.full_name}</span>
                  <span className="block text-xs text-ink-muted">
                    {guest.is_main ? "Responsável" : guest.is_child ? "Criança" : "Adulto"}
                    {guest.document ? ` · ${guest.document}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {guests.length < people ? (
            <p className="mt-2 text-xs text-ink-muted">
              {pluralize(people - guests.length, "pessoa sem nome informado", "pessoas sem nome informado")}.
            </p>
          ) : null}
        </CardSection>

        {/* Valores */}
        <CardSection title="Hospedagem e taxas" titleId="reservation-charges">
          <dl className="divide-y divide-line text-sm">
            <div className="flex justify-between gap-4 py-3">
              <dt>
                <span className="font-semibold">Hospedagem</span>
                <span className="block text-xs text-ink-muted">
                  {pluralize(reservation.nights, "noite", "noites")} × {formatCurrency(reservation.nightly_rate)}
                  {reservation.discount > 0 ? ` − ${formatCurrency(reservation.discount)}` : ""}
                </span>
              </dt>
              <dd className="font-semibold">{formatCurrency(reservation.lodging_total)}</dd>
            </div>
            {charges.map((charge) => (
              <div key={charge.id} className="flex justify-between gap-4 py-3">
                <dt>
                  <span className="flex items-center gap-1.5 font-semibold">
                    {charge.kind === "energy" ? <Zap className="size-4 text-energy-ink" aria-hidden="true" /> : null}
                    {charge.description}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {charge.mode === "metered"
                      ? charge.meter_end === null
                        ? `leitura de entrada ${charge.meter_start === null ? "pendente" : formatDecimal(charge.meter_start) + " kWh"} · saída pendente`
                        : `${formatDecimal(charge.quantity)} kWh × ${formatCurrency(charge.unit_amount)}`
                      : `${formatDecimal(charge.quantity)} × ${formatCurrency(charge.unit_amount)}`}
                  </span>
                </dt>
                <dd className="font-semibold">{formatCurrency(charge.total)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-1 flex items-baseline justify-between border-t-2 border-ink pt-3">
            <span className="font-display text-lg font-semibold">Total</span>
            <span className="font-display text-2xl font-semibold">{formatCurrency(financials.grand_total)}</span>
          </div>
          <p className="mt-3 text-xs text-ink-muted">Leitura do medidor e taxas avulsas entram na parte 4.</p>
        </CardSection>

        {reservation.notes ? (
          <Card className="bg-[#f9ede3] p-4 shadow-none md:p-6">
            <p className="mb-1 font-display text-lg font-semibold">Observações</p>
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">{reservation.notes}</p>
          </Card>
        ) : null}
      </div>

      {/* Saldo */}
      <aside aria-label="Pagamento" className="flex flex-col gap-4 lg:sticky lg:top-6">
        <Card className="flex flex-col gap-3 bg-primary-strong p-5 text-[#f5efe6] shadow-[0_12px_26px_rgb(52_80_42/0.25)]">
          <p className="text-sm text-[#cfdcc2]">Saldo a receber</p>
          <p className="font-display text-4xl leading-none font-semibold text-on-primary">
            {formatCurrency(Math.max(financials.balance_due, 0))}
          </p>
          <ProgressBar
            value={paidRatio(financials.grand_total, financials.paid_total)}
            label="Quanto já foi pago"
            trackClassName="bg-white/20"
            barClassName="bg-[#e8b98f]"
          />
          <div className="flex justify-between text-xs text-[#cfdcc2]">
            <span>Pago {formatCurrency(financials.paid_total)}</span>
            <span>de {formatCurrency(financials.grand_total)}</span>
          </div>
          <p className="rounded-xl bg-white/10 px-3 py-2 text-xs text-[#cfdcc2]">
            Registro de pagamentos entra na parte 4.
          </p>
        </Card>
      </aside>
    </div>
  );
}
