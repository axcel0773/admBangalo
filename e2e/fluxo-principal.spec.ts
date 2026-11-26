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

    // Taxa (só tipo e valor) e item quebrado (quantidade × valor), em grupos separados
    const charges = page.getByRole("region", { name: "Hospedagem e taxas" });
    await charges.getByRole("button", { name: "Taxa", exact: true }).click();
    await charges.getByRole("button", { name: "Limpeza" }).click();
    await charges.getByLabel("Valor (R$)").fill("150,00");
    await charges.getByRole("button", { name: "Adicionar", exact: true }).click();
    await expect(page.getByText(/Taxa “Limpeza” de R\$\s150,00 somada ao total\./)).toBeVisible();
    await charges.getByRole("button", { name: "Item quebrado" }).click();
    await charges.getByLabel("O que foi?").fill("Copo quebrado");
    await charges.getByLabel("Quantidade").fill("2");
    await charges.getByLabel("Valor de cada (R$)").fill("15,00");
    await charges.getByRole("button", { name: "Adicionar", exact: true }).click();
    await expect(page.getByText(/Item “Copo quebrado” de R\$\s30,00 somado ao total\./)).toBeVisible();
    await expect(charges.getByRole("heading", { name: "Itens quebrados e consumo" })).toBeVisible();
    await expect(charges.getByText("Copo quebrado")).toBeVisible();

    // Pagamento do saldo inteiro (valor sugerido)
    await page.getByRole("button", { name: "Registrar pagamento" }).click();
    await page.getByRole("button", { name: "Registrar", exact: true }).click();
    await expect(page.getByText(/Pagamento de R\$\s[\d.,]+ registrado\. Não falta mais nada\./)).toBeVisible();
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

  test("comissão do corretor: registrada ao fechar, paga e somada às despesas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(owner.email);
    await page.getByLabel("Senha").fill(owner.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/configuracoes/chales/novo");
    await page.getByLabel("Nome", { exact: true }).fill("Bangalô Corretor");
    await page.getByLabel("Diária base (R$)").fill("350,00");
    await page.getByRole("button", { name: "Cadastrar bangalô" }).click();
    await expect(page).toHaveURL(/\/configuracoes\/chales$/);

    // Passo Hóspedes: corretor com 10% do total (2 noites × R$ 350 = R$ 700 → R$ 70)
    await page.goto("/reservas/nova");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("radio", { name: "Novo hóspede" }).click();
    await page.getByLabel("Nome do responsável").fill("Hóspede Corretor");
    await page.getByText("Veio por corretor", { exact: true }).click();
    await page.getByLabel("Nome do corretor").fill("Carlos E2E");
    await page.getByRole("button", { name: "10%" }).click();
    await expect(page.getByLabel("Comissão (R$)")).toHaveValue("70,00");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Criar reserva" }).click();
    await expect(page).toHaveURL(/\/reservas\/[0-9a-f-]{36}$/);

    const card = page.getByRole("region", { name: "Comissão do corretor" });
    await expect(card.getByText("Carlos E2E")).toBeVisible();
    await expect(card.getByText("A pagar")).toBeVisible();

    await card.getByRole("button", { name: "Marcar como paga" }).click();
    await card.getByRole("button", { name: "Confirmar" }).click();
    await expect(card.getByText(/Paga em/)).toBeVisible();

    // Despesas do mês: a comissão paga aparece e soma no total
    await page.goto("/financeiro/despesas");
    await expect(page.getByText("Comissões de corretor")).toBeVisible();
    await expect(page.getByRole("region", { name: "Comissões pagas no mês" }).getByText("Carlos E2E")).toBeVisible();
  });
});
