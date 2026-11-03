import { Leaf, Droplet, Flower2, PawPrint, ShieldCheck, Building2 } from "lucide-react";

const items = [
  { icon: Leaf, label: "CBD + CBG" },
  { icon: Flower2, label: "Terpenos naturales" },
  { icon: Droplet, label: "Broad Spectrum" },
  { icon: PawPrint, label: "Para perros y gatos" },
  { icon: ShieldCheck, label: "Seguro a largo plazo" },
  { icon: Building2, label: "Desarrollado por BOTICAN" },
];

function Chip({ icon: Icon, label }: (typeof items)[number]) {
  return (
    <span className="flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-background py-1.5 pl-1.5 pr-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="whitespace-nowrap text-sm font-medium">{label}</span>
    </span>
  );
}

export function TrustBar() {
  return (
    <section aria-label="Características del producto" className="border-b bg-card">
      {/* Mobile & tablet: auto-scrolling marquee (same motion as the top bar), edges fade out */}
      <div className="relative overflow-hidden py-4 lg:hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="flex w-max animate-marquee gap-3 pr-3 hover:[animation-play-state:paused]">
          {[...items, ...items].map((item, i) => (
            <li key={i} aria-hidden={i >= items.length}>
              <Chip {...item} />
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop: static row, evenly spaced */}
      <div className="container hidden lg:block">
        <ul className="flex flex-wrap items-center justify-between gap-3 py-5">
          {items.map((item) => (
            <li key={item.label}>
              <Chip {...item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
