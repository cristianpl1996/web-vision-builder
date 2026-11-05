import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, User, ChevronRight, LogOut, Package, LayoutDashboard } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { label: "Beneficios", hash: "beneficios" },
  { label: "Fórmula", hash: "formula" },
  { label: "Tienda", hash: "productos" },
  { label: "Preguntas", hash: "faq" },
  { label: "Contacto", hash: "contacto" },
];

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { count, open, bump } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (hash: string) => {
    setMenuOpen(false);
    if (isHome) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      try {
        history.replaceState(null, "", `#${hash}`);
      } catch {
        /* sandboxed preview: ignore */
      }
    } else {
      navigate(`/#${hash}`);
    }
  };

  const iconBtn = cn(
    "relative grid h-11 w-11 place-items-center rounded-full transition-colors cursor-pointer",
    transparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary",
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        transparent
          ? "bg-transparent"
          : "bg-background/85 backdrop-blur-xl border-b border-border/60 shadow-[0_1px_0_hsl(var(--border)/0.4)]",
        isHome && "-mb-[72px]",
      )}
    >
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <div className="flex items-center gap-1 lg:gap-0">
          {/* Three equal bars sized to the SINERGIA wordmark: first bar level with the top of the "S",
              last bar on the baseline, left edge on the page gutter. */}
          <button
            type="button"
            className={cn(iconBtn, "-ml-[9px] -translate-y-2 lg:hidden")}
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <svg viewBox="0 0 22 16" className="h-5 w-[26px] sm:h-[22px] sm:w-[28px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true" preserveAspectRatio="none">
              <path d="M1 1h20M1 8h20M1 15h20" />
            </svg>
          </button>
          <Logo light={transparent} />
        </div>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.hash}>
                <button
                  type="button"
                  onClick={() => goTo(item.hash)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
                    transparent ? "text-white/90 hover:text-white hover:bg-white/10" : "text-foreground/80 hover:text-foreground hover:bg-secondary",
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 -mr-2.5 -translate-y-2 lg:translate-y-0">
          {isAdmin && (
            <Link to="/admin" className={cn(iconBtn, "hidden sm:grid")} aria-label="Panel de administración" title="Panel de administración">
              <LayoutDashboard className="h-[22px] w-[22px]" />
            </Link>
          )}
          <Link
            to={user ? "/cuenta" : "/ingresar"}
            className={cn(iconBtn, "hidden sm:grid")}
            aria-label={user ? `Mi cuenta (${user.firstName})` : "Iniciar sesión"}
          >
            <User className="h-[22px] w-[22px]" />
            {user && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-success ring-2 ring-background" />}
          </Link>
          <button type="button" onClick={open} className={iconBtn} aria-label={`Abrir carrito, ${count} productos`}>
            <ShoppingBag className="h-[22px] w-[22px]" />
            {count > 0 && (
              <span
                key={bump}
                className="absolute right-1 top-1 grid h-5 min-w-5 animate-cart-bump place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground price"
              >
                {count}
              </span>
            )}
          </button>
          <Button
            size="sm"
            variant={transparent ? "light" : "default"}
            className="ml-2 hidden md:inline-flex"
            onClick={() => goTo("productos")}
          >
            Comprar ahora
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">Navegación principal y acceso a tu cuenta</SheetDescription>
          <div className="flex h-[72px] items-center border-b px-5">
            <Logo />
          </div>
          <nav aria-label="Menú móvil" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.hash}>
                  <button
                    type="button"
                    onClick={() => goTo(item.hash)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-base font-medium hover:bg-secondary cursor-pointer"
                  >
                    {item.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 border-t p-5 pb-safe">
            {user ? (
              <>
                <p className="px-1 pb-1 text-sm text-muted-foreground">
                  Hola, <span className="font-semibold text-foreground">{user.firstName}</span>
                </p>
                <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMenuOpen(false)}>
                  <Link to="/cuenta">
                    <Package /> Mis pedidos
                  </Link>
                </Button>
                {isAdmin && (
                  <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMenuOpen(false)}>
                    <Link to="/admin">
                      <LayoutDashboard /> Panel de administración
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  <LogOut /> Cerrar sesión
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" className="w-full" onClick={() => setMenuOpen(false)}>
                <Link to="/ingresar">
                  <User /> Iniciar sesión o registrarme
                </Link>
              </Button>
            )}
            <Button className="w-full" size="lg" onClick={() => goTo("productos")}>
              Comprar ahora
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
