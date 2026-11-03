import { Badge, type BadgeTone } from "@/components/ui/badge";

import type { PaymentStatus } from "../domain/types";

const statusPresentation: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: "Pago", tone: "success" },
  partial: { label: "Parcial", tone: "warning" },
  unpaid: { label: "Não pago", tone: "danger" },
  cancelled: { label: "Cancelada", tone: "neutral" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, tone } = statusPresentation[status];
  return <Badge tone={tone}>{label}</Badge>;
}
