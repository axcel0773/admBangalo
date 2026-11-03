"use server";

import { revalidatePath } from "next/cache";

import { requireOwner } from "@/features/auth/session";
import { todayIso } from "@/lib/dates";
import { errorFormState, formDataToObject, invalidFormState, submittedValues, type FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

import { validatePayment } from "./domain/payments";
import { isOwnReceiptPath } from "./domain/receipts";
import { depositAndBalance } from "./domain/schedule";
import { extraChargeSchema, installmentSchema, meterReadingSchema, paymentSchema } from "./schemas";
import { billingRepository } from "./services";

/** Valores e saldos aparecem no Painel, Financeiro, listas e ficha do hóspede. */
function refresh() {
  revalidatePath("/", "layout");
}

async function run(formData: FormData, task: () => Promise<void>, success: string): Promise<FormState> {
  try {
    await task();
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }
  refresh();
  return { status: "success", message: success };
}

/** Leituras do medidor. Use com `.bind(null, reservationId)`. */
export async function saveMeterReading(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = meterReadingSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  return run(
    formData,
    async () => {
      const repo = await billingRepository();
      const context = await repo.findContext(reservationId);
      if (!context) throw new MutationError("Reserva não encontrada.");
      if (context.status === "cancelled") throw new MutationError("Reserva cancelada não recebe leitura.");

      const existing = await repo.findMeteredCharge(reservationId);
      if (existing) return repo.updateMeter(existing.id, parsed.data);

      const fee = await repo.findMeteredFee(context.chaletId);
      if (!fee) {
        throw new MutationError("Cadastre a taxa de energia (modo “leitura do medidor”) em Configurações → Taxas.");
      }
      await repo.createMeteredCharge(reservationId, fee, parsed.data);
    },
    parsed.data.meter_end !== null ? "Leitura de saída salva. Energia somada ao total." : "Leitura de entrada salva.",
  );
}

/** Taxa avulsa. Use com `.bind(null, reservationId)`. */
export async function addExtraCharge(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = extraChargeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  return run(
    formData,
    async () => (await billingRepository()).createExtraCharge(reservationId, parsed.data),
    "Taxa adicionada.",
  );
}

/** Use com `.bind(null, reservationId, chargeId)`. */
export async function removeCharge(reservationId: string, chargeId: string): Promise<void> {
  await (await billingRepository()).deleteCharge(reservationId, chargeId);
  refresh();
}

/** Pagamento ou estorno. Use com `.bind(null, reservationId)`. */
export async function registerPayment(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = paymentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  const owner = await requireOwner();
  if (parsed.data.receipt_path && !isOwnReceiptPath(parsed.data.receipt_path, owner.id, reservationId)) {
    return errorFormState("Comprovante inválido. Envie o arquivo de novo.", formData);
  }

  const repo = await billingRepository();
  const context = await repo.findContext(reservationId);
  if (!context) return errorFormState("Reserva não encontrada.", formData);

  const problem = validatePayment(parsed.data, {
    reservationStatus: context.status,
    paid: context.paid,
    balance: context.balance,
  });
  if (problem) {
    return {
      status: "error",
      message: problem.message,
      fieldErrors: { [problem.field]: problem.message },
      values: submittedValues(formData),
    };
  }

  return run(
    formData,
    () => repo.createPayment(reservationId, parsed.data),
    parsed.data.kind === "refund" ? "Estorno registrado." : "Pagamento registrado.",
  );
}

/** Use com `.bind(null, reservationId, paymentId)`. */
export async function removePayment(reservationId: string, paymentId: string): Promise<void> {
  const repo = await billingRepository();
  const receipt = await repo.deletePayment(reservationId, paymentId);
  if (receipt) await repo.removeReceipt(receipt);
  refresh();
}

/** Parcela prevista. Use com `.bind(null, reservationId)`. */
export async function addInstallment(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = installmentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  return run(
    formData,
    async () => (await billingRepository()).createInstallments(reservationId, [parsed.data]),
    "Parcela adicionada.",
  );
}

/** Atalho "sinal 50% hoje + saldo no check-in". Use com `.bind(null, reservationId)`. */
export async function addDepositPlan(reservationId: string): Promise<void> {
  const repo = await billingRepository();
  const [context, existing] = await Promise.all([repo.findContext(reservationId), repo.listSchedule(reservationId)]);
  if (!context || existing.length > 0 || context.status === "cancelled") return;

  await repo.createInstallments(
    reservationId,
    depositAndBalance({ total: context.total, checkIn: context.checkIn, today: todayIso() }),
  );
  refresh();
}

/** Use com `.bind(null, reservationId, installmentId)`. */
export async function removeInstallment(reservationId: string, installmentId: string): Promise<void> {
  await (await billingRepository()).deleteInstallment(reservationId, installmentId);
  refresh();
}
