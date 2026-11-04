import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";

import { KeyboardManager } from "@/components/layout/keyboard-manager";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600"],
  display: "swap",
});

const APP_NAME = "Chalés";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: "Gestão de chalés: reservas, hóspedes, calendário e financeiro.",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

/**
 * Sem viewport-fit=cover (e com a barra de status "default" no app instalado), o iPhone
 * começa o conteúdo ABAIXO da barra de status e acima do indicador de início. Com cover,
 * a página passa por baixo delas e env(safe-area-inset-*) chega zerado em vários modos do
 * Safari/PWA, deixando títulos e botões colados no relógio.
 */
export const viewport: Viewport = {
  themeColor: "#34502A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <KeyboardManager />
      </body>
    </html>
  );
}
