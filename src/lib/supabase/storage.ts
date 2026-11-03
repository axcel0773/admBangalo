import { createSupabaseBrowserClient } from "./client";

/**
 * Envio de arquivo direto do navegador para o Storage.
 * O arquivo não passa pelo servidor do Next (sem limite de corpo da Server Action);
 * a política do bucket garante que cada usuário só grava na própria pasta.
 */
export async function uploadToBucket(input: {
  bucket: string;
  path: string;
  file: Blob;
  contentType: string;
}): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(input.bucket)
    .upload(input.path, input.file, { contentType: input.contentType, upsert: false });
  if (error) throw new Error("Não foi possível enviar o comprovante. Tente de novo.");
}
