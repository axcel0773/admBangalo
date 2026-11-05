import { describe, expect, it } from "vitest";

import { friendlyDbMessage } from "./errors";

describe("friendlyDbMessage", () => {
  it("traduz sobreposição de reservas", () => {
    expect(
      friendlyDbMessage(
        { code: "23P01", message: 'conflicting key value violates exclusion constraint "reservations_no_overlap"' },
        "x",
      ),
    ).toBe("Já existe uma reserva neste bangalô para essas datas.");
  });

  it("traduz temporadas sobrepostas sem confundir com reservas", () => {
    expect(
      friendlyDbMessage(
        { code: "23P01", message: 'conflicting key value violates exclusion constraint "chalet_rates_chalet_id_period_excl"' },
        "x",
      ),
    ).toBe("Já existe uma temporada neste bangalô que cruza essas datas.");
  });

  it("mantém mensagens em português dos triggers", () => {
    expect(
      friendlyDbMessage({ code: "23514", message: "Capacidade do bangalô excedida: 6 hóspedes para máximo de 4" }, "x"),
    ).toBe("Capacidade do bangalô excedida: 6 hóspedes para máximo de 4");
  });

  it("esconde mensagens técnicas do Postgres", () => {
    expect(
      friendlyDbMessage({ code: "23514", message: 'new row for relation "chalets" violates check constraint' }, "x"),
    ).toBe("Algum valor está fora do permitido.");
    expect(friendlyDbMessage({ code: "XX000", message: "boom" }, "Falhou")).toBe("Falhou");
  });

  it("explica o limite de 6 pessoas do condomínio", () => {
    expect(
      friendlyDbMessage(
        { code: "23514", message: 'new row for relation "reservations" violates check constraint "reservations_guests_limit"' },
        "x",
      ),
    ).toBe("Regra do condomínio: no máximo 6 pessoas por bangalô.");
  });
});
