/** Preferência de aparência: "system" segue o aparelho. Fica guardada neste aparelho (localStorage). */
export type ThemeChoice = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "tema";
export const THEME_CHOICES: Record<ThemeChoice, { label: string; hint?: string }> = {
  light: { label: "Claro" },
  dark: { label: "Escuro" },
  system: { label: "Automático", hint: "Segue o aparelho" },
};

/** Cor da barra do navegador (theme-color) em cada modo efetivo. */
export const THEME_COLORS = { light: "#14508A", dark: "#14181c" } as const;

export function parseThemeChoice(value: string | null | undefined): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

/**
 * Roda no <head>, antes da primeira pintura, para a página não piscar no tema errado.
 * Só lê a escolha e marca `data-theme`; "system" não marca nada (vale o prefers-color-scheme).
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
