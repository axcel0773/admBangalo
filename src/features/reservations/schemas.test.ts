import { describe, expect, it } from "vitest";

import { newReservationSchema, toCreateReservationPayload } from "./schemas";

const base = {
  chalet_id: "6f1c1b3e-2f4a-4c8e-9a51-0d2b7a3c9e11",
  check_in: "2026-11-20",
  check_out: "2026-11-22",
  adults: "2",
  children: "1",
  source: "whatsapp",
  status: "confirmed",
  nightly_rate: "350,00",
  discount: "",
  notes: "",
};

describe("newReservationSchema", () => {
  it("aceita hóspede novo com acompanhantes", () => {
    const parsed = newReservationSchema.parse({
      ...base,
      guest_mode: "new",
      new_guest_name: "Ana Teste",
      new_guest_phone: "(11) 90000-0000",
      companions: JSON.stringify([{ full_name: "Bia", is_child: false }, { full_name: "", is_child: true }]),
    });

    expect(parsed.nightly_rate).toBe(350);
    expect(parsed.discount).toBe(0);
    expect(toCreateReservationPayload(parsed)).toMatchObject({
      main_guest_id: null,
      new_guest: { full_name: "Ana Teste", phone: "(11) 90000-0000", document: null },
      companions: [{ full_name: "Bia", is_child: false }],
    });
  });

  it("exige o hóspede escolhido no modo existente", () => {
    const result = newReservationSchema.safeParse({ ...base, guest_mode: "existing", main_guest_id: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("main_guest_id");
  });

  it("recusa saída antes da entrada", () => {
    const result = newReservationSchema.safeParse({
      ...base,
      check_out: "2026-11-20",
      guest_mode: "new",
      new_guest_name: "Ana",
    });
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(["check_out"]);
  });
});
