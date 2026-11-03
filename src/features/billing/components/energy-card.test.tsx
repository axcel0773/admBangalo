// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { idleFormState } from "@/lib/forms";

import { EnergyCard } from "./energy-card";

afterEach(cleanup);

const noop = async () => idleFormState;

describe("EnergyCard", () => {
  it("mostra consumo × tarifa enquanto o dono digita", () => {
    render(<EnergyCard action={noop} status="checked_in" reading={{ start: 1200, end: null }} tariff={1} />);

    expect(screen.getByText("Falta a saída")).toBeTruthy();
    expect((screen.getByLabelText("Entrada (kWh)") as HTMLInputElement).value).toBe("1200");

    fireEvent.change(screen.getByLabelText("Saída (kWh)"), { target: { value: "1284,5" } });
    // A prévia fica na região aria-live (lida pelo leitor de tela a cada mudança).
    const estimate = document.querySelector('[aria-live="polite"]')?.textContent ?? "";
    expect(estimate).toContain("84,5 kWh");
    expect(estimate.replace(/\s/g, " ")).toContain("R$ 84,50");
  });

  it("pede a leitura de entrada antes do check-in", () => {
    render(<EnergyCard action={noop} status="confirmed" reading={{ start: null, end: null }} tariff={1} />);
    expect(screen.getByText("Falta a entrada")).toBeTruthy();
    expect(screen.getByText(/O valor aparece com as duas leituras/)).toBeTruthy();
  });
});
