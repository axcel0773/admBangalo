import type { IsoDate } from "@/lib/dates";
import type { Tables, Views } from "@/types/database";

/* ---------- Entradas (formato das consultas) ---------- */

export type ChaletRow = Pick<
  Tables<"chalets">,
  "id" | "name" | "color" | "max_guests" | "base_nightly_rate" | "check_in_time" | "check_out_time" | "photo_path"
>;

export type StayRow = Pick<
  Views<"reservation_financials">,
  | "reservation_id"
  | "chalet_id"
  | "chalet_name"
  | "main_guest_name"
  | "check_in"
  | "check_out"
  | "nights"
  | "guests_count"
  | "status"
  | "grand_total"
  | "paid_total"
  | "balance_due"
  | "payment_status"
>;

export type PaymentRow = Pick<Tables<"payments">, "amount" | "kind" | "method">;

export type ScheduleRow = Pick<Tables<"payment_schedule">, "id" | "reservation_id" | "description" | "amount" | "due_date">;

/* ---------- Saída (o que as telas recebem) ---------- */

export type AgendaEventType = "check-in" | "check-out";

export interface AgendaEvent {
  type: AgendaEventType;
  time: string;
  reservationId: string;
  guestName: string;
  chaletName: string;
  chaletColor: string;
  guests: number;
}

export type ChaletDayStatus = "arriving" | "leaving" | "occupied" | "free";

export interface ChaletOverview {
  id: string;
  name: string;
  color: string;
  /** Link temporário da foto de capa; null usa a ilustração. */
  photoUrl: string | null;
  maxGuests: number;
  nightlyRate: number;
  status: ChaletDayStatus;
  /** Hóspede atual ou que chega hoje. */
  guestName: string | null;
  guests: number;
  checkOut: IsoDate | null;
  monthOccupancy: number;
}

export interface Receivable {
  reservationId: string;
  guestName: string;
  chaletName: string;
  amount: number;
  dueDate: IsoDate;
  dueStatus: "overdue" | "today" | "upcoming";
}

export interface UpcomingArrival {
  reservationId: string;
  guestName: string;
  chaletName: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  nights: number;
  guests: number;
  total: number;
  paymentStatus: StayRow["payment_status"];
}

export interface DashboardSummary {
  occupancyRate: number;
  nightsSold: number;
  nightsAvailable: number;
  receivableTotal: number;
  receivableCount: number;
  /** Saldos que vencem hoje ou já venceram. */
  dueNowCount: number;
  receivedThisMonth: number;
  paymentsThisMonth: number;
  pixPaymentsThisMonth: number;
  guestsToday: number;
}

export interface DashboardData {
  today: IsoDate;
  summary: DashboardSummary;
  agenda: AgendaEvent[];
  chalets: ChaletOverview[];
  /** Total de hóspedes cadastrados (atalhos do Painel). */
  guestCount: number;
  receivables: Receivable[];
  upcoming: UpcomingArrival[];
}
