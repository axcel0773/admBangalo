import {
  CalendarDays,
  House,
  NotebookTabs,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Rotas do app em um único lugar: sidebar, barra inferior e páginas leem daqui. */
export const routes = {
  dashboard: "/",
  calendar: "/calendario",
  reservations: "/reservas",
  newReservation: "/reservas/nova",
  guests: "/hospedes",
  finance: "/financeiro",
  settings: "/configuracoes",
  login: "/login",
} as const;

export const sidebarItems: NavItem[] = [
  { href: routes.dashboard, label: "Painel", icon: House },
  { href: routes.calendar, label: "Calendário", icon: CalendarDays },
  { href: routes.reservations, label: "Reservas", icon: NotebookTabs },
  { href: routes.guests, label: "Hóspedes", icon: Users },
  { href: routes.finance, label: "Financeiro", icon: Wallet },
  { href: routes.settings, label: "Configurações", icon: Settings },
];

/** Barra inferior do celular: 4 destinos + botão central de nova reserva. */
export const bottomNavItems: { left: NavItem[]; right: NavItem[] } = {
  left: [
    { href: routes.dashboard, label: "Painel", icon: House },
    { href: routes.calendar, label: "Calendário", icon: CalendarDays },
  ],
  right: [
    { href: routes.guests, label: "Hóspedes", icon: Users },
    { href: routes.finance, label: "Financeiro", icon: Wallet },
  ],
};

export function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.dashboard) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
