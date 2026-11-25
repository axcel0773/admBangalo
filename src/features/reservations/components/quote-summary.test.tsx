// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { quoteStay } from "../domain/pricing";
import { QuoteSummary } from "./quote-summary";

afterEach(cleanup);

const brl = (text: string | null) => (text ?? "").replace(/\s/g, " ");

describe("QuoteSummary", () => {
  const quote = quoteStay({
    stay: { nights: 3, guests: 2, includedGuests: 2 },
    nightlyRate: 350,
    fees: [
      { name: "Limpeza", kind: "cleaning", mode: "per_stay", amount: 150 },
      { name: "Energia", kind: "energy", mode: "metered", amount: 1 },
    ],
  });

  it("mostra hospedagem, taxas e o total previsto", () => {
    render(<QuoteSummary quote={quote} nights={3} nightlyRate={350} discount={0} />);
    expect(screen.getByText("Limpeza")).toBeTruthy();
    expect(brl(screen.getByText("Total previsto").nextElementSibling?.textContent ?? null)).toBe("R$ 1.200,00");
    // energia por medidor só entra no check-out
    expect(screen.getByText(/A energia entra no total/)).toBeTruthy();
  });

  it("detalha as noites por temporada quando há tarifa sazonal", () => {
    render(
      <QuoteSummary
        quote={quote}
        nights={3}
        nightlyRate={433.33}
        discount={0}
        seasonGroups={[
          { label: null, nights: 2, rate: 350 },
          { label: "Réveillon", nights: 1, rate: 600 },
        ]}
      />,
    );
    expect(brl(screen.getByText(/Réveillon/).textContent)).toBe(
      "2 noites fora de temporada a R$ 350,00 · 1 noite Réveillon a R$ 600,00",
    );
  });

  it("pacote mostra o valor fechado, sem a diária", () => {
    const packageQuote = quoteStay({
      stay: { nights: 3, guests: 2, includedGuests: 2 },
      nightlyRate: 333.33,
      packageTotal: 1000,
      fees: [{ name: "Limpeza", kind: "cleaning", mode: "per_stay", amount: 80 }],
    });
    render(<QuoteSummary quote={packageQuote} nights={3} nightlyRate={333.33} discount={0} packageName="Fim de semana" />);
    expect(screen.getByText("pacote Fim de semana (3 noites)")).toBeTruthy();
    expect(screen.queryByText(/333,33/)).toBeNull();
    expect(brl(screen.getByText("Total previsto").nextElementSibling?.textContent ?? null)).toBe("R$ 1.080,00");
  });
});
