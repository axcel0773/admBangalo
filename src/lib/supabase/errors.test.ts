import { describe, expect, it } from "vitest";

import { friendlyDbMessage } from "./errors";

describe("friendlyDbMessage", () => {
  it("traduz sobreposição de reservas", () => {
    expect(
      friendlyDbMessage(
        { code: "23P01", message: 'conflicting key value violates exclusion constraint "reservations_no_overlap"' },
        "x",
      ),
    ).toBe("Já existe uma reserva neste chalé para essas datas.");
  });

  it("traduz temporadas sobrepostas sem confundir com reservas", () => {
    expect(
      friendlyDbMessage(
        { code: "23P01", message: 'conflicting key value violates exclusion constraint "chalet_rates_chalet_id_period_excl"' },
        "x",
      ),
    ).toBe("Já existe uma temporada neste chalé que cruza essas datas.");
  });

  it("mantém mensagens em português dos triggers", () => {
    expect(
      friendlyDbMessage({ code: "23514", message: "Capacidade do chalé excedida: 6 hóspedes para máximo de 4" }, "x"),
    ).toBe("Capacidade do chalé excedida: 6 hóspedes para máximo de 4");
  });

  it("esconde mensagens técnicas do Postgres", () => {
    expect(
      friendlyDbMessage({ code: "23514", message: 'new row for relation "chalets" violates check constraint' }, "x"),
    ).toBe("Algum valor está fora do permitido.");
    expect(friendlyDbMessage({ code: "XX000", message: "boom" }, "Falhou")).toBe("Falhou");
  });
});
