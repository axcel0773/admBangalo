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
  profile: "/configuracoes/perfil",
  chalets: "/configuracoes/chales",
  newChalet: "/configuracoes/chales/novo",
  fees: "/configuracoes/taxas",
  newFee: "/configuracoes/taxas/nova",
  newGuest: "/hospedes/novo",
  login: "/login",
} as const;

/** Rotas com parâmetro. */
export const paths = {
  chalet: (id: string) => `${routes.chalets}/${id}`,
  fee: (id: string) => `${routes.fees}/${id}`,
  guest: (id: string) => `${routes.guests}/${id}`,
  editGuest: (id: string) => `${routes.guests}/${id}/editar`,
  reservation: (id: string) => `${routes.reservations}/${id}`,
  /** Recibo para imprimir/salvar em PDF (fora do app shell). */
  receipt: (id: string) => `/recibo/${id}`,
  newReservation: (params: { chalet?: string; checkIn?: string; guest?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.chalet) search.set("chale", params.chalet);
    if (params.checkIn) search.set("entrada", params.checkIn);
    if (params.guest) search.set("hospede", params.guest);
    const query = search.toString();
    return query ? `${routes.newReservation}?${query}` : routes.newReservation;
  },
  calendar: (params: { start?: string; day?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.start) search.set("inicio", params.start);
    if (params.day) search.set("dia", params.day);
    const query = search.toString();
    return query ? `${routes.calendar}?${query}` : routes.calendar;
  },
};

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
