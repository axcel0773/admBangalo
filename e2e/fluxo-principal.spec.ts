import { expect, test } from "@playwright/test";

import { createTestOwner, hasLocalSupabase, type TestOwner } from "./support/owner";

/**
 * Fluxo principal no celular: login → chalé → nova reserva → pagamento.
 * Precisa do Supabase local com as migrações (`supabase start`) e das variáveis
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.
 */
test.describe("fluxo principal", () => {
  test.skip(!hasLocalSupabase(), "Supabase local não configurado (veja docs/deploy.md → Testes E2E).");

  let owner: TestOwner;
  test.beforeEach(async () => {
    owner = await createTestOwner();
  });
  test.afterEach(async () => {
    await owner?.remove();
  });

  test("login → chalé → reserva → pagamento quita o saldo", async ({ page }) => {
    // Login com senha
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(owner.email);
    await page.getByLabel("Senha").fill(owner.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);

    // Chalé
    await page.goto("/configuracoes/chales/novo");
    await page.getByLabel("Nome", { exact: true }).fill("Chalé E2E");
    await page.getByLabel("Diária base (R$)").fill("350,00");
    await page.getByRole("button", { name: "Cadastrar chalé" }).click();
    await expect(page).toHaveURL(/\/configuracoes\/chales$/);
    await expect(page.getByText("Chalé E2E")).toBeVisible();

    // Nova reserva: chalé e datas vêm preenchidos (hoje + 2 noites)
    await page.goto("/reservas/nova");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("radio", { name: "Novo hóspede" }).click();
    await page.getByLabel("Nome do responsável").fill("Hóspede E2E");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Criar reserva" }).click();
    await expect(page).toHaveURL(/\/reservas\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Hóspede E2E").first()).toBeVisible();

    // Pagamento do saldo inteiro (valor sugerido)
    await page.getByRole("button", { name: "Registrar pagamento" }).click();
    await page.getByRole("button", { name: "Registrar", exact: true }).click();
    await expect(page.getByText("Pagamento registrado.")).toBeVisible();
    await expect(page.getByText("Reserva quitada.")).toBeVisible();
  });
});
