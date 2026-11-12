import { describe, expect, it } from "vitest";

import { formatCachedTime, isCacheablePath, offlineMessage } from "./offline";

describe("modo offline", () => {
  it("formata a hora e rejeita data inválida", () => {
    expect(formatCachedTime("2026-11-12T14:32:00")).toBe("14:32");
    expect(formatCachedTime("lixo")).toBeNull();
  });

  it("mensagem cita a hora quando existe", () => {
    expect(offlineMessage("2026-11-12T09:05:00")).toContain("09:05");
    expect(offlineMessage("lixo")).toContain("dados guardados");
  });

  it("não guarda login, autenticação, api, iCal nem recibo", () => {
    expect(isCacheablePath("/")).toBe(true);
    expect(isCacheablePath("/reservas/abc")).toBe(true);
    expect(isCacheablePath("/login")).toBe(false);
    expect(isCacheablePath("/auth/callback")).toBe(false);
    expect(isCacheablePath("/api/cron/avisos")).toBe(false);
    expect(isCacheablePath("/ical/x.ics")).toBe(false);
    expect(isCacheablePath("/recibo/1")).toBe(false);
    expect(isCacheablePath("/autorizacoes")).toBe(true);
  });
});
