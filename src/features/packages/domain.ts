import { formatCurrency, pluralize } from "@/lib/format";
import type { Tables } from "@/types/database";

export type StayPackage = Tables<"stay_packages">;

/** O que a nova reserva e o orçamento precisam de um pacote (sem dados de controle). */
export type PackageOption = Pick<StayPackage, "id" | "name" | "nights" | "total">;

/** Limite de noites de um pacote (o mesmo do banco). */
export const MAX_PACKAGE_NIGHTS = 60;

/** "3 noites · R$ 1.000,00" */
export function describePackage(pkg: Pick<StayPackage, "nights" | "total">): string {
  return `${pluralize(pkg.nights, "noite", "noites")} · ${formatCurrency(pkg.total)}`;
}

/** Pacotes na ordem da estadia: primeiro os com o mesmo número de noites, depois os mais próximos. */
export function packagesForStay<T extends Pick<StayPackage, "name" | "nights">>(packages: T[], nights: number): T[] {
  return [...packages].sort(
    (a, b) =>
      Math.abs(a.nights - nights) - Math.abs(b.nights - nights) ||
      a.nights - b.nights ||
      a.name.localeCompare(b.name, "pt-BR"),
  );
}

/** Aviso (sem bloquear) quando o pacote escolhido é de outra quantidade de noites. */
export function packageNightsWarning(pkg: Pick<StayPackage, "nights"> | null, nights: number): string | null {
  if (!pkg || nights < 1 || pkg.nights === nights) return null;
  return `Este pacote é de ${pluralize(pkg.nights, "noite", "noites")}; a estadia tem ${pluralize(nights, "noite", "noites")}.`;
}
