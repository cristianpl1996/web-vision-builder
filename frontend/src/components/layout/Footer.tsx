import { Link } from "react-router-dom";
import { Instagram, MessageCircle, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { STORE } from "@/data/products";
import { useCatalog } from "@/context/CatalogContext";

export function Footer() {
  const { products: PRODUCTS } = useCatalog();
  return (
    <footer
      className="relative isolate overflow-hidden text-primary-foreground"
      style={{
        backgroundImage:
          "radial-gradient(50% 70% at 88% 0%, hsl(140 55% 65% / 0.28), transparent 70%), radial-gradient(45% 60% at 0% 100%, hsl(150 50% 40% / 0.35), transparent 70%), linear-gradient(115deg, hsl(154 48% 18%) 0%, hsl(152 44% 24%) 55%, hsl(149 40% 30%) 100%)",
      }}
    >
      <div className="border-b border-white/10">
        <div className="container grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Pedidos en línea", text: "Arma tu carrito y envíalo" },
            { icon: ShieldCheck, title: "Cuenta personal", text: "Consulta tus pedidos cuando quieras" },
            { icon: CreditCard, title: "Pago seguro", text: "Mercado Pago o WhatsApp" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-white/70">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
            Cannabinoides de espectro amplio para uso veterinario. CBD, CBG y terpenos para el bienestar de perros y gatos.
          </p>
          <div className="mt-6 flex gap-2">
            <a
              href={`https://instagram.com/${STORE.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>

        <FooterCol title="Tienda" className="md:col-span-3">
          {PRODUCTS.map((p) => (
            <li key={p.id}>
              <Link to={`/producto/${p.slug}`} className="hover:text-white">
                {p.name}
              </Link>
            </li>
          ))}
        </FooterCol>

        <FooterCol title="Ayuda" className="md:col-span-2">
          <li><Link to="/#faq" className="hover:text-white">Preguntas frecuentes</Link></li>
          <li><Link to="/#contacto" className="hover:text-white">Contacto</Link></li>
          <li><Link to="/cuenta" className="hover:text-white">Mis pedidos</Link></li>
        </FooterCol>

        <FooterCol title="Contacto" className="md:col-span-3">
          <li>
            <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              WhatsApp {STORE.whatsappDisplay}
            </a>
          </li>
          <li>
            <a href={`https://instagram.com/${STORE.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              @{STORE.instagram}
            </a>
          </li>
        </FooterCol>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} SINERGIA by BOTICAN. Todos los derechos reservados.</p>
          <p>Uso veterinario · Cannabinoides en la clínica diaria de perros y gatos.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{title}</p>
      <ul className="space-y-3 text-sm text-white/80">{children}</ul>
    </div>
  );
}
