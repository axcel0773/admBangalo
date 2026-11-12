"use client";

import { useEffect } from "react";

import { clearOfflineCaches } from "@/lib/offline";

/** Na tela de login (ou seja, depois de sair): limpa os dados que ficaram guardados para uso offline. */
export function ClearOfflineCache() {
  useEffect(() => {
    void clearOfflineCaches();
  }, []);
  return null;
}
