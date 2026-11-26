import { describe, expect, it } from "vitest";

import type { Tables } from "@/types/database";

import { groupCharges, taxDefaults } from "./charges";

const charge = (over: Partial<Tables<"reservation_charges">>): Tables<"reservation_charges"> =>
  ({
    id: Math.random().toString(),
    kind: "other",
    mode: "per_stay",
    description: "Taxa",
    unit_amount: 10,
    quantity: 1,
    total: 10,
    meter_start: null,
    meter_end: null,
    ...over,
  }) as Tables<"reservation_charges">;

describe("groupCharges", () => {
  it("separa taxas de itens e esconde taxas zeradas (menos energia)", () => {
    const { taxes, items } = groupCharges([
      charge({ kind: "cleaning", description: "Limpeza", total: 150 }),
      charge({ kind: "cleaning", description: "Taxa", total: 0 }),
      charge({ kind: "energy", mode: "metered", total: 0 }),
      charge({ kind: "item", description: "Copo", quantity: 2, total: 30 }),
    ]);
    expect(taxes.map((c) => c.kind)).toEqual(["cleaning", "energy"]);
    expect(items.map((c) => c.description)).toEqual(["Copo"]);
  });
});

describe("taxDefaults", () => {
  const fee = (over: object) => ({ kind: "cleaning", mode: "per_stay", amount: 150, active: true, chalet_id: null, ...over }) as never;

  it("usa taxas fixas por estadia; a do bangalô vence a geral", () => {
    expect(
      taxDefaults(
        [
          fee({ chalet_id: "c1", amount: 200 }),
          fee({}),
          fee({ kind: "pet", mode: "per_night", amount: 30 }),
          fee({ kind: "other", active: false }),
        ],
        "c1",
      ),
    ).toEqual({ cleaning: 200 });
  });

  it("ignora taxas de outro bangalô", () => {
    expect(taxDefaults([fee({ chalet_id: "c2" })], "c1")).toEqual({});
  });
});
