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

  it("pacote: grava o valor fechado e a diária média", () => {
    const parsed = newReservationSchema.parse({
      ...base,
      check_out: "2026-11-23",
      nightly_rate: "",
      pricing_mode: "package",
      package_name: "Fim de semana",
      package_total: "1.000,00",
      guest_mode: "new",
      new_guest_name: "Ana",
    });
    expect(toCreateReservationPayload(parsed)).toMatchObject({
      nightly_rate: 333.33,
      package_name: "Fim de semana",
      package_total: 1000,
    });
  });

  it("por diária não manda pacote, mesmo que o campo venha preenchido", () => {
    const parsed = newReservationSchema.parse({ ...base, package_total: "999", guest_mode: "new", new_guest_name: "Ana" });
    expect(toCreateReservationPayload(parsed)).toMatchObject({ nightly_rate: 350, package_name: null, package_total: null });
  });

  it("exige o valor do pacote no modo pacote e a diária no modo diária", () => {
    const pkg = newReservationSchema.safeParse({ ...base, pricing_mode: "package", guest_mode: "new", new_guest_name: "Ana" });
    expect(pkg.error?.issues.map((issue) => issue.path.join("."))).toEqual(["package_total"]);
    const nightly = newReservationSchema.safeParse({ ...base, nightly_rate: "", guest_mode: "new", new_guest_name: "Ana" });
    expect(nightly.error?.issues.map((issue) => issue.path.join("."))).toEqual(["nightly_rate"]);
  });
});

describe("comissão do corretor na nova reserva", () => {
  const guest = { ...base, guest_mode: "new", new_guest_name: "Ana Teste" };

  it("sem o interruptor, não manda comissão (mesmo com campos sobrando)", () => {
    const parsed = newReservationSchema.parse({ ...guest, broker_name: "Carlos", commission_amount: "120" });
    expect(toCreateReservationPayload(parsed)).toMatchObject({ commission: null });
  });

  it("comissão a pagar", () => {
    const parsed = newReservationSchema.parse({
      ...guest,
      has_commission: "on",
      broker_name: " Carlos ",
      commission_amount: "120,00",
      commission_status: "pending",
    });
    expect(toCreateReservationPayload(parsed)).toMatchObject({
      commission: { broker_name: "Carlos", amount: 120, paid_on: null, method: null },
    });
  });

  it("comissão já paga leva data e forma", () => {
    const parsed = newReservationSchema.parse({
      ...guest,
      has_commission: "on",
      broker_name: "Carlos",
      commission_amount: "120",
      commission_status: "paid",
      commission_paid_on: "2026-11-25",
      commission_method: "pix",
    });
    expect(toCreateReservationPayload(parsed)).toMatchObject({
      commission: { broker_name: "Carlos", amount: 120, paid_on: "2026-11-25", method: "pix" },
    });
  });

  it("interruptor ligado exige nome e valor", () => {
    const result = newReservationSchema.safeParse({ ...guest, has_commission: "on", broker_name: "", commission_amount: "" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("broker_name");
    expect(paths).toContain("commission_amount");
  });
});
