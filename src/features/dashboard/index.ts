// API pública da feature: as páginas importam daqui, não dos arquivos internos.
export { ChaletList } from "./components/chalet-list";
export { DashboardHeader } from "./components/dashboard-header";
export { ReceivablesCard } from "./components/receivables-card";
export { SummaryCards } from "./components/summary-cards";
export { TodayAgenda } from "./components/today-agenda";
export { UpcomingArrivals } from "./components/upcoming-arrivals";
export { getDashboard } from "./services/get-dashboard";
export type { DashboardData } from "./domain/types";
