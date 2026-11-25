// API pública da feature: as páginas importam daqui, não dos arquivos internos.
export { ChaletList } from "./components/chalet-list";
export { DashboardHeader } from "./components/dashboard-header";
export { ReceivablesCard } from "./components/receivables-card";
export { ReceivablesList, ReceivablesTotal } from "./components/receivables-overview";
export { Shortcuts } from "./components/shortcuts";
export { SummaryCards } from "./components/summary-cards";
export { TodayActions } from "./components/today-actions";
export { TodayAgenda } from "./components/today-agenda";
export { UpcomingArrivals } from "./components/upcoming-arrivals";
export { getDashboard } from "./services/get-dashboard";
export { getReceivables } from "./services/get-receivables";
export { isReceivableFilter, RECEIVABLE_FILTERS, summarizeReceivables, type ReceivableFilter } from "./domain/receivables";
export type { DashboardData } from "./domain/types";
