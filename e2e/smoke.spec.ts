import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Não precisam de login nem de dados: rodam em qualquer ambiente.

test("rota protegida manda para o login e guarda o destino", async ({ page }) => {
  await page.goto("/reservas");
  await expect(page).toHaveURL(/\/login\?next=%2Freservas/);
  await expect(page.getByLabel("E-mail")).toBeVisible();
});

test("login sem problemas graves de acessibilidade", async ({ page }) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("respostas trazem os cabeçalhos de segurança", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("link iCal é público, só aceita token válido e responde calendário", async ({ request }) => {
  expect((await request.get("/ical/nao-e-token")).status()).toBe(404);
  const response = await request.get(`/ical/${crypto.randomUUID()}.ics`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/calendar");
  const body = await response.text();
  expect(body.startsWith("BEGIN:VCALENDAR")).toBe(true);
  // token que não existe: calendário vazio, sem vazar nada
  expect(body).not.toContain("BEGIN:VEVENT");
});

test("manifest do PWA está publicado", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
});
