// API pública da feature: as páginas importam daqui, não dos arquivos internos.
export { SearchResultsView } from "./components/search-results";
export { normalizeSearchTerm, SEARCH_MIN_LENGTH } from "./domain";
export { searchAll } from "./services";
