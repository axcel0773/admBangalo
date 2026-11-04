"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

const TEXT_INPUT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="hidden"]):not([type="file"]):not([type="range"]):not([type="color"]), textarea, select';

function isTextField(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return Boolean(element?.matches?.(TEXT_INPUT));
}

/** Próximo campo do mesmo formulário (pula escondidos e desabilitados). */
function nextField(current: HTMLElement): HTMLElement | null {
  const form = current.closest("form");
  if (!form) return null;
  const fields = Array.from(form.querySelectorAll<HTMLElement>(TEXT_INPUT)).filter(
    (field) => !(field as HTMLInputElement).disabled && field.offsetParent !== null && !field.closest("[hidden]"),
  );
  const index = fields.indexOf(current);
  return index >= 0 ? (fields[index + 1] ?? null) : null;
}

const isTouch = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/**
 * Teclado no celular (principalmente iPhone, cujo teclado numérico não tem "OK"):
 * - botão "Concluir" preso logo acima do teclado;
 * - tocar fora de um campo fecha o teclado;
 * - Enter/"Seguinte" vai para o próximo campo e, no último, fecha o teclado
 *   (formulários com data-enter-submit, como o login, enviam);
 * - com o teclado aberto, a barra inferior e as barras fixas saem do caminho
 *   (data-keyboard="open" no <html>, ver globals.css) e o campo é rolado para o centro.
 */
export function KeyboardManager() {
  const [bar, setBar] = useState<{ top: number } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;

    function placeBar() {
      if (!isTouch() || !isTextField(document.activeElement) || document.activeElement instanceof HTMLSelectElement) {
        setBar(null);
        return;
      }
      const height = viewport ? viewport.height : window.innerHeight;
      const offset = viewport ? viewport.offsetTop : 0;
      // Só mostra quando o teclado realmente ocupa a tela (viewport visível menor que a janela).
      const keyboardUp = viewport ? window.innerHeight - viewport.height > 120 : true;
      setBar(keyboardUp ? { top: offset + height - 48 } : null);
    }

    function onFocusIn(event: FocusEvent) {
      const target = event.target as HTMLElement;
      if (!isTextField(target)) return;
      root.dataset.keyboard = "open";
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        if (!target.enterKeyHint && !(target instanceof HTMLTextAreaElement)) {
          target.enterKeyHint = nextField(target) ? "next" : "done";
        }
      }
      // Espera o teclado subir e centraliza o campo na parte visível.
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        placeBar();
      }, 300);
    }

    function onFocusOut() {
      window.setTimeout(() => {
        if (!isTextField(document.activeElement)) {
          delete root.dataset.keyboard;
          setBar(null);
        }
      }, 50);
    }

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch") return;
      const target = event.target as HTMLElement;
      const active = document.activeElement as HTMLElement | null;
      if (!isTextField(active)) return;
      // Tocar em outro campo, num rótulo ou na barra "Concluir" não fecha.
      // Botões e links seguem o fluxo normal (fechar antes poderia deslocar o layout e perder o toque).
      if (isTextField(target) || target.closest("label, button, a, summary, [role=button], [data-keyboard-bar]")) return;
      active.blur();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.isComposing || !isTouch()) return;
      const target = event.target as HTMLElement;
      if (!(target instanceof HTMLInputElement) || target.type === "search") return;
      const form = target.form;
      const next = nextField(target);
      if (next) {
        event.preventDefault();
        next.focus();
        return;
      }
      if (form?.hasAttribute("data-enter-submit")) return; // envia normalmente
      // Último campo: fecha o teclado em vez de enviar sem querer (ex.: etapas da nova reserva).
      event.preventDefault();
      target.blur();
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    viewport?.addEventListener("resize", placeBar);
    viewport?.addEventListener("scroll", placeBar);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      viewport?.removeEventListener("resize", placeBar);
      viewport?.removeEventListener("scroll", placeBar);
    };
  }, []);

  if (!bar) return null;

  return (
    <div
      data-keyboard-bar
      className="fixed inset-x-0 z-50 flex h-12 items-center justify-end border-t border-line bg-muted/95 px-3 backdrop-blur"
      style={{ top: bar.top }}
    >
      <button
        type="button"
        // mousedown/pointerdown não roubam o foco antes do clique.
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
      >
        <Check className="size-4" aria-hidden="true" />
        Concluir
      </button>
    </div>
  );
}
