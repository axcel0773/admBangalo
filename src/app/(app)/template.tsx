import type { ReactNode } from "react";

/**
 * Template (e não layout): o Next monta de novo a cada navegação, então cada tela
 * entra com um leve deslize. Só opacidade e deslocamento; sem efeito em "reduzir movimento".
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
