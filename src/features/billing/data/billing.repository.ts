import "server-only";

import { MutationError, assertMutation, friendlyDbMessage } from "@/lib/supabase/errors";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import type { ExtraChargeInput, InstallmentInput, MeterReadingInput, PaymentInput } from "../schemas";

export type Payment = Tables<"payments">;
export type ScheduledInstallment = Pick<Tables<"payment_schedule">, "id" | "description" | "amount" | "due_date">;
export type MeteredFee = Pick<Tables<"fees">, "id" | "name" | "amount" | "chalet_id">;
export type PixProfile = Pick<Tables<"profiles">, "pix_key" | "pix_city" | "business_name" | "full_name">;

/** O que as regras de cobrança precisam saber da reserva. */
export interface BillingContext {
  reservationId: string;
  chaletId: string;
  status: Tables<"reservations">["status"];
  checkIn: string;
  total: number;
  paid: number;
  balance: number;
}

const RECEIPTS_BUCKET = "receipts";
const RECEIPT_LINK_SECONDS = 60 * 60;

/** Cobranças e pagamentos de uma reserva. Só consultas; regras ficam no domínio e nas ações. */
export function createBillingRepository(db: DbClient) {
  return {
    async findContext(reservationId: string): Promise<BillingContext | null> {
      const { data } = await db
        .from("reservation_financials")
        .select("reservation_id, chalet_id, status, check_in, grand_total, paid_total, balance_due")
        .eq("reservation_id", reservationId)
        .maybeSingle();
      if (!data) return null;
      return {
        reservationId: data.reservation_id,
        chaletId: data.chalet_id,
        status: data.status,
        checkIn: data.check_in,
        total: data.grand_total,
        paid: data.paid_total,
        balance: data.balance_due,
      };
    },

    // ---- Energia -----------------------------------------------------------

    async findMeteredCharge(reservationId: string): Promise<Pick<Tables<"reservation_charges">, "id"> | null> {
      const { data } = await db
        .from("reservation_charges")
        .select("id")
        .eq("reservation_id", reservationId)
        .eq("mode", "metered")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      return data;
    },

    /** Taxa de energia ativa: a do bangalô vence a geral. */
    async findMeteredFee(chaletId: string): Promise<MeteredFee | null> {
      const result = await db
        .from("fees")
        .select("id, name, amount, chalet_id")
        .eq("mode", "metered")
        .eq("active", true)
        .or(`chalet_id.eq.${chaletId},chalet_id.is.null`);
      const fees = unwrapList(result, "Buscar taxa de energia");
      return fees.find((fee) => fee.chalet_id === chaletId) ?? fees[0] ?? null;
    },

    async updateMeter(chargeId: string, reading: MeterReadingInput): Promise<void> {
      assertMutation(
        await db.from("reservation_charges").update(reading).eq("id", chargeId),
        "Não foi possível salvar a leitura.",
      );
    },

    async createMeteredCharge(reservationId: string, fee: MeteredFee, reading: MeterReadingInput): Promise<void> {
      assertMutation(
        await db.from("reservation_charges").insert({
          reservation_id: reservationId,
          fee_id: fee.id,
          kind: "energy",
          description: fee.name,
          mode: "metered",
          unit_amount: fee.amount,
          ...reading,
        }),
        "Não foi possível salvar a leitura.",
      );
    },

    // ---- Taxas avulsas -----------------------------------------------------

    async createExtraCharge(reservationId: string, input: ExtraChargeInput): Promise<void> {
      assertMutation(
        await db.from("reservation_charges").insert({ reservation_id: reservationId, mode: "per_stay", ...input }),
        "Não foi possível adicionar a taxa.",
      );
    },

    async deleteCharge(reservationId: string, chargeId: string): Promise<void> {
      assertMutation(
        await db.from("reservation_charges").delete().eq("id", chargeId).eq("reservation_id", reservationId),
        "Não foi possível remover a taxa.",
      );
    },

    // ---- Pagamentos --------------------------------------------------------

    async listPayments(reservationId: string): Promise<Payment[]> {
      const result = await db
        .from("payments")
        .select("*")
        .eq("reservation_id", reservationId)
        .order("paid_at", { ascending: false })
        .order("created_at", { ascending: false });
      return unwrapList(result, "Listar pagamentos");
    },

    async createPayment(reservationId: string, input: PaymentInput): Promise<void> {
      const { error } = await db.from("payments").insert({ reservation_id: reservationId, ...input });
      if (error) throw new MutationError(friendlyDbMessage(error, "Não foi possível registrar o pagamento."));
    },

    /** Remove o lançamento e devolve o caminho do comprovante (para apagar o arquivo). */
    async deletePayment(reservationId: string, paymentId: string): Promise<string | null> {
      const { data, error } = await db
        .from("payments")
        .delete()
        .eq("id", paymentId)
        .eq("reservation_id", reservationId)
        .select("receipt_path")
        .maybeSingle();
      if (error) throw new MutationError(friendlyDbMessage(error, "Não foi possível remover o pagamento."));
      return data?.receipt_path ?? null;
    },

    // ---- Comprovantes (Storage privado) -------------------------------------

    /** Links temporários para abrir os comprovantes. */
    async signReceipts(paths: string[]): Promise<Map<string, string>> {
      const links = new Map<string, string>();
      if (paths.length === 0) return links;
      const { data } = await db.storage.from(RECEIPTS_BUCKET).createSignedUrls(paths, RECEIPT_LINK_SECONDS);
      for (const item of data ?? []) {
        if (item.path && item.signedUrl) links.set(item.path, item.signedUrl);
      }
      return links;
    },

    async removeReceipt(path: string): Promise<void> {
      // Falha ao apagar o arquivo não deve impedir a remoção do lançamento.
      await db.storage.from(RECEIPTS_BUCKET).remove([path]);
    },

    // ---- Parcelas previstas --------------------------------------------------

    async listSchedule(reservationId: string): Promise<ScheduledInstallment[]> {
      const result = await db
        .from("payment_schedule")
        .select("id, description, amount, due_date")
        .eq("reservation_id", reservationId)
        .order("due_date");
      return unwrapList(result, "Listar parcelas");
    },

    async createInstallments(reservationId: string, items: InstallmentInput[]): Promise<void> {
      assertMutation(
        await db.from("payment_schedule").insert(items.map((item) => ({ reservation_id: reservationId, ...item }))),
        "Não foi possível salvar a parcela.",
      );
    },

    async deleteInstallment(reservationId: string, id: string): Promise<void> {
      assertMutation(
        await db.from("payment_schedule").delete().eq("id", id).eq("reservation_id", reservationId),
        "Não foi possível remover a parcela.",
      );
    },

    // ---- Pix ---------------------------------------------------------------

    async findPixProfile(ownerId: string): Promise<PixProfile | null> {
      const { data } = await db
        .from("profiles")
        .select("pix_key, pix_city, business_name, full_name")
        .eq("id", ownerId)
        .maybeSingle();
      return data;
    },
  };
}

export type BillingRepository = ReturnType<typeof createBillingRepository>;
