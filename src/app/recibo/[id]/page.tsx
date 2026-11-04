import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { paths } from "@/components/layout/navigation";
import { PrintButton } from "@/components/ui/print-button";
import { buildReceiptData, getReservationBilling, ReceiptShare } from "@/features/billing";
import { whatsappUrl } from "@/features/guests/domain";
import { getMyProfile } from "@/features/profile/services";
import { getReservationDetail, receiptMessage } from "@/features/reservations";
import { todayIso } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Recibo", robots: { index: false } };

/** Recibo da reserva em página própria (sem menu), pensado para imprimir, salvar em PDF ou enviar. */
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

  const receipt = buildReceiptData({
    reservationId: id,
    issuer: profile?.business_name || profile?.full_name || "Chalés",
    issuerPhone: profile?.phone ?? null,
    today: todayIso(),
    guest: mainGuest,
    guestNames: guests.map((guest) => guest.full_name),
    chalet,
    reservation,
    charges,
    payments: billing.payments,
    grandTotal: financials.grand_total,
    paid: financials.paid_total,
    balanceDue: financials.balance_due,
  });

  const message = receiptMessage({
    guestName: receipt.guestName,
    chaletName: chalet.name,
    issuer: receipt.issuer,
    number: receipt.number,
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    total: receipt.total,
    paid: receipt.paid,
    payments: receipt.payments,
  });

  return (
    <main className="pt-safe px-safe mx-auto max-w-2xl bg-surface p-5 text-ink print:max-w-none print:p-0 md:my-8 md:rounded-card md:p-10 md:shadow-card print:shadow-none">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <Link href={paths.reservation(id)} className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-ink-soft">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
        <div className="flex flex-wrap items-start justify-end gap-2">
          <ReceiptShare data={receipt} message={message} whatsappHref={whatsappUrl(mainGuest.phone, message)} />
          <PrintButton size="sm">Imprimir ou PDF</PrintButton>
        </div>
      </div>
      {!mainGuest.phone ? (
        <p className="-mt-3 mb-5 text-xs text-ink-muted print:hidden">
          Cadastre o telefone do hóspede para abrir a conversa dele direto pelo botão Mensagem.
        </p>
      ) : null}

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <p className="font-display text-2xl font-semibold">{receipt.issuer}</p>
          {receipt.issuerPhone ? <p className="text-sm text-ink-soft">{receipt.issuerPhone}</p> : null}
        </div>
        <div className="text-right text-sm">
          <p className="font-display text-xl font-semibold">Recibo</p>
          <p className="text-ink-soft">nº {receipt.number}</p>
          <p className="text-ink-soft">emitido em {receipt.issuedAt}</p>
        </div>
      </header>

      <section className="mb-6 grid gap-1 text-sm">
        <p>
          <span className="text-ink-muted">Hóspede: </span>
          <strong>{receipt.guestName}</strong>
          {receipt.guestDocument ? ` · ${receipt.guestDocument}` : ""}
        </p>
        <p>
          <span className="text-ink-muted">Hospedagem: </span>
          {receipt.stay}
        </p>
        <p>
          <span className="text-ink-muted">Pessoas: </span>
          {receipt.people}
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
          {receipt.items.map((item, index) => (
            <tr key={index}>
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink font-semibold">
            <td className="py-2">Total</td>
            <td className="py-2 text-right tabular-nums">{formatCurrency(receipt.total)}</td>
          </tr>
        </tfoot>
      </table>

      <h2 className="mb-2 font-display text-lg font-semibold">Pagamentos</h2>
      {receipt.payments.length === 0 ? (
        <p className="mb-6 text-sm text-ink-muted">Nenhum pagamento registrado.</p>
      ) : (
        <table className="mb-6 w-full text-sm">
          <tbody className="divide-y divide-line">
            {receipt.payments.map((payment, index) => (
              <tr key={index}>
                <td className="py-2">{payment.label}</td>
                <td className="py-2 text-right tabular-nums">
                  {payment.refund ? "−" : ""}
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
          <strong className="tabular-nums">{formatCurrency(receipt.paid)}</strong>
        </p>
        <p className="flex justify-between">
          <span>Saldo a pagar</span>
          <strong className="tabular-nums">{formatCurrency(receipt.balance)}</strong>
        </p>
      </div>

      <p className="text-sm leading-relaxed">
        Recebemos de <strong>{receipt.guestName}</strong> a quantia de{" "}
        <strong>{formatCurrency(Math.max(receipt.paid, 0))}</strong> referente à hospedagem descrita acima.
      </p>
      <div className="mt-14 w-64 border-t border-ink pt-1 text-center text-sm">{receipt.issuer}</div>
    </main>
  );
}
