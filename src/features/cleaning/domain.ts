import { addDays, formatShortDate, type IsoDate } from "@/lib/dates";

/** Janela da lista: saídas de ontem em diante (atrasadas) até os próximos dias. */
export const CLEANING_PAST_DAYS = 3;
export const CLEANING_AHEAD_DAYS = 14;

export interface CleaningStay {
  reservationId: string;
  chaletId: string;
  chaletName: string;
  guestName: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
}

export interface CleaningTask {
  reservationId: string;
  chaletName: string;
  guestName: string;
  /** Dia da saída = dia em que a limpeza deve acontecer. */
  dueOn: IsoDate;
  /** Próxima entrada no mesmo bangalô (limite para deixar pronto). */
  nextCheckIn: IsoDate | null;
  done: boolean;
}

export function cleaningWindow(today: IsoDate): { from: IsoDate; to: IsoDate } {
  return { from: addDays(today, -CLEANING_PAST_DAYS), to: addDays(today, CLEANING_AHEAD_DAYS) };
}

/**
 * Uma limpeza por saída. `all` traz também as estadias seguintes, usadas só para achar
 * a próxima entrada de cada bangalô. Ordena por data; as feitas vão para o fim.
 */
export function buildCleaningTasks(stays: CleaningStay[], doneIds: Set<string>, today: IsoDate): CleaningTask[] {
  const { from, to } = cleaningWindow(today);
  return stays
    .filter((stay) => stay.checkOut >= from && stay.checkOut <= to)
    .map((stay): CleaningTask => {
      const next = stays
        .filter((other) => other.chaletId === stay.chaletId && other.checkIn >= stay.checkOut && other.reservationId !== stay.reservationId)
        .map((other) => other.checkIn)
        .sort()[0];
      return {
        reservationId: stay.reservationId,
        chaletName: stay.chaletName,
        guestName: stay.guestName,
        dueOn: stay.checkOut,
        nextCheckIn: next ?? null,
        done: doneIds.has(stay.reservationId),
      };
    })
    .sort((a, b) => Number(a.done) - Number(b.done) || a.dueOn.localeCompare(b.dueOn) || a.chaletName.localeCompare(b.chaletName));
}

export type CleaningUrgency = "late" | "today" | "same_day" | "upcoming" | "done";

/** Atrasada (saída já passou), hoje, "pula" (entra hóspede no mesmo dia) ou futura. */
export function cleaningUrgency(task: CleaningTask, today: IsoDate): CleaningUrgency {
  if (task.done) return "done";
  if (task.dueOn < today) return "late";
  if (task.nextCheckIn === task.dueOn) return "same_day";
  if (task.dueOn === today) return "today";
  return "upcoming";
}

/** Texto para mandar à faxineira (sem emoji: some em alguns aparelhos). */
export function cleaningMessage(task: CleaningTask): string {
  const lines = [`Limpeza do ${task.chaletName}`, `Saída do hóspede: ${formatShortDate(task.dueOn)}`];
  if (task.nextCheckIn) {
    lines.push(
      task.nextCheckIn === task.dueOn
        ? "Atenção: entra outro hóspede no mesmo dia."
        : `Próxima entrada: ${formatShortDate(task.nextCheckIn)}`,
    );
  }
  return lines.join("\n");
}
