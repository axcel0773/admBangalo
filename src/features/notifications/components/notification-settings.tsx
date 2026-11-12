"use client";

import { Bell, BellOff, Send } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";

import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { SwitchField } from "@/components/ui/switch-field";

import { removeSubscription, saveSubscription, sendTestNotificationAction, updateNotificationPreferences } from "../actions";
import type { NotificationSettings as Settings } from "../services";

type Support = "checking" | "unsupported" | "ios-install" | "ready";

function urlBase64ToBytes(text: string): Uint8Array<ArrayBuffer> {
  const padded = `${text}${"=".repeat((4 - (text.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function detectSupport(): Support {
  if (typeof window === "undefined") return "checking";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  // No iPhone, push só existe no app instalado na tela inicial.
  if (ios && !standalone) return "ios-install";
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window ? "ready" : "unsupported";
}

async function readyRegistration(): Promise<ServiceWorkerRegistration> {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

/** Notificações push: ativar neste aparelho, escolher o que avisar e mandar um teste. */
export function NotificationSettings({ settings }: { settings: Settings }) {
  // Capacidades do navegador não mudam durante a visita; no servidor ainda não dá para saber.
  const support = useSyncExternalStore(
    () => () => undefined,
    detectSupport,
    (): Support => "checking",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (support !== "ready") return;
    readyRegistration()
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(subscription !== null))
      .catch(() => undefined);
  }, [support]);

  function run(task: () => Promise<void>) {
    setMessage(null);
    startTransition(async () => {
      try {
        await task();
      } catch {
        setMessage({ tone: "error", text: "Não deu certo. Recarregue a página e tente de novo." });
      }
    });
  }

  function enable() {
    run(async () => {
      if (!settings.publicKey) return;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage({ tone: "error", text: "A permissão foi negada. Libere as notificações nas configurações do navegador e tente de novo." });
        return;
      }
      const registration = await readyRegistration();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(settings.publicKey) }));
      const result = await saveSubscription(subscription.toJSON() as Parameters<typeof saveSubscription>[0]);
      setSubscribed(result.status === "success");
      setMessage({ tone: result.status === "success" ? "ok" : "error", text: result.status === "idle" ? "" : result.message });
    });
  }

  function disable() {
    run(async () => {
      const registration = await readyRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removeSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setMessage({ tone: "ok", text: "Notificações desativadas neste aparelho." });
    });
  }

  function test() {
    run(async () => {
      const result = await sendTestNotificationAction();
      setMessage({ tone: result.status === "success" ? "ok" : "error", text: result.status === "idle" ? "" : result.message });
    });
  }

  if (!settings.configured) {
    return (
      <p className="text-sm text-ink-muted">
        As notificações ainda não foram configuradas no servidor (faltam as chaves de envio). Veja o passo a passo em docs/notificacoes.md.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        Um aviso por dia, de manhã, com as chegadas e saídas do dia e as cobranças vencidas. Só chega se houver algo a avisar.
      </p>

      {support === "ios-install" ? (
        <p className="rounded-control bg-accent-soft p-3 text-sm text-accent-ink">
          No iPhone, instale o app antes: toque em Compartilhar, depois em “Adicionar à Tela de Início”, e abra o app por esse ícone. Então volte aqui para ativar.
        </p>
      ) : null}
      {support === "unsupported" ? (
        <p className="rounded-control bg-muted p-3 text-sm text-ink-soft">Este navegador não oferece notificações para sites instalados.</p>
      ) : null}

      {support === "ready" ? (
        <div className="flex flex-wrap gap-2">
          {subscribed ? (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={disable} disabled={pending}>
                <BellOff aria-hidden="true" />
                Desativar neste aparelho
              </Button>
              <Button type="button" variant="soft" size="sm" onClick={test} disabled={pending}>
                <Send aria-hidden="true" />
                Enviar teste
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" onClick={enable} disabled={pending}>
              <Bell aria-hidden="true" />
              Ativar neste aparelho
            </Button>
          )}
        </div>
      ) : null}

      {message?.text ? (
        <p role="status" className={message.tone === "ok" ? "text-sm font-semibold text-primary-ink" : "text-sm font-semibold text-danger-ink"}>
          {message.text}
        </p>
      ) : null}

      <ActionForm action={updateNotificationPreferences} className="flex flex-col gap-2">
        <SwitchField name="notify_arrivals" label="Chegadas e saídas do dia" defaultChecked={settings.notifyArrivals} />
        <SwitchField name="notify_overdue" label="Cobranças vencidas" defaultChecked={settings.notifyOverdue} />
        <SubmitButton variant="secondary" size="sm" pendingLabel="Salvando…" className="self-start">
          Salvar preferências
        </SubmitButton>
      </ActionForm>
      <p className="text-xs text-ink-muted">
        {settings.devices === 0 ? "Nenhum aparelho ativado ainda." : `${settings.devices} ${settings.devices === 1 ? "aparelho ativado" : "aparelhos ativados"}.`}
      </p>
    </div>
  );
}
