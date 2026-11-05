/**
 * Enquadramento de foto (cálculo puro). A janela é descrita em frações da imagem:
 * `cx`/`cy` é o centro visível (0–1) e `zoom` ≥ 1 aproxima. Com zoom 1 a janela
 * cobre a imagem inteira no eixo "justo" (como `object-cover`).
 */
export interface CropView {
  cx: number;
  cy: number;
  zoom: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Fração visível da imagem (largura e altura) para a proporção da moldura e o zoom. */
export function visibleFraction(image: { width: number; height: number }, aspect: number, zoom: number) {
  const baseW = Math.min(1, (image.height * aspect) / image.width);
  const baseH = Math.min(1, image.width / aspect / image.height);
  const z = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  return { vw: baseW / z, vh: baseH / z };
}

/** Mantém a janela dentro da imagem. */
export function clampView(view: CropView, image: { width: number; height: number }, aspect: number): CropView {
  const zoom = clamp(view.zoom, MIN_ZOOM, MAX_ZOOM);
  const { vw, vh } = visibleFraction(image, aspect, zoom);
  return {
    zoom,
    cx: clamp(view.cx, vw / 2, 1 - vw / 2),
    cy: clamp(view.cy, vh / 2, 1 - vh / 2),
  };
}

/** Arrasto em pixels da moldura → novo centro (arrastar para a direita mostra o que está à esquerda). */
export function panView(
  view: CropView,
  deltaPx: { x: number; y: number },
  framePx: { width: number; height: number },
  image: { width: number; height: number },
  aspect: number,
): CropView {
  const { vw, vh } = visibleFraction(image, aspect, view.zoom);
  return clampView(
    { ...view, cx: view.cx - (deltaPx.x / framePx.width) * vw, cy: view.cy - (deltaPx.y / framePx.height) * vh },
    image,
    aspect,
  );
}

/** Retângulo da imagem original (em pixels) que cabe na moldura. */
export function sourceRect(view: CropView, image: { width: number; height: number }, aspect: number) {
  const v = clampView(view, image, aspect);
  const { vw, vh } = visibleFraction(image, aspect, v.zoom);
  return {
    x: (v.cx - vw / 2) * image.width,
    y: (v.cy - vh / 2) * image.height,
    width: vw * image.width,
    height: vh * image.height,
  };
}
