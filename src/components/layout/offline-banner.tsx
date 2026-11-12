"use client";

import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

import { offlineMessage } from "@/lib/offline";

function subscribe(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

/**
 * Faixa fixa no topo quando o aparelho está sem rede. `renderedAt` é a hora em que o servidor
 * montou esta tela: se ela veio do cache, é a hora dos dados que a pessoa está vendo.
 */
export function OfflineBanner({ renderedAt }: { renderedAt: string }) {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-start gap-2 bg-accent-soft px-4 py-2 text-sm font-medium text-accent-ink"
    >
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{offlineMessage(renderedAt)}</span>
    </div>
  );
}
