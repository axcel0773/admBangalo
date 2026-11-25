"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { routes } from "@/components/layout/navigation";
import { Field } from "@/components/ui/field";
import { FieldRow } from "@/components/ui/form-layout";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { packageNightsWarning, packagesForStay, type PackageOption } from "@/features/packages/domain";
import { cn } from "@/lib/cn";
import { formatMoneyInput, pluralize } from "@/lib/format";
import { parseMoney } from "@/lib/money";

import { DEFAULT_PACKAGE_NAME, type PricingMode } from "../../domain/lodging";

const MODE_OPTIONS: { value: PricingMode; label: string }[] = [
  { value: "nightly", label: "Por diária" },
  { value: "package", label: "Pacote fechado" },
];

export interface LodgingPricingInitial {
  mode?: PricingMode;
  packageName?: string | null;
  packageTotal?: number | null;
}

/** Estado da escolha "por diária / pacote fechado", compartilhado pela nova reserva e pelo orçamento. */
export function useLodgingPricing(packages: PackageOption[], initial: LodgingPricingInitial = {}) {
  const [mode, setMode] = useState<PricingMode>(initial.mode ?? "nightly");
  const [packageName, setPackageName] = useState<string | null>(initial.packageName ?? null);
  const [packageTotalText, setPackageTotalText] = useState(formatMoneyInput(initial.packageTotal ?? null));

  const selectedPackage = packages.find((pkg) => pkg.name === packageName) ?? null;
  const packageTotal = mode === "package" ? (parseMoney(packageTotalText) ?? 0) : null;

  return {
    mode,
    setMode,
    packageName,
    packageTotalText,
    packageTotal,
    selectedPackage,
    pickPackage(pkg: PackageOption) {
      setPackageName(pkg.name);
      setPackageTotalText(formatMoneyInput(pkg.total));
    },
    /** Valor digitado à mão: deixa de ser o pacote salvo (vira "Pacote fechado"). */
    typePackageTotal(value: string) {
      setPackageTotalText(value);
      if (selectedPackage && parseMoney(value) !== selectedPackage.total) setPackageName(null);
    },
  };
}

export type LodgingPricingState = ReturnType<typeof useLodgingPricing>;

interface LodgingPricingFieldsProps {
  pricing: LodgingPricingState;
  packages: PackageOption[];
  nights: number;
  rateText: string;
  rateHint?: string;
  onRateChange: (value: string) => void;
  /** Campo de desconto, ao lado do valor no tablet e no desktop. */
  discountField: ReactNode;
  error: (name: string) => string | undefined;
}

/** Diária ou pacote (valor fechado): no pacote o hóspede vê só o total, sem a diária. */
export function LodgingPricingFields({
  pricing,
  packages,
  nights,
  rateText,
  rateHint,
  onRateChange,
  discountField,
  error,
}: LodgingPricingFieldsProps) {
  const isPackage = pricing.mode === "package";
  const ordered = packagesForStay(packages, nights);
  const packageHint =
    packageNightsWarning(pricing.selectedPackage, nights) ??
    (nights > 0 ? `Valor fechado de ${pluralize(nights, "noite", "noites")}. O hóspede não vê a diária.` : undefined);

  return (
    <>
      <SegmentedControl
        label="Como cobrar a hospedagem"
        name="pricing_mode"
        options={MODE_OPTIONS}
        value={pricing.mode}
        onChange={pricing.setMode}
      />

      {isPackage ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink-soft">Pacotes salvos</span>
          {ordered.length > 0 ? (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              {ordered.map((pkg) => {
                const active = pkg.name === pricing.packageName;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pricing.pickPackage(pkg)}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[13px] whitespace-nowrap",
                      active
                        ? "border-ink bg-ink font-semibold text-surface"
                        : "border-line-strong bg-surface text-ink-soft hover:bg-subtle",
                    )}
                  >
                    {pkg.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-ink-muted">
              Nenhum pacote salvo. Digite o valor abaixo ou{" "}
              <Link href={routes.packages} className="font-semibold text-primary-ink underline">
                salve pacotes em Configurações
              </Link>
              .
            </p>
          )}
        </div>
      ) : null}

      <FieldRow>
        {isPackage ? (
          <>
            <Field
              key="package_total"
              label="Valor da hospedagem (R$)"
              name="package_total"
              inputMode="decimal"
              mask="money"
              placeholder="1.000,00"
              value={pricing.packageTotalText}
              onChange={(event) => pricing.typePackageTotal(event.target.value)}
              hint={packageHint}
              error={error("package_total")}
            />
            <input type="hidden" name="package_name" value={pricing.packageName ?? DEFAULT_PACKAGE_NAME} />
          </>
        ) : (
          <Field
            key="nightly_rate"
            label="Diária (R$)"
            name="nightly_rate"
            inputMode="decimal"
            mask="money"
            value={rateText}
            onChange={(event) => onRateChange(event.target.value)}
            hint={rateHint}
            error={error("nightly_rate")}
          />
        )}
        {discountField}
      </FieldRow>
    </>
  );
}
