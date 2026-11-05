import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bangalôs — Gestão de hospedagem",
    short_name: "Bangalôs",
    description: "Reservas, hóspedes, calendário e financeiro dos seus bangalôs.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F1E6",
    theme_color: "#14508A",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nova reserva", url: "/reservas/nova" },
      { name: "Calendário", url: "/calendario" },
    ],
  };
}
