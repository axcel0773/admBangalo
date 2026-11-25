// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { SegmentedControl } from "./segmented-control";

afterEach(cleanup);

function Example() {
  const [value, setValue] = useState<"nightly" | "package">("nightly");
  return (
    <form aria-label="exemplo">
      <SegmentedControl
        label="Como cobrar a hospedagem"
        name="pricing_mode"
        value={value}
        onChange={setValue}
        options={[
          { value: "nightly", label: "Por diária" },
          { value: "package", label: "Pacote fechado" },
        ]}
      />
    </form>
  );
}

describe("SegmentedControl", () => {
  it("é um grupo de rádios com rótulo", () => {
    render(<Example />);
    expect(screen.getByRole("radiogroup", { name: "Como cobrar a hospedagem" })).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Por diária" }) as HTMLInputElement).checked).toBe(true);
  });

  it("troca a opção e envia o valor no formulário", () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("radio", { name: "Pacote fechado" }));
    expect((screen.getByRole("radio", { name: "Pacote fechado" }) as HTMLInputElement).checked).toBe(true);
    const form = screen.getByRole("form", { name: "exemplo" }) as HTMLFormElement;
    expect(new FormData(form).get("pricing_mode")).toBe("package");
  });
});
