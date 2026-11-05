import { PawPrint, Leaf, MessageCircle } from "lucide-react";

const items = [
  { icon: MessageCircle, text: "Asesoría y pedidos por WhatsApp" },
  { icon: Leaf, text: "CBD + CBG + Terpenos · Broad Spectrum" },
  { icon: PawPrint, text: "Uso veterinario para perros y gatos" },
];

export function AnnouncementBar() {
  return (
    <div className="relative z-40 overflow-hidden bg-primary-dark text-primary-foreground">
      {/* Mobile: auto-scrolling marquee. Desktop: static row */}
      <div className="flex h-9 items-center md:hidden" aria-label="Avisos">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-5 text-xs font-medium">
          {[...items, ...items].map(({ icon: Icon, text }, i) => (
            <span key={i} className="inline-flex items-center gap-2" aria-hidden={i >= items.length}>
              <Icon className="h-3.5 w-3.5 opacity-80" />
              {text}
            </span>
          ))}
        </div>
      </div>
      <div className="container hidden h-9 items-center justify-center gap-10 text-xs font-medium md:flex">
        {items.map(({ icon: Icon, text }) => (
          <span key={text} className="inline-flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 opacity-80" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
