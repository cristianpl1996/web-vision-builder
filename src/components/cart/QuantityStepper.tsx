import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max = 20, size = "md", label = "Cantidad", className }: Props) {
  const btn = cn(
    "grid place-items-center rounded-full transition-colors hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
    size === "sm" ? "h-9 w-9" : "h-11 w-11",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-full border border-input bg-card", className)}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Disminuir cantidad">
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn("price text-center font-semibold", size === "sm" ? "w-6 text-sm" : "w-8")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar cantidad">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
