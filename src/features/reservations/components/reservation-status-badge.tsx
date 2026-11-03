import { Badge, type BadgeTone } from "@/components/ui/badge";

import { STATUS_LABELS } from "../domain/status";
import type { ReservationStatus } from "../domain/types";

const STATUS_TONES: Record<ReservationStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "success",
  checked_in: "success",
  checked_out: "neutral",
  cancelled: "danger",
};

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
