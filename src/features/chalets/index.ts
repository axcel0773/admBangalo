// API pública da feature (uso em Server Components).
export { ChaletForm } from "./components/chalet-form";
export { ChaletList } from "./components/chalet-list";
export { createChalet, updateChalet } from "./actions";
export { getChalet, listChalets } from "./services";
export type { Chalet } from "./domain";
