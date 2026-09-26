import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** current value (0..max) */
  value: number;
  /** maximum value, default 100 */
  max?: number;
  className?: string;
  /** bar color class — defaults to primary */
  barClassName?: string;
}

/**
 * Small inline progress bar used by watch history rows and
 * anywhere we want to show "watched 47%".
 */
export function ProgressBar({ value, max = 100, className, barClassName }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={Math.round(value)}
      className={cn(
        "h-1.5 w-full rounded-full bg-foreground/15 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-300", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
