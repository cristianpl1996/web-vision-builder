import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, Settings, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { OrdersTab } from "./OrdersTab";
import { ProductsTab } from "./ProductsTab";
import { SettingsTab } from "./SettingsTab";

const TABS = [
  { id: "ordenes", label: "Órdenes", icon: ShoppingBag, Component: OrdersTab, soloSuperadmin: false },
  { id: "productos", label: "Productos", icon: Package, Component: ProductsTab, soloSuperadmin: false },
  { id: "ajustes", label: "Ajustes", icon: Settings, Component: SettingsTab, soloSuperadmin: true },
] as const;

/** Panel de admin y superadmin. La pestaña va en la URL (?tab=) para poder volver o compartir el enlace.
 *  Ajustes solo lo ve el superadmin (el backend también lo exige: esconderla no es el control). */
export default function AdminPage() {
  const { user, isSuperadmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter((t) => isSuperadmin || !t.soloSuperadmin);
  const actual = tabs.find((t) => t.id === params.get("tab")) ?? tabs[0];

  useEffect(() => {
    document.title = `${actual.label} · Panel SINERGIA`;
  }, [actual]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary sm:inline">
              Panel
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground md:inline">{user?.email}</span>
            <Link to="/" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Ver la tienda
            </Link>
          </div>
        </div>
        <nav className="container -mb-px flex gap-1 overflow-x-auto" aria-label="Secciones del panel">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setParams({ tab: t.id })}
              aria-current={t.id === actual.id ? "page" : undefined}
              className={cn(
                "inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors cursor-pointer",
                t.id === actual.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="container py-8">
        <actual.Component />
      </main>
    </div>
  );
}
