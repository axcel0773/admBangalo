import { describe, expect, it } from "vitest";

import { THEME_INIT_SCRIPT, parseThemeChoice } from "./theme";

describe("tema", () => {
  it("aceita só claro e escuro; o resto é automático", () => {
    expect(parseThemeChoice("light")).toBe("light");
    expect(parseThemeChoice("dark")).toBe("dark");
    expect(parseThemeChoice("system")).toBe("system");
    expect(parseThemeChoice("roxo")).toBe("system");
    expect(parseThemeChoice(null)).toBe("system");
  });

  it("o script inicial lê a chave certa", () => {
    expect(THEME_INIT_SCRIPT).toContain('getItem("tema")');
    expect(THEME_INIT_SCRIPT).toContain("data-theme");
  });
});
