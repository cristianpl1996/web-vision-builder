import { useCurrency } from "@/context/CurrencyContext";
import type { Currency } from "@/lib/format";
import { cn } from "@/lib/utils";

const OPCIONES: { id: Currency; label: string; title: string }[] = [
  { id: "MXN", label: "MXN", title: "Pesos mexicanos" },
  { id: "USD", label: "USD", title: "Dólares" },
];

/** Selector pesos / dólares. No aparece si la tienda solo vende en pesos. */
export function CurrencySwitch({ light = false, className }: { light?: boolean; className?: string }) {
  const { currency, setCurrency, usdEnabled } = useCurrency();
  if (!usdEnabled) return null;
  return (
    <div
      role="radiogroup"
      aria-label="Moneda"
      className={cn(
        "inline-flex rounded-full border p-0.5 text-xs font-semibold",
        light ? "border-white/30" : "border-border bg-card",
        className,
      )}
    >
      {OPCIONES.map((o) => {
        const activa = currency === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={activa}
            title={o.title}
            onClick={() => setCurrency(o.id)}
            className={cn(
              "min-h-9 min-w-12 cursor-pointer rounded-full px-2.5 transition-colors",
              activa
                ? light
                  ? "bg-white text-primary"
                  : "bg-primary text-primary-foreground"
                : light
                  ? "text-white/85 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
