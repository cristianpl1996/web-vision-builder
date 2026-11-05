import { useState } from "react";
import { isUpcoming } from "@/data/products";
import { useCatalog } from "@/context/CatalogContext";
import { ProductCard, UpcomingCard } from "@/components/product/ProductCard";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const NUMEROS = ["", "Una", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez"];

const ProductsSection = () => {
  const ref = useReveal<HTMLElement>();
  const { shopItems, products, loading, error } = useCatalog();
  // Los filtros salen de las concentraciones que de verdad hay en el catálogo.
  const concentraciones = [...new Set(products.map((p) => p.concentration).filter(Boolean))].sort(
    (a, b) => parseFloat(a) - parseFloat(b),
  );
  const FILTERS = [{ id: "all", label: "Todos" }, ...concentraciones.map((c) => ({ id: c, label: c }))];
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? shopItems : products.filter((p) => p.concentration === filter);
  const total = shopItems.length;

  return (
    <section ref={ref} id="productos" className="section scroll-mt-20" aria-labelledby="productos-title">
      <div className="container">
        <div className="reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">Tienda</span>
            <h2 id="productos-title" className="section-title mt-4">
              Elige la mejor opción
            </h2>
            <p className="section-lead">{NUMEROS[total] ?? total} presentaciones diseñadas para adaptarse a las necesidades de tu mascota.</p>
          </div>

          {FILTERS.length > 2 && (
          <div role="tablist" aria-label="Filtrar por concentración" className="inline-flex self-start rounded-full border bg-card p-1 md:self-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-10 rounded-full px-4 text-sm font-semibold transition-colors cursor-pointer sm:px-5",
                  filter === f.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          )}
        </div>

        {loading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-secondary" />
            ))}
          </div>
        )}
        {error && (
          <p className="mt-10 rounded-3xl border bg-card p-8 text-center text-muted-foreground">
            No pudimos cargar los productos. Recarga la página o escríbenos por WhatsApp.
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-5 lg:mt-10 lg:gap-6">
          {visible.map((item, i) => (
            <div
              key={item.id}
              className="reveal w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)]"
              style={{ transitionDelay: `${(i % 4) * 60}ms` }}
            >
              {isUpcoming(item) ? <UpcomingCard className="h-full" /> : <ProductCard product={item} className="h-full" />}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Uso veterinario. ¿Dudas sobre qué presentación elegir? Escríbenos y te asesoramos.
        </p>
      </div>
    </section>
  );
};

export default ProductsSection;
