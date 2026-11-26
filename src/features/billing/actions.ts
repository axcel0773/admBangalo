"use server";

import { revalidatePath } from "next/cache";

import { requireOwner } from "@/features/auth/session";
import { attempt } from "@/lib/actions";
import { todayIso } from "@/lib/dates";
import { errorFormState, formDataToObject, invalidFormState, submittedValues, type FormState } from "@/lib/forms";
import { assertIds, INVALID_ID_MESSAGE, isUuid } from "@/lib/ids";
import { MutationError } from "@/lib/supabase/errors";

import { isOwnReceiptPath } from "./domain/receipts";
import { contextWithout, firstPaymentDate, validatePayment } from "./domain/payments";
import { isSplitCount, scheduleGapFixes, splitPlan, type ScheduleGapFix } from "./domain/schedule";
import {
  extraChargeSchema,
  installmentSchema,
  meterReadingSchema,
  paymentEditSchema,
  paymentSchema,
  splitPlanSchema,
} from "./schemas";
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
  if (!isUuid(reservationId)) return errorFormState(INVALID_ID_MESSAGE, formData);
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
  if (!isUuid(reservationId)) return errorFormState(INVALID_ID_MESSAGE, formData);
  const parsed = extraChargeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  return run(
    formData,
    async () => (await billingRepository()).createExtraCharge(reservationId, parsed.data),
    parsed.data.kind === "item" ? "Item adicionado." : "Taxa adicionada.",
  );
}

/** Use com `.bind(null, reservationId, chargeId)`. */
export async function removeCharge(reservationId: string, chargeId: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(reservationId, chargeId);
    await (await billingRepository()).deleteCharge(reservationId, chargeId);
    refresh();
  });
}

/** Pagamento ou estorno. Use com `.bind(null, reservationId)`. */
export async function registerPayment(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(reservationId)) return errorFormState(INVALID_ID_MESSAGE, formData);
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

/**
 * Corrige um lançamento (valor, data, forma, tipo, observação). O comprovante não muda.
 * As mesmas regras do registro valem, contando o saldo como se este lançamento não existisse.
 * Use com `.bind(null, reservationId, paymentId)`.
 */
export async function editPayment(
  reservationId: string,
  paymentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isUuid(reservationId) || !isUuid(paymentId)) return errorFormState(INVALID_ID_MESSAGE, formData);
  const parsed = paymentEditSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  const repo = await billingRepository();
  const [context, current] = await Promise.all([repo.findContext(reservationId), repo.findPayment(reservationId, paymentId)]);
  if (!context || !current) return errorFormState("Lançamento não encontrado.", formData);

  const problem = validatePayment(
    parsed.data,
    contextWithout({ reservationStatus: context.status, paid: context.paid, balance: context.balance }, current),
  );
  if (problem) {
    return {
      status: "error",
      message: problem.message,
      fieldErrors: { [problem.field]: problem.message },
      values: submittedValues(formData),
    };
  }

  return run(formData, () => repo.updatePayment(reservationId, paymentId, parsed.data), "Lançamento atualizado.");
}

/** Use com `.bind(null, reservationId, paymentId)`. */
export async function removePayment(reservationId: string, paymentId: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(reservationId, paymentId);
    const repo = await billingRepository();
    const receipt = await repo.deletePayment(reservationId, paymentId);
    if (receipt) await repo.removeReceipt(receipt);
    refresh();
  });
}

/** Parcela prevista. Use com `.bind(null, reservationId)`. */
export async function addInstallment(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(reservationId)) return errorFormState(INVALID_ID_MESSAGE, formData);
  const parsed = installmentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  return run(
    formData,
    async () => (await billingRepository()).createInstallments(reservationId, [parsed.data]),
    "Parcela adicionada.",
  );
}

/**
 * Divide o total em parcelas (sinal hoje, saldo no check-in). Só quando a reserva ainda não tem parcelas.
 * Use com `.bind(null, reservationId)`. O servidor recalcula a partir do total do banco.
 */
export async function addSplitPlan(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(reservationId)) return errorFormState(INVALID_ID_MESSAGE, formData);
  const parsed = splitPlanSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);
  const count = parsed.data.count;
  if (!isSplitCount(count)) return errorFormState("Escolha em quantas vezes dividir.", formData);
  const wholeReais = parsed.data.whole_reais;

  return run(
    formData,
    async () => {
      const repo = await billingRepository();
      const [context, existing, payments] = await Promise.all([
        repo.findContext(reservationId),
        repo.listSchedule(reservationId),
        repo.listPayments(reservationId),
      ]);
      if (!context || context.status === "cancelled") throw new MutationError("Reserva não encontrada ou cancelada.");
      if (existing.length > 0) throw new MutationError("Esta reserva já tem parcelas.");
      if (context.paid >= context.total) throw new MutationError("Esta reserva já está paga.");
      // O que já entrou vira "Sinal (pago)"; só o resto é dividido.
      await repo.createInstallments(
        reservationId,
        splitPlan({
          total: context.total,
          count,
          checkIn: context.checkIn,
          today: todayIso(),
          wholeReais,
          paid: Math.max(context.paid, 0),
          paidOn: firstPaymentDate(payments) ?? undefined,
        }),
      );
    },
    "Parcelas criadas.",
  );
}

/** Corrige descrição, valor ou vencimento da parcela. Use com `.bind(null, reservationId, installmentId)`. */
export async function editInstallment(
  reservationId: string,
  installmentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isUuid(reservationId) || !isUuid(installmentId)) return errorFormState(INVALID_ID_MESSAGE, formData);
  const parsed = installmentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  return run(
    formData,
    async () => (await billingRepository()).updateInstallment(reservationId, installmentId, parsed.data),
    "Parcela atualizada.",
  );
}

/** Use com `.bind(null, reservationId, installmentId)`. */
export async function removeInstallment(reservationId: string, installmentId: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(reservationId, installmentId);
    await (await billingRepository()).deleteInstallment(reservationId, installmentId);
    refresh();
  });
}

const GAP_FIX_MESSAGES: Record<ScheduleGapFix["kind"], string> = {
  paid_deposit: "Sinal pago virou parcela.",
  adjust_last: "Última parcela ajustada.",
  new_installment: "Parcela criada.",
};

/**
 * Conserta parcelas que não somam o total. Recalcula tudo no servidor e aplica o conserto
 * escolhido. Use com `.bind(null, reservationId, kind)`.
 */
export async function fixScheduleGap(reservationId: string, kind: ScheduleGapFix["kind"]): Promise<FormState> {
  let done: ScheduleGapFix["kind"] = kind;
  const result = await attempt(async () => {
    assertIds(reservationId);
    const repo = await billingRepository();
    const [context, items, payments] = await Promise.all([
      repo.findContext(reservationId),
      repo.listSchedule(reservationId),
      repo.listPayments(reservationId),
    ]);
    if (!context || context.status === "cancelled") throw new MutationError("Reserva não encontrada ou cancelada.");
    const fix = scheduleGapFixes({ items, total: context.total, paid: context.paid }).find((option) => option.kind === kind);
    if (!fix) throw new MutationError("As parcelas já batem com o total.");

    const today = todayIso();
    if (fix.kind === "paid_deposit") {
      await repo.createInstallments(reservationId, [
        { description: "Sinal (pago)", amount: fix.amount, due_date: firstPaymentDate(payments) ?? today },
      ]);
    } else if (fix.kind === "adjust_last") {
      const last = items.find((item) => item.id === fix.installmentId);
      if (!last) throw new MutationError("Parcela não encontrada.");
      await repo.updateInstallment(reservationId, last.id, {
        description: last.description,
        amount: fix.newAmount,
        due_date: last.due_date,
      });
    } else {
      await repo.createInstallments(reservationId, [
        { description: "Parcela", amount: fix.amount, due_date: context.checkIn > today ? context.checkIn : today },
      ]);
    }
    done = fix.kind;
    refresh();
  });
  return result.status === "success" ? { status: "success", message: GAP_FIX_MESSAGES[done] } : result;
}
