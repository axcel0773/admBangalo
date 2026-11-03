import { cn } from "@/lib/cn";

interface ColorSwatchFieldProps {
  name: string;
  label: string;
  colors: { value: string; label: string }[];
  defaultValue?: string;
  error?: string;
}

/** Escolha de cor por bolinhas (radio nativo: acessível por teclado). */
export function ColorSwatchField({ name, label, colors, defaultValue, error }: ColorSwatchFieldProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <label key={color.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={color.value}
              defaultChecked={(defaultValue ?? colors[0]?.value)?.toUpperCase() === color.value.toUpperCase()}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition peer-checked:ring-3 peer-checked:ring-ink peer-focus-visible:ring-3 peer-focus-visible:ring-primary",
              )}
              style={{ backgroundColor: color.value }}
            >
              <span className="sr-only">{color.label}</span>
            </span>
          </label>
        ))}
      </div>
      {error ? <p className="text-xs font-semibold text-danger-ink">{error}</p> : null}
    </fieldset>
  );
}
