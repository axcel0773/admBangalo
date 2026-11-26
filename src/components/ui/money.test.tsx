import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Money, splitCents } from "./money";

const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/ /g, " ");

describe("Money", () => {
  it("separa os centavos e esconde ,00", () => {
    expect(splitCents(18430.02).map((part) => part.replace(/ /g, " "))).toEqual(["R$ 18.430", ",02"]);
    expect(splitCents(5000)[1]).toBe("");
  });

  it("resumo mostra os centavos quando existem, sem arredondar", () => {
    expect(text(renderToStaticMarkup(<Money value={18430.02} rounded />))).toBe("R$ 18.430,02");
    expect(text(renderToStaticMarkup(<Money value={18430.6} rounded />))).toBe("R$ 18.430,60");
    expect(text(renderToStaticMarkup(<Money value={5000} rounded />))).toBe("R$ 5.000");
  });

  it("whole fica em reais inteiros", () => {
    expect(text(renderToStaticMarkup(<Money value={1166.67} whole />))).toBe("R$ 1.167");
  });
});
