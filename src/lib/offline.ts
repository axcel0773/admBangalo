/** Modo offline (leitura): textos e regras puras; o cache em si é do service worker (src/app/sw.ts). */

/** "14:32" no horário do aparelho, ou null se a data for inválida. */
export function formatCachedTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Aviso fixo quando não há rede. Mostra a hora da tela que está sendo exibida (a do cache). */
export function offlineMessage(renderedAt: string): string {
  const time = formatCachedTime(renderedAt);
  return time
    ? `Sem conexão. Mostrando dados de ${time}. Para salvar, conecte-se de novo.`
    : "Sem conexão. Mostrando dados guardados. Para salvar, conecte-se de novo.";
}

/** Páginas que nunca vão para o cache offline (login, retorno de autenticação, API, iCal público, recibos). */
const NEVER_CACHED = ["/login", "/auth", "/api", "/ical", "/recibo"];

export function isCacheablePath(pathname: string): boolean {
  return !NEVER_CACHED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Apaga tudo o que o app guardou para uso offline (ao sair da conta, para não ficar dados no aparelho). */
export async function clearOfflineCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch {
    // Sem acesso ao cache (modo privado etc.): nada a limpar.
  }
}
