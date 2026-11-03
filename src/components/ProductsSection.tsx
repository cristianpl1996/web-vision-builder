import { useState } from "react";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "standard", label: "25 mg/ml" },
  { id: "high", label: "50 mg/ml" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const ProductsSection = () => {
  const ref = useReveal<HTMLElement>();
  const [filter, setFilter] = useState<FilterId>("all");
  const visible = PRODUCTS.filter((p) => filter === "all" || p.tier === filter);

  return (
    <section ref={ref} id="productos" className="section scroll-mt-20" aria-labelledby="productos-title">
      <div className="container">
        <div className="reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">Tienda</span>
            <h2 id="productos-title" className="section-title mt-4">
              Elige la mejor opción
            </h2>
            <p className="section-lead">Cinco presentaciones diseñadas para adaptarse a las necesidades de tu mascota.</p>
          </div>

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
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-5 lg:mt-10 lg:gap-6">
          {visible.map((product, i) => (
            <div key={product.id} className="reveal w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-16px)]" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
              <ProductCard product={product} className="h-full" />
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
