"use client";

import { Camera } from "lucide-react";
import { useId, useState, useTransition } from "react";

import { ChaletLandscape, toneFromColor } from "@/components/illustrations/chalet-landscape";
import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/ui/card";
import { shrinkImage } from "@/lib/images";
import { uploadToBucket } from "@/lib/supabase/storage";

import { removeChaletPhoto, saveChaletPhoto } from "../actions";
import {
  CHALET_PHOTO_ACCEPT,
  CHALET_PHOTO_BUCKET,
  chaletPhotoPath,
  chaletPhotoProblem,
} from "../photo";

interface ChaletPhotoCardProps {
  ownerId: string;
  chaletId: string;
  color: string;
  photoUrl: string | null;
}

/** Foto de capa do chalé: reduzida no aparelho (1280 px), enviada direto ao Storage e registrada no chalé. */
export function ChaletPhotoCard({ ownerId, chaletId, color, photoUrl }: ChaletPhotoCardProps) {
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const typeProblem = chaletPhotoProblem({ type: file.type, size: 0 });
    if (typeProblem) return setMessage(typeProblem);

    setBusy(true);
    try {
      const { blob, type } = await shrinkImage(file, { maxSide: 1280, quality: 0.8 });
      const problem = chaletPhotoProblem({ type, size: blob.size });
      if (problem) return setMessage(problem);

      const path = chaletPhotoPath({ ownerId, chaletId, contentType: type, id: crypto.randomUUID() });
      await uploadToBucket({ bucket: CHALET_PHOTO_BUCKET, path, file: blob, contentType: type });
      const result = await saveChaletPhoto(chaletId, path);
      if (result.status === "error") setMessage(result.message);
    } catch {
      setMessage("Não foi possível enviar a foto. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  function handleRemove() {
    setMessage(null);
    startTransition(async () => {
      const result = await removeChaletPhoto(chaletId);
      if (result.status === "error") setMessage(result.message);
    });
  }

  const working = busy || pending;

  return (
    <CardSection title="Foto de capa" titleId="chalet-photo">
      <div className="h-40 overflow-hidden rounded-2xl bg-muted md:h-52">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do Storage, já reduzida no envio
          <img src={photoUrl} alt="Foto do chalé" className="size-full object-cover" />
        ) : (
          <ChaletLandscape tone={toneFromColor(color)} />
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          aria-disabled={working}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-on-primary aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <Camera className="size-4" aria-hidden="true" />
          {working ? "Enviando…" : photoUrl ? "Trocar foto" : "Adicionar foto"}
        </label>
        {photoUrl ? (
          <Button type="button" variant="secondary" size="sm" onClick={handleRemove} disabled={working}>
            Remover
          </Button>
        ) : null}
        <input
          id={inputId}
          type="file"
          accept={CHALET_PHOTO_ACCEPT}
          className="sr-only"
          disabled={working}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Aparece como capa em “Seus chalés”, no Painel. JPG, PNG ou WebP; a foto é reduzida antes do envio.
      </p>
      {message ? (
        <p role="alert" className="mt-1 text-xs font-semibold text-danger-ink">
          {message}
        </p>
      ) : null}
    </CardSection>
  );
}
