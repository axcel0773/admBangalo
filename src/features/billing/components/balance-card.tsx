import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { whatsappUrl } from "@/features/guests/domain";
import { paidRatio } from "@/features/reservations/domain";
import { formatCurrency } from "@/lib/format";

import type { PixCharge } from "../services";
import { PixCopy } from "./pix-copy";

interface BalanceCardProps {
  total: number;
  paid: number;
  balance: number;
  cancelled: boolean;
  pix: PixCharge | null;
  hasPixKey: boolean;
  guestName: string;
  guestPhone: string | null;
}

/** Saldo em destaque, progresso do pagamento e cobrança por Pix. */
export function BalanceCard({ total, paid, balance, cancelled, pix, hasPixKey, guestName, guestPhone }: BalanceCardProps) {
  const overpaid = balance < 0;

  return (
    <Card className="flex flex-col gap-3 bg-primary-strong p-5 text-on-primary shadow-primary">
      <p className="text-sm text-on-primary/75">{overpaid ? "Pago a mais" : "Saldo a receber"}</p>
      <p className="font-display text-4xl leading-none font-semibold text-on-primary">
        {formatCurrency(Math.abs(balance))}
      </p>
      <ProgressBar
        value={paidRatio(total, paid)}
        label="Quanto já foi pago"
        trackClassName="bg-white/20"
        barClassName="bg-accent"
      />
      <div className="flex justify-between text-xs text-on-primary/75">
        <span>Pago {formatCurrency(paid)}</span>
        <span>de {formatCurrency(total)}</span>
      </div>

      {cancelled ? (
        <p className="rounded-xl bg-white/10 px-3 py-2 text-xs text-on-primary/75">
          Reserva cancelada. Se houve devolução ao hóspede, registre um estorno abaixo.
        </p>
      ) : pix ? (
        <PixCopy
          payload={pix.payload}
          whatsappHref={whatsappUrl(
            guestPhone,
            `Olá, ${guestName.split(" ")[0]}! O saldo da sua reserva é ${formatCurrency(pix.amount)}. ` +
              `Segue o Pix copia e cola:\n\n${pix.payload}`,
          )}
          className="mt-1"
        />
      ) : balance > 0 && !hasPixKey ? (
        <Link href={routes.profile} className="rounded-xl bg-white/10 px-3 py-2 text-xs text-on-primary underline-offset-2 hover:underline">
          Cadastre sua chave Pix no perfil para cobrar com um toque.
        </Link>
      ) : null}
    </Card>
  );
}
