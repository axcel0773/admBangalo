import { FileText, MessageCircle, Phone, Repeat } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { paths } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Card, CardSection } from "@/components/ui/card";
import { whatsappUrl } from "@/features/guests/domain";
import { formatLongDate } from "@/lib/dates";
import { pluralize } from "@/lib/format";

import type { ReservationDetailRecord } from "../data/reservations.repository";
import { availableReminders, confirmationMessage, type ConfirmationInput } from "../domain/messages";
import { SOURCE_LABELS } from "../domain/status";
import { PaymentStatusBadge } from "./payment-status-badge";
import { ReservationStatusBadge } from "./reservation-status-badge";
import { StatusActions } from "./status-actions";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface ReservationDetailProps {
  detail: ReservationDetailRecord;
  /** Cartões de cobrança (taxas, energia), montados pela página. */
  billing?: ReactNode;
  /** Coluna lateral (saldo e pagamentos). */
  aside?: ReactNode;
  /** Assinatura da mensagem de confirmação. */
  businessName: string;
}

export function ReservationDetail({ detail, billing, aside, businessName }: ReservationDetailProps) {
  const { reservation, financials, chalet, mainGuest, guests } = detail;
  const people = reservation.adults + reservation.children;
  const messageInput: ConfirmationInput = {
    guestName: mainGuest.full_name,
    chaletName: chalet.name,
    businessName,
    status: reservation.status,
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    checkInTime: chalet.check_in_time,
    checkOutTime: chalet.check_out_time,
    guests: people,
    nights: reservation.nights,
    total: financials.grand_total,
    paid: financials.paid_total,
  };
  const confirmation = confirmationMessage(messageInput);
  const reminders = availableReminders(messageInput).map((reminder) => ({
    ...reminder,
    href: whatsappUrl(mainGuest.phone, reminder.message),
  }));
  const whatsapp = reservation.status === "cancelled" ? null : whatsappUrl(mainGuest.phone, confirmation);

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

          <div className="grid grid-cols-2 gap-2.5">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "soft", className: "col-span-2 sm:col-span-1" })}
              >
                <MessageCircle aria-hidden="true" />
                Enviar confirmação
              </a>
            ) : null}
            {mainGuest.phone ? (
              <a href={`tel:${mainGuest.phone.replace(/\D/g, "")}`} className={buttonVariants({ variant: "secondary" })}>
                <Phone aria-hidden="true" />
                Ligar
              </a>
            ) : null}
            <ButtonLink href={paths.receipt(reservation.id)} variant="secondary">
              <FileText aria-hidden="true" />
              Recibo
            </ButtonLink>
            <ButtonLink
              href={paths.newReservation({
                chalet: reservation.chalet_id,
                adults: reservation.adults,
                children: reservation.children,
                guest: mainGuest.id,
              })}
              variant="secondary"
            >
              <Repeat aria-hidden="true" />
              Reservar de novo
            </ButtonLink>
          </div>

          {reminders.some((reminder) => reminder.href) ? (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">Lembretes no WhatsApp</p>
              <div className="flex flex-wrap gap-2">
                {reminders.map((reminder) =>
                  reminder.href ? (
                    <a
                      key={reminder.kind}
                      href={reminder.href}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      <MessageCircle aria-hidden="true" />
                      {reminder.label}
                    </a>
                  ) : null,
                )}
              </div>
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

        {billing}

        {reservation.notes ? (
          <Card className="bg-[#f9ede3] dark:bg-[#33281f] p-4 shadow-none md:p-6">
            <p className="mb-1 font-display text-lg font-semibold">Observações</p>
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">{reservation.notes}</p>
          </Card>
        ) : null}
      </div>

      {/* Saldo e pagamentos */}
      {aside ? (
        <aside aria-label="Pagamento" className="flex flex-col gap-4 lg:sticky lg:top-6">
          {aside}
        </aside>
      ) : null}
    </div>
  );
}
