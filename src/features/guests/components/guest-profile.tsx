import { CalendarPlus, Mail, MessageCircle, Pencil } from "lucide-react";

import { paths } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Card, CardSection } from "@/components/ui/card";
import { ListRow } from "@/components/ui/list-row";
import { PaymentStatusBadge } from "@/features/reservations/components/payment-status-badge";
import { formatShortDate, formatStayRange } from "@/lib/dates";
import { formatCurrency, pluralize } from "@/lib/format";

import { formatCityState, whatsappUrl, type Guest, type GuestStay } from "../domain";

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export function GuestProfile({ guest, stays }: { guest: Guest; stays: GuestStay[] }) {
  const whatsapp = whatsappUrl(guest.phone, `Olá, ${guest.full_name.split(" ")[0]}!`);
  const totalSpent = stays.filter((s) => s.status !== "cancelled").reduce((sum, s) => sum + s.grand_total, 0);

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden">
          <div className="h-16 bg-[#e3ead6]" />
          <div className="flex flex-col gap-4 px-5 pb-5">
            <Avatar name={guest.full_name} size="xl" className="-mt-9 ring-4 ring-surface" />
            <div>
              <p className="font-display text-2xl font-semibold">{guest.full_name}</p>
              <p className="text-sm text-ink-muted">
                {pluralize(stays.length, "estadia", "estadias")} · {formatCurrency(totalSpent)} em reservas
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "soft", size: "md" })}>
                  <MessageCircle aria-hidden="true" />
                  WhatsApp
                </a>
              ) : null}
              {guest.email ? (
                <a href={`mailto:${guest.email}`} className={buttonVariants({ variant: "secondary", size: "md" })}>
                  <Mail aria-hidden="true" />
                  E-mail
                </a>
              ) : null}
            </div>
            <dl className="divide-y divide-line">
              <InfoItem label="Documento" value={guest.document} />
              <InfoItem label="Telefone" value={guest.phone} />
              <InfoItem label="E-mail" value={guest.email} />
              <InfoItem label="Nascimento" value={guest.birth_date ? formatShortDate(guest.birth_date) + `/${guest.birth_date.slice(0, 4)}` : null} />
              <InfoItem label="Cidade" value={formatCityState(guest)} />
            </dl>
            {guest.notes ? (
              <p className="rounded-2xl bg-[#f9ede3] px-4 py-3 text-sm leading-relaxed text-ink-soft">
                <b className="text-accent-ink">Observações: </b>
                {guest.notes}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href={paths.editGuest(guest.id)} variant="secondary">
                <Pencil aria-hidden="true" />
                Editar
              </ButtonLink>
              <ButtonLink href={paths.newReservation({ guest: guest.id })}>
                <CalendarPlus aria-hidden="true" />
                Reservar
              </ButtonLink>
            </div>
          </div>
        </Card>
      </div>

      <CardSection title="Estadias" titleId="guest-stays">
        {stays.length === 0 ? (
          <p className="py-4 text-sm text-ink-muted">Nenhuma estadia ainda.</p>
        ) : (
          <ul className="divide-y divide-line">
            {stays.map((stay) => (
              <ListRow
                key={stay.reservation_id}
                href={paths.reservation(stay.reservation_id)}
                title={`${formatStayRange(stay.check_in, stay.check_out)} ${stay.check_in.slice(0, 4)}`}
                subtitle={`${stay.chalet_name} · ${pluralize(stay.guests_count, "pessoa", "pessoas")} · ${formatCurrency(stay.grand_total)}`}
                trailing={<PaymentStatusBadge status={stay.payment_status} />}
              />
            ))}
          </ul>
        )}
      </CardSection>
    </div>
  );
}
