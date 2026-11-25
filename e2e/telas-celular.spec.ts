import { expect, test, type Page } from "@playwright/test";

import { createTestOwner, hasLocalSupabase, seedOwnerData, type TestOwner } from "./support/owner";

/**
 * Mobile first na prática: cada tela principal, no celular, não pode ter rolagem lateral
 * nem cair na tela de erro. Pega os vazamentos de layout que teste de lógica não vê
 * (texto longo que alarga a coluna, cartão que passa da tela, faixa cobrindo conteúdo).
 */
async function expectFitsScreen(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("h1:visible").first(), `${path}: título visível`).toBeVisible();
  await expect(page.getByText("Algo deu errado"), `${path}: sem tela de erro`).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${path}: conteúdo passa ${overflow}px da largura da tela`).toBeLessThanOrEqual(1);
}

test.describe("telas no celular", () => {
  test.skip(!hasLocalSupabase(), "Supabase local não configurado (veja docs/deploy.md → Testes E2E).");

  let owner: TestOwner;
  let seed: { chaletId: string; guestId: string };

  test.beforeEach(async ({ page }) => {
    owner = await createTestOwner();
    seed = await seedOwnerData(owner.id);
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(owner.email);
    await page.getByLabel("Senha").fill(owner.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });
  test.afterEach(async () => {
    await owner?.remove();
  });

  test("nenhuma tela principal tem rolagem lateral", async ({ page }) => {
    const paths = [
      "/",
      "/calendario",
      "/reservas",
      "/reservas/nova",
      "/orcamentos",
      "/orcamentos/novo",
      "/hospedes",
      `/hospedes/${seed.guestId}`,
      `/hospedes/${seed.guestId}/editar`,
      "/financeiro",
      "/financeiro/despesas",
      "/financeiro/despesas/nova",
      "/financeiro/relatorios",
      "/financeiro/a-receber",
      "/limpeza",
      "/busca?q=maria",
      "/configuracoes",
      "/configuracoes/chales",
      `/configuracoes/chales/${seed.chaletId}`,
      "/configuracoes/perfil",
    ];
    for (const path of paths) await expectFitsScreen(page, path);
  });

  test("no Painel, a faixa do topo não cobre o conteúdo", async ({ page }) => {
    await page.goto("/");
    // Clique de ensaio: falha se outro elemento estiver por cima do campo de busca ou dos cartões.
    await page.getByRole("link", { name: /Buscar página/ }).click({ trial: true });
    await page.getByText("A receber").first().click({ trial: true });
  });

  test("busca ao vivo acha o hóspede e sugere a página", async ({ page }) => {
    await page.goto("/busca");
    await page.getByRole("searchbox").fill("ho");
    await expect(page.getByRole("link", { name: /Hóspedes/ }).first()).toBeVisible();
    await page.getByRole("searchbox").fill("Maria Aparecida");
    await expect(page.getByText("Maria Aparecida de Albuquerque").first()).toBeVisible();
  });
});
