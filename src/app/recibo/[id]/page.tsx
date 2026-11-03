import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { paths } from "@/components/layout/navigation";
import { PrintButton } from "@/components/ui/print-button";
import { getReservationBilling, PAYMENT_KIND_LABELS, PAYMENT_METHOD_LABELS } from "@/features/billing";
import { getMyProfile } from "@/features/profile/services";
import { getReservationDetail } from "@/features/reservations";
import { formatShortDate, todayIso } from "@/lib/dates";
import { formatCurrency, formatDecimal, pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Recibo", robots: { index: false } };

/** Recibo da reserva em página própria (sem menu), pensado para imprimir ou salvar em PDF. */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, profile] = await Promise.all([getReservationDetail(id), getMyProfile()]);
  if (!detail) notFound();

  const { reservation, financials, chalet, mainGuest, guests, charges } = detail;
  const billing = await getReservationBilling({
    reservationId: id,
    chaletId: reservation.chalet_id,
    balance: financials.balance_due,
    paid: financials.paid_total,
  });
  const issuer = profile?.business_name || profile?.full_name || "Chalés";
  const number = id.slice(0, 8).toUpperCase();

  return (
    <main className="mx-auto max-w-2xl bg-surface p-5 text-ink print:max-w-none print:p-0 md:my-8 md:rounded-card md:p-10 md:shadow-card print:shadow-none">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link href={paths.reservation(id)} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
        <PrintButton size="sm" />
      </div>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <p className="font-display text-2xl font-semibold">{issuer}</p>
          {profile?.phone ? <p className="text-sm text-ink-soft">{profile.phone}</p> : null}
        </div>
        <div className="text-right text-sm">
          <p className="font-display text-xl font-semibold">Recibo</p>
          <p className="text-ink-soft">nº {number}</p>
          <p className="text-ink-soft">emitido em {formatShortDate(todayIso())}</p>
        </div>
      </header>

      <section className="mb-6 grid gap-1 text-sm">
        <p>
          <span className="text-ink-muted">Hóspede: </span>
          <strong>{mainGuest.full_name}</strong>
          {mainGuest.document ? ` · ${mainGuest.document}` : ""}
        </p>
        <p>
          <span className="text-ink-muted">Hospedagem: </span>
          {chalet.name} · entrada {formatShortDate(reservation.check_in)} às {chalet.check_in_time.slice(0, 5)} · saída{" "}
          {formatShortDate(reservation.check_out)} às {chalet.check_out_time.slice(0, 5)}
        </p>
        <p>
          <span className="text-ink-muted">Pessoas: </span>
          {guests.map((guest) => guest.full_name).join(", ") || pluralize(reservation.adults + reservation.children, "pessoa", "pessoas")}
        </p>
      </section>

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink-muted">
            <th className="py-2 font-medium">Descrição</th>
            <th className="py-2 text-right font-medium">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          <tr>
            <td className="py-2">
              Hospedagem: {pluralize(reservation.nights, "noite", "noites")} × {formatCurrency(reservation.nightly_rate)}
              {reservation.discount > 0 ? ` − desconto ${formatCurrency(reservation.discount)}` : ""}
            </td>
            <td className="py-2 text-right tabular-nums">{formatCurrency(reservation.lodging_total)}</td>
          </tr>
          {charges.map((charge) => (
            <tr key={charge.id}>
              <td className="py-2">
                {charge.description}
                {charge.mode === "metered"
                  ? ` (${formatDecimal(charge.quantity)} kWh × ${formatCurrency(charge.unit_amount)})`
                  : charge.quantity !== 1
                    ? ` (${formatDecimal(charge.quantity)} × ${formatCurrency(charge.unit_amount)})`
                    : ""}
              </td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(charge.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink font-semibold">
            <td className="py-2">Total</td>
            <td className="py-2 text-right tabular-nums">{formatCurrency(financials.grand_total)}</td>
          </tr>
        </tfoot>
      </table>

      <h2 className="mb-2 font-display text-lg font-semibold">Pagamentos</h2>
      {billing.payments.length === 0 ? (
        <p className="mb-6 text-sm text-ink-muted">Nenhum pagamento registrado.</p>
      ) : (
        <table className="mb-6 w-full text-sm">
          <tbody className="divide-y divide-line">
            {billing.payments.map((payment) => (
              <tr key={payment.id}>
                <td className="py-2">
                  {formatShortDate(payment.paid_at)} · {PAYMENT_KIND_LABELS[payment.kind]} · {PAYMENT_METHOD_LABELS[payment.method]}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {payment.kind === "refund" ? "−" : ""}
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mb-8 grid gap-1 rounded-2xl bg-canvas p-4 text-sm print:bg-transparent print:p-0">
        <p className="flex justify-between">
          <span>Total pago</span>
          <strong className="tabular-nums">{formatCurrency(financials.paid_total)}</strong>
        </p>
        <p className="flex justify-between">
          <span>Saldo a pagar</span>
          <strong className="tabular-nums">{formatCurrency(Math.max(financials.balance_due, 0))}</strong>
        </p>
      </div>

      <p className="text-sm leading-relaxed">
        Recebemos de <strong>{mainGuest.full_name}</strong> a quantia de{" "}
        <strong>{formatCurrency(Math.max(financials.paid_total, 0))}</strong> referente à hospedagem descrita acima.
      </p>
      <div className="mt-14 w-64 border-t border-ink pt-1 text-center text-sm">{issuer}</div>
    </main>
  );
}
