import { expect, test } from "@playwright/test";

import { createTestOwner, hasLocalSupabase, type TestOwner } from "./support/owner";

/**
 * Fluxo principal no celular: login → bangalô → nova reserva → pagamento.
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

  test("login → bangalô → reserva → pagamento quita o saldo", async ({ page }) => {
    // Login com senha
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(owner.email);
    await page.getByLabel("Senha").fill(owner.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);

    // Bangalô
    await page.goto("/configuracoes/chales/novo");
    await page.getByLabel("Nome", { exact: true }).fill("Bangalô E2E");
    await page.getByLabel("Diária base (R$)").fill("350,00");
    await page.getByRole("button", { name: "Cadastrar bangalô" }).click();
    await expect(page).toHaveURL(/\/configuracoes\/chales$/);
    await expect(page.getByText("Bangalô E2E")).toBeVisible();

    // Nova reserva: bangalô e datas vêm preenchidos (hoje + 2 noites)
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

  test("pacote fechado: hospedagem sem diária quebrada e parcelas redondas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(owner.email);
    await page.getByLabel("Senha").fill(owner.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/configuracoes/chales/novo");
    await page.getByLabel("Nome", { exact: true }).fill("Bangalô Pacote");
    await page.getByLabel("Diária base (R$)").fill("350,00");
    await page.getByRole("button", { name: "Cadastrar bangalô" }).click();
    await expect(page).toHaveURL(/\/configuracoes\/chales$/);

    // Pacote de 2 noites (a nova reserva começa com hoje + 2 noites)
    await page.goto("/configuracoes/pacotes/novo");
    await page.getByLabel("Nome", { exact: true }).fill("Fim de semana");
    await page.getByLabel("Valor total (R$)").fill("1.000,00");
    await page.getByRole("button", { name: "Salvar pacote" }).click();
    await expect(page).toHaveURL(/\/configuracoes\/pacotes$/);
    await expect(page.getByText("Fim de semana")).toBeVisible();

    await page.goto("/reservas/nova");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("radio", { name: "Novo hóspede" }).click();
    await page.getByLabel("Nome do responsável").fill("Hóspede Pacote");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByText("Pacote fechado", { exact: true }).click();
    await page.getByRole("button", { name: "Fim de semana" }).click();
    await expect(page.getByLabel("Valor da hospedagem (R$)")).toHaveValue(/^1\.?000,00$/);
    await page.getByRole("button", { name: "Criar reserva" }).click();
    await expect(page).toHaveURL(/\/reservas\/[0-9a-f-]{36}$/);
    await expect(page.getByText("pacote Fim de semana (2 noites)").first()).toBeVisible();

    // 3x com valores redondos: 334 + 333 + 333
    await page.getByText("3x", { exact: true }).click();
    const preview = page.getByRole("list", { name: "Prévia das parcelas" });
    await expect(preview).toContainText(/334,00/);
    await expect(preview).not.toContainText(/333,33/);
    await page.getByRole("button", { name: "Criar 3 parcelas" }).click();
    await expect(page.getByRole("list", { name: "Prévia das parcelas" })).toBeHidden();
    await expect(page.getByText("Parcela 2").first()).toBeVisible();
  });
});
