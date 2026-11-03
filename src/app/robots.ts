import type { MetadataRoute } from "next";

/**
 * O app é privado: só a tela de login pode aparecer em buscadores.
 * Calendário iCal, recibos e telas internas ficam fora (já exigem login ou token).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/login", disallow: "/" }],
  };
}
