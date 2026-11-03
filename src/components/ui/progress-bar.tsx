import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** Valor entre 0 e 1. */
  value: number;
  label: string;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}

export function ProgressBar({ value, label, className, trackClassName, barClassName }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("h-2 overflow-hidden rounded-full bg-line", trackClassName, className)}
    >
      <div className={cn("h-full rounded-full bg-primary", barClassName)} style={{ width: `${percent}%` }} />
    </div>
  );
}
