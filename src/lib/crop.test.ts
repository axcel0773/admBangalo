import { describe, expect, it } from "vitest";

import { clampView, panView, sourceRect } from "./crop";

const wide = { width: 4000, height: 3000 }; // 4:3
const aspect = 8 / 3;

describe("crop", () => {
  it("com zoom 1 a moldura cobre a largura toda e só parte da altura", () => {
    const rect = sourceRect({ cx: 0.5, cy: 0.5, zoom: 1 }, wide, aspect);
    expect(rect.width).toBe(4000);
    expect(rect.height).toBeCloseTo(1500);
    expect(rect.y).toBeCloseTo(750);
  });

  it("a razão do recorte é sempre a da moldura", () => {
    for (const zoom of [1, 1.7, 3]) {
      const rect = sourceRect({ cx: 0.3, cy: 0.8, zoom }, wide, aspect);
      expect(rect.width / rect.height).toBeCloseTo(aspect);
    }
  });

  it("não deixa a janela sair da imagem", () => {
    const view = clampView({ cx: -2, cy: 9, zoom: 2 }, wide, aspect);
    const rect = sourceRect(view, wide, aspect);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y + rect.height).toBeLessThanOrEqual(3000 + 1e-6);
  });

  it("limita o zoom", () => {
    expect(clampView({ cx: 0.5, cy: 0.5, zoom: 10 }, wide, aspect).zoom).toBe(3);
    expect(clampView({ cx: 0.5, cy: 0.5, zoom: 0 }, wide, aspect).zoom).toBe(1);
  });

  it("arrastar para baixo mostra a parte de cima da foto", () => {
    const start = { cx: 0.5, cy: 0.5, zoom: 1 };
    const moved = panView(start, { x: 0, y: 40 }, { width: 300, height: 112 }, wide, aspect);
    expect(moved.cy).toBeLessThan(0.5);
    expect(moved.cx).toBe(0.5);
  });

  it("foto já na proporção não tem o que mover com zoom 1", () => {
    const exact = { width: 1600, height: 600 };
    const moved = panView({ cx: 0.5, cy: 0.5, zoom: 1 }, { x: 50, y: 50 }, { width: 300, height: 112 }, exact, aspect);
    expect(moved).toEqual({ cx: 0.5, cy: 0.5, zoom: 1 });
  });
});
