import { routes } from "@/components/layout/navigation";

import type { SearchPage } from "./domain";

/** Páginas que a busca sugere ("Ir para"). */
export const SEARCH_PAGES: SearchPage[] = [
  { label: "Painel", description: "Resumo do dia", href: routes.dashboard, keywords: ["inicio"] },
  { label: "Calendário", description: "Datas ocupadas e livres", href: routes.calendar, keywords: ["agenda"] },
  { label: "Reservas", description: "Todas as reservas", href: routes.reservations },
  { label: "Nova reserva", description: "Lançar uma reserva", href: routes.newReservation },
  { label: "Orçamentos", description: "Propostas para enviar", href: routes.quotes, keywords: ["propostas"] },
  { label: "Novo orçamento", description: "Montar um orçamento", href: routes.newQuote },
  { label: "Hóspedes", description: "Contatos e histórico", href: routes.guests, keywords: ["clientes"] },
  { label: "Financeiro", description: "Receita e lucro do mês", href: routes.finance, keywords: ["dinheiro"] },
  { label: "Despesas", description: "Lançar e ver gastos", href: routes.expenses, keywords: ["gastos"] },
  { label: "Relatórios", description: "Ocupação e diária média", href: routes.reports },
  { label: "Limpeza", description: "Faxinas das saídas", href: routes.cleaning, keywords: ["faxina"] },
  { label: "Bangalôs", description: "Seus bangalôs", href: routes.chalets, keywords: ["chales"] },
  { label: "Taxas", description: "Limpeza, pet e energia", href: routes.fees },
  { label: "Configurações", description: "Conta, perfil e preferências", href: routes.settings, keywords: ["perfil", "ajustes"] },
];
