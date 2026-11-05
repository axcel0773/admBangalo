"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { clampView, MAX_ZOOM, MIN_ZOOM, panView, sourceRect, visibleFraction, type CropView } from "@/lib/crop";

interface PhotoCropperProps {
  file: File;
  /** Largura ÷ altura da moldura (e do recorte final). */
  aspect: number;
  /** Largura em pixels do recorte entregue. */
  outputWidth: number;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (result: { blob: Blob; type: string }) => void;
}

/** Enquadra a foto: arraste para mover, controle deslizante para aproximar. O recorte sai como JPEG. */
export function PhotoCropper({ file, aspect, outputWidth, busy = false, onCancel, onConfirm }: PhotoCropperProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [image, setImage] = useState<{ width: number; height: number } | null>(null);
  const [view, setView] = useState<CropView>({ cx: 0.5, cy: 0.5, zoom: 1 });
  const [failed, setFailed] = useState(false);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const objectUrl = URL.createObjectURL(file);
    createImageBitmap(file)
      .then((bitmap) => {
        if (cancelled) return bitmap.close();
        bitmapRef.current = bitmap;
        setImage({ width: bitmap.width, height: bitmap.height });
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      bitmapRef.current?.close();
      bitmapRef.current = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  function handleConfirm() {
    const bitmap = bitmapRef.current;
    if (!bitmap || !image) return;
    const rect = sourceRect(view, image, aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = Math.round(outputWidth / aspect);
    canvas.getContext("2d")?.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => (blob ? onConfirm({ blob, type: "image/jpeg" }) : setFailed(true)),
      "image/jpeg",
      0.82,
    );
  }

  if (failed) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm font-semibold text-danger-ink">
          Não foi possível abrir essa foto. Tente outra.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    );
  }

  const frac = image ? visibleFraction(image, aspect, view.zoom) : null;

  return (
    <div className="space-y-3">
      <div
        ref={frameRef}
        className="relative w-full cursor-grab touch-none overflow-hidden rounded-2xl bg-muted select-none active:cursor-grabbing"
        style={{ aspectRatio: String(aspect) }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={(event) => {
          if (!drag.current || !image || !frameRef.current) return;
          const delta = { x: event.clientX - drag.current.x, y: event.clientY - drag.current.y };
          drag.current = { x: event.clientX, y: event.clientY };
          const box = frameRef.current.getBoundingClientRect();
          setView((current) => panView(current, delta, { width: box.width, height: box.height }, image, aspect));
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {url && frac ? (
          // eslint-disable-next-line @next/next/no-img-element -- pré-visualização local (blob:)
          <img
            src={url}
            alt="Foto a enquadrar"
            draggable={false}
            className="pointer-events-none absolute max-w-none"
            style={{
              width: `${100 / frac.vw}%`,
              height: `${100 / frac.vh}%`,
              left: `${(-(view.cx - frac.vw / 2) / frac.vw) * 100}%`,
              top: `${(-(view.cy - frac.vh / 2) / frac.vh) * 100}%`,
            }}
          />
        ) : null}
      </div>

      <label className="flex items-center gap-3 text-xs font-semibold text-ink-muted">
        Zoom
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={view.zoom}
          disabled={!image}
          onChange={(event) => {
            const zoom = Number(event.target.value);
            setView((current) => (image ? clampView({ ...current, zoom }, image, aspect) : current));
          }}
          className="h-6 flex-1 accent-primary"
        />
      </label>
      <p className="text-xs text-ink-muted">Arraste a foto para escolher o enquadramento da capa.</p>

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleConfirm} disabled={!image || busy}>
          {busy ? "Enviando…" : "Usar esta foto"}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
