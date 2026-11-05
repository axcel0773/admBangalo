import {
  CalendarDays,
  Sun,
  FileText,
  NotebookTabs,
  Receipt,
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
  quotes: "/orcamentos",
  newQuote: "/orcamentos/novo",
  guests: "/hospedes",
  finance: "/financeiro",
  expenses: "/financeiro/despesas",
  newExpense: "/financeiro/despesas/nova",
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
  quote: (id: string) => `${routes.quotes}/${id}`,
  /** Recibo para imprimir/salvar em PDF (fora do app shell). */
  receipt: (id: string) => `/recibo/${id}`,
  newReservation: (
    params: {
      chalet?: string;
      checkIn?: string;
      checkOut?: string;
      adults?: number;
      children?: number;
      guest?: string;
      guestName?: string;
      guestPhone?: string;
    } = {},
  ) => {
    const search = new URLSearchParams();
    if (params.chalet) search.set("chale", params.chalet);
    if (params.checkIn) search.set("entrada", params.checkIn);
    if (params.checkOut) search.set("saida", params.checkOut);
    if (params.adults) search.set("adultos", String(params.adults));
    if (params.children) search.set("criancas", String(params.children));
    if (params.guest) search.set("hospede", params.guest);
    if (params.guestName) search.set("nome", params.guestName);
    if (params.guestPhone) search.set("telefone", params.guestPhone);
    const query = search.toString();
    return query ? `${routes.newReservation}?${query}` : routes.newReservation;
  },
  newQuote: (
    params: { chalet?: string; adults?: number; children?: number; guestName?: string; guestPhone?: string } = {},
  ) => {
    const search = new URLSearchParams();
    if (params.chalet) search.set("chale", params.chalet);
    if (params.adults) search.set("adultos", String(params.adults));
    if (params.children) search.set("criancas", String(params.children));
    if (params.guestName) search.set("nome", params.guestName);
    if (params.guestPhone) search.set("telefone", params.guestPhone);
    const query = search.toString();
    return query ? `${routes.newQuote}?${query}` : routes.newQuote;
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
  { href: routes.dashboard, label: "Painel", icon: Sun },
  { href: routes.calendar, label: "Calendário", icon: CalendarDays },
  { href: routes.reservations, label: "Reservas", icon: NotebookTabs },
  { href: routes.quotes, label: "Orçamentos", icon: FileText },
  { href: routes.guests, label: "Hóspedes", icon: Users },
  { href: routes.finance, label: "Financeiro", icon: Wallet },
  { href: routes.fees, label: "Taxas", icon: Receipt },
  { href: routes.settings, label: "Configurações", icon: Settings },
];

/** Barra inferior do celular: 4 destinos + botão central (nova reserva ou novo orçamento). */
export const bottomNavItems: { left: NavItem[]; right: NavItem[] } = {
  left: [
    { href: routes.dashboard, label: "Painel", icon: Sun },
    { href: routes.calendar, label: "Calendário", icon: CalendarDays },
  ],
  right: [
    { href: routes.finance, label: "Financeiro", icon: Wallet },
    { href: routes.fees, label: "Taxas", icon: Receipt },
  ],
};

export function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.dashboard) return pathname === href;
  // Taxas moram em /configuracoes/taxas mas têm item próprio no menu.
  if (href === routes.settings && isActivePath(pathname, routes.fees)) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
