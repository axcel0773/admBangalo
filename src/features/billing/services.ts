import "server-only";

import { requireOwner } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createBillingRepository, type MeteredFee, type Payment } from "./data/billing.repository";
import { buildPixPayload } from "./domain/pix";

export async function billingRepository() {
  return createBillingRepository(await createSupabaseServerClient());
}

export interface PixCharge {
  /** Código "copia e cola" com o valor do saldo. */
  payload: string;
  key: string;
  amount: number;
}

export interface ReservationBilling {
  payments: Payment[];
  /** Taxa de energia por medidor do chalé (null = não cadastrada). */
  meteredFee: MeteredFee | null;
  /** Pix do saldo; null sem chave cadastrada ou sem saldo. */
  pix: PixCharge | null;
  /** O perfil tem chave Pix. */
  hasPixKey: boolean;
}

/** Tudo que os cartões de cobrança e pagamento da reserva precisam. */
export async function getReservationBilling(input: {
  reservationId: string;
  chaletId: string;
  balance: number;
}): Promise<ReservationBilling> {
  const owner = await requireOwner();
  const repo = await billingRepository();
  const [payments, meteredFee, profile] = await Promise.all([
    repo.listPayments(input.reservationId),
    repo.findMeteredFee(input.chaletId),
    repo.findPixProfile(owner.id),
  ]);

  const key = profile?.pix_key?.trim() ?? "";
  const pix =
    key && input.balance > 0
      ? {
          key,
          amount: input.balance,
          payload: buildPixPayload({
            key,
            name: profile?.business_name || profile?.full_name || owner.businessName,
            city: profile?.pix_city || "BRASIL",
            amount: input.balance,
            txid: `RES${input.reservationId.replace(/-/g, "").slice(0, 12)}`,
          }),
        }
      : null;

  return { payments, meteredFee, pix, hasPixKey: Boolean(key) };
}

export type { MeteredFee, Payment };
