import { describe, expect, it } from "vitest";

import { autoFeesFor, quoteDraft, validateDraft, type FeeForQuote } from "./quote";
import { availableTransitions, canTransition, timestampsFor } from "./status";

const chalet = { id: "c1", base_guests: 2, max_guests: 4, base_nightly_rate: 350 };

const fees: FeeForQuote[] = [
  { name: "Limpeza", kind: "cleaning", mode: "per_stay", amount: 150, chalet_id: null, active: true, auto_apply: true },
  { name: "Pessoa extra", kind: "extra_guest", mode: "per_guest_night", amount: 60, chalet_id: null, active: true, auto_apply: true },
  { name: "Energia", kind: "energy", mode: "metered", amount: 0.95, chalet_id: null, active: true, auto_apply: true },
  { name: "Pet", kind: "pet", mode: "per_stay", amount: 80, chalet_id: null, active: true, auto_apply: false },
  { name: "Lenha", kind: "other", mode: "per_stay", amount: 40, chalet_id: "outro", active: true, auto_apply: true },
  { name: "Antiga", kind: "other", mode: "per_stay", amount: 99, chalet_id: null, active: false, auto_apply: true },
];

const draft = {
  chalet,
  checkIn: "2026-11-20",
  checkOut: "2026-11-22",
  adults: 2,
  children: 1,
  nightlyRate: 350,
  discount: 0,
} as const;

describe("autoFeesFor", () => {
  it("só aplica taxas ativas, automáticas e deste bangalô (ou gerais)", () => {
    expect(autoFeesFor("c1", fees).map((fee) => fee.name)).toEqual(["Limpeza", "Pessoa extra", "Energia"]);
  });
});

describe("quoteDraft", () => {
  it("bate com o cálculo do banco (R$ 970)", () => {
    // 2 noites × 350 + limpeza 150 + 1 pessoa extra × 2 noites × 60
    expect(quoteDraft({ ...draft }, fees)?.total).toBe(970);
  });

  it("não calcula sem datas válidas", () => {
    expect(quoteDraft({ ...draft, checkOut: "2026-11-20" }, fees)).toBe(null);
    expect(quoteDraft({ ...draft, checkIn: "" }, fees)).toBe(null);
  });
});

describe("validateDraft", () => {
  it("aponta datas invertidas e excesso de pessoas", () => {
    expect(validateDraft({ ...draft, checkOut: "2026-11-19", adults: 4, children: 1 })).toEqual({
      dates: "A saída precisa ser depois da entrada.",
      capacity: "Este bangalô recebe até 4 pessoas.",
    });
    expect(validateDraft({ ...draft })).toEqual({});
  });
});

describe("status", () => {
  it("segue o fluxo pendente → confirmada → hospedado → finalizada", () => {
    expect(availableTransitions("pending").map((t) => t.to)).toEqual(["confirmed", "cancelled"]);
    expect(canTransition("confirmed", "checked_in")).toBe(true);
    expect(canTransition("checked_in", "cancelled")).toBe(false);
    expect(availableTransitions("checked_out")).toEqual([]);
  });

  it("registra a hora de cada mudança", () => {
    const now = new Date("2026-11-03T17:00:00Z");
    expect(timestampsFor("checked_in", now)).toEqual({ checked_in_at: "2026-11-03T17:00:00.000Z" });
    expect(timestampsFor("confirmed", now)).toEqual({});
  });
});
