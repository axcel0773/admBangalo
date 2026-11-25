"use client";

import { Pencil } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Button } from "./button";

const CloseContext = createContext<() => void>(() => undefined);

/** Para o formulário de edição fechar o próprio painel depois de salvar ou cancelar. */
export function useCloseInlineEdit(): () => void {
  return useContext(CloseContext);
}

interface InlineEditProps {
  /** Conteúdo da linha (descrição, valor…). */
  children: ReactNode;
  /** Ações à direita do lápis (ex.: remover). */
  trailing?: ReactNode;
  /** Formulário mostrado no lugar de `below` enquanto edita. */
  editor: ReactNode;
  /** Algo que fica sob a linha quando não está editando (ex.: Pix da parcela). */
  below?: ReactNode;
  /** Nome do item para o leitor de tela ("Editar Sinal 50%"). */
  label: string;
  rowClassName?: string;
}

/** Linha com um lápis que abre a edição ali mesmo, sem trocar de tela. */
export function InlineEdit({ children, trailing, editor, below, label, rowClassName }: InlineEditProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={rowClassName}>
        {children}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Editar ${label}`}
          aria-expanded={open}
          title={`Editar ${label}`}
          onClick={() => setOpen((value) => !value)}
          className={cn("size-11 text-primary-ink md:size-9", open && "bg-primary-soft")}
        >
          <Pencil className="size-[18px]" aria-hidden="true" />
        </Button>
        {trailing}
      </div>
      {open ? <CloseContext.Provider value={() => setOpen(false)}>{editor}</CloseContext.Provider> : below}
    </>
  );
}
