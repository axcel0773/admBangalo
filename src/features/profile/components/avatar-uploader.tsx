"use client";

import { Camera } from "lucide-react";
import { useId, useState, useTransition } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { shrinkImage } from "@/lib/images";
import { uploadToBucket } from "@/lib/supabase/storage";

import { removeAvatar, saveAvatar } from "../actions";
import { AVATAR_ACCEPT, AVATAR_BUCKET, avatarPath, avatarProblem } from "../domain/avatar";

interface AvatarUploaderProps {
  ownerId: string;
  name: string;
  avatarUrl: string | null;
}

/** Foto de perfil: reduzida no aparelho (256 px), enviada direto ao Storage e registrada no perfil. */
export function AvatarUploader({ ownerId, name, avatarUrl }: AvatarUploaderProps) {
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const typeProblem = avatarProblem({ type: file.type, size: 0 });
    if (typeProblem) return setMessage(typeProblem);

    setBusy(true);
    try {
      const { blob, type } = await shrinkImage(file, { maxSide: 256, quality: 0.85 });
      const problem = avatarProblem({ type, size: blob.size });
      if (problem) return setMessage(problem);

      const path = avatarPath({ ownerId, contentType: type, id: crypto.randomUUID() });
      await uploadToBucket({ bucket: AVATAR_BUCKET, path, file: blob, contentType: type });
      const result = await saveAvatar(path);
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
      const result = await removeAvatar();
      if (result.status === "error") setMessage(result.message);
    });
  }

  const working = busy || pending;

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={avatarUrl} color="#F29A3E" size="xl" />
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={inputId}
            aria-disabled={working}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-on-primary aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <Camera className="size-4" aria-hidden="true" />
            {working ? "Enviando…" : avatarUrl ? "Trocar foto" : "Adicionar foto"}
          </label>
          {avatarUrl ? (
            <Button type="button" variant="secondary" size="sm" onClick={handleRemove} disabled={working}>
              Remover
            </Button>
          ) : null}
        </div>
        <input
          id={inputId}
          type="file"
          accept={AVATAR_ACCEPT}
          className="sr-only"
          disabled={working}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <p className="text-xs text-ink-muted">JPG, PNG ou WebP. A foto é reduzida antes do envio.</p>
        {message ? (
          <p role="alert" className="text-xs font-semibold text-danger-ink">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
