"use client";

interface ProgressBarProps {
  checked: number;
  total: number;
}

export function ProgressBar({ checked, total }: ProgressBarProps) {
  const pct = total > 0 ? (checked / total) * 100 : 0;

  return (
    <div className="px-4 py-2 flex items-center gap-3 bg-muted/30">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Checked {checked} of {total || "?"} airports
      </span>
    </div>
  );
}
