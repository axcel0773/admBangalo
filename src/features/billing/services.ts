import "server-only";

import { requireOwner } from "@/features/auth/session";
import { todayIso } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createBillingRepository, type MeteredFee, type Payment, type PixProfile } from "./data/billing.repository";
import { buildPixPayload } from "./domain/pix";
import { allocatePayments, nextInstallment, type InstallmentProgress } from "./domain/schedule";

export async function billingRepository() {
  return createBillingRepository(await createSupabaseServerClient());
}

export interface PixCharge {
  /** Código "copia e cola" com o valor. */
  payload: string;
  key: string;
  amount: number;
}

export interface PaymentWithReceipt extends Payment {
  /** Link temporário (1 h) para abrir o comprovante. */
  receiptUrl: string | null;
}

export interface ReservationBilling {
  ownerId: string;
  payments: PaymentWithReceipt[];
  /** Taxa de energia por medidor do chalé (null = não cadastrada). */
  meteredFee: MeteredFee | null;
  /** Pix do saldo; null sem chave cadastrada ou sem saldo. */
  pix: PixCharge | null;
  /** O perfil tem chave Pix. */
  hasPixKey: boolean;
  /** Parcelas previstas, com o pago distribuído por vencimento. */
  schedule: InstallmentProgress[];
  /** Pix da próxima parcela em aberto (quando ela é menor que o saldo). */
  nextInstallmentPix: (PixCharge & { installmentId: string }) | null;
}

function pixFor(
  profile: PixProfile | null,
  fallbackName: string,
  reservationId: string,
  amount: number,
): PixCharge | null {
  const key = profile?.pix_key?.trim() ?? "";
  if (!key || !(amount > 0)) return null;
  return {
    key,
    amount,
    payload: buildPixPayload({
      key,
      name: profile?.business_name || profile?.full_name || fallbackName,
      city: profile?.pix_city || "BRASIL",
      amount,
      txid: `RES${reservationId.replace(/-/g, "").slice(0, 12)}`,
    }),
  };
}

/** Tudo que os cartões de cobrança e pagamento da reserva precisam. */
export async function getReservationBilling(input: {
  reservationId: string;
  chaletId: string;
  balance: number;
  paid: number;
}): Promise<ReservationBilling> {
  const owner = await requireOwner();
  const repo = await billingRepository();
  const [payments, meteredFee, profile, installments] = await Promise.all([
    repo.listPayments(input.reservationId),
    repo.findMeteredFee(input.chaletId),
    repo.findPixProfile(owner.id),
    repo.listSchedule(input.reservationId),
  ]);

  const receiptLinks = await repo.signReceipts(
    payments.map((payment) => payment.receipt_path).filter((path): path is string => Boolean(path)),
  );

  const schedule = allocatePayments(installments, input.paid, todayIso());
  const next = nextInstallment(schedule);
  const nextPix =
    next && next.remaining < input.balance ? pixFor(profile, owner.businessName, input.reservationId, next.remaining) : null;

  return {
    ownerId: owner.id,
    payments: payments.map((payment) => ({
      ...payment,
      receiptUrl: payment.receipt_path ? (receiptLinks.get(payment.receipt_path) ?? null) : null,
    })),
    meteredFee,
    pix: pixFor(profile, owner.businessName, input.reservationId, input.balance),
    hasPixKey: Boolean(profile?.pix_key?.trim()),
    schedule,
    nextInstallmentPix: next && nextPix ? { ...nextPix, installmentId: next.id } : null,
  };
}

export type { MeteredFee, Payment };
