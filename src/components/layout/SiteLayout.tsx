import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";
import { CartDrawer } from "@/components/cart/CartDrawer";

/** Scrolls to #hash after navigation (e.g. /#productos from another page), otherwise to top. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

interface Props {
  children: ReactNode;
  minimal?: boolean; // checkout: no announcement / footer distractions
  fabRaised?: boolean;
  hideFab?: boolean;
}

export function SiteLayout({ children, minimal = false, fabRaised = false, hideFab = false }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <ScrollManager />
      {import.meta.env.VITE_DEMO === "1" && (
        <div role="note" className="relative z-[61] bg-accent px-4 py-2 text-center text-xs font-semibold text-accent-foreground">
          Versión de demostración: los pedidos y cuentas son de prueba y no se procesan pagos.
        </div>
      )}
      {!minimal && <AnnouncementBar />}
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      {!minimal && <Footer />}
      {!hideFab && <WhatsAppFab raised={fabRaised} />}
      <CartDrawer />
    </div>
  );
}
