// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ConfirmSubmit } from "./confirm-submit";

afterEach(cleanup);

function renderInForm() {
  return render(
    <form>
      <ConfirmSubmit message="Cancelar esta reserva?">Cancelar reserva</ConfirmSubmit>
    </form>,
  );
}

describe("ConfirmSubmit", () => {
  it("primeiro toque só pergunta; não envia", () => {
    renderInForm();
    const trigger = screen.getByRole("button", { name: "Cancelar reserva" });
    expect(trigger.getAttribute("type")).toBe("button");

    fireEvent.click(trigger);
    expect(screen.getByRole("alertdialog").textContent).toContain("Cancelar esta reserva?");
    expect(screen.getByRole("button", { name: "Sim, cancelar" }).getAttribute("type")).toBe("submit");
  });

  it("Voltar desiste sem enviar", () => {
    renderInForm();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar reserva" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Cancelar reserva" })).toBeTruthy();
  });
});
