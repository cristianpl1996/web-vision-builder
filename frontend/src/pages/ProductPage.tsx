import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ShoppingBag, Zap, MessageCircle, PawPrint, Leaf, Check, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { ProductCard } from "@/components/product/ProductCard";
import { STORE } from "@/data/products";
import { useCatalog } from "@/context/CatalogContext";
import { formatPrice, formatPricePrecise, priceOrQuote } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BENEFITS } from "@/components/SystemSection";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const { getBySlug, products, loading } = useCatalog();
  const product = getBySlug(slug);
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
    if (product) document.title = `${product.name} · SINERGIA by BOTICAN`;
  }, [product]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="grid min-h-[60vh] place-items-center" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }
  if (!product) return <Navigate to="/404" replace />;

  // Las demás presentaciones de la misma línea (para el selector y «Otras presentaciones»).
  const PRODUCTS = products.filter((p) => p.line === product.line);
  const comprable = !product.soldOut && product.price !== null;
  const waTexto = encodeURIComponent(`Hola, me interesa ${product.name}`);

  const buyNow = () => {
    add(product.id, qty, { openDrawer: false });
    navigate(user ? "/checkout" : "/ingresar?redirect=/checkout&reason=checkout");
  };

  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);
  const specs = product.specs;

  return (
    <SiteLayout fabRaised>
      <div className="container pb-32 pt-4 md:pb-20">
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 py-3 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Inicio</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/#productos" className="hover:text-foreground">Tienda</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span aria-current="page" className="truncate text-foreground">{product.name}</span>
        </nav>

        <div className="mt-2 grid gap-8 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-[2rem] border bg-white">
              <div className="flex aspect-square w-full items-end justify-center px-6 pb-[10%] pt-[8%]">
                <img src={product.bottle} alt={product.name} style={{ height: `${product.bottleScale * 100}%` }} className="w-auto object-contain drop-shadow-[0_20px_24px_rgba(0,0,0,0.2)]" />
              </div>
            </div>
            {/* Size switcher */}
            <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
              {PRODUCTS.map((p) => (
                <Link
                  key={p.id}
                  to={`/producto/${p.slug}`}
                  aria-label={p.name}
                  aria-current={p.id === product.id ? "true" : undefined}
                  className={cn(
                    "overflow-hidden rounded-2xl border-2 bg-white p-1 transition-colors",
                    p.id === product.id ? "border-primary" : "border-transparent hover:border-border",
                  )}
                >
                  <div className="flex aspect-square w-full items-end justify-center pb-[10%] pt-[10%]">
                    <img src={p.bottle} alt="" style={{ height: `${p.bottleScale * 100}%` }} className="w-auto object-contain" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="eyebrow">CBD + CBG + Terpenos · Broad Spectrum</p>
            <h1 className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{product.description}</p>

            {product.price === null ? (
              <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-semibold text-primary">
                <MessageCircle className="h-4 w-4" /> Precio por WhatsApp
              </p>
            ) : (
              <div className="mt-6 flex items-end gap-3">
                <span className="price text-4xl font-bold">{formatPrice(product.price)}</span>
                <span className="price pb-1.5 text-sm text-muted-foreground">
                  {STORE.currency}
                  {product.totalMg > 0 && ` · ${formatPricePrecise(product.price / product.totalMg)} por mg`}
                </span>
              </div>
            )}

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold">
                Presentación: <span className="font-normal text-muted-foreground">{product.totalMg} mg · {product.volume}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {PRODUCTS.map((p) => (
                  <Link
                    key={p.id}
                    to={`/producto/${p.slug}`}
                    className={cn(
                      "rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors",
                      p.id === product.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30",
                    )}
                  >
                    {p.totalMg} mg
                  </Link>
                ))}
              </div>
              {product.concentration && (
                <p className="mt-3 flex items-center gap-2 text-sm text-primary">
                  <Check className="h-4 w-4" /> Concentración {product.concentration}
                </p>
              )}
            </div>

            {comprable ? (
              <>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <QuantityStepper value={qty} onChange={setQty} className="self-start" />
                  <Button size="xl" className="w-full sm:w-auto sm:flex-1" onClick={() => add(product.id, qty)}>
                    <ShoppingBag /> Agregar al carrito
                  </Button>
                </div>
                <Button size="xl" variant="outline" className="mt-3 w-full" onClick={buyNow}>
                  <Zap /> Comprar ahora
                </Button>
              </>
            ) : (
              <div className="mt-8 space-y-3">
                {product.soldOut && (
                  <p className="rounded-2xl bg-secondary p-4 text-sm font-medium">Esta presentación está agotada por ahora.</p>
                )}
                <Button asChild size="xl" variant="outline" className="w-full">
                  <a href={`https://wa.me/${STORE.whatsapp}?text=${waTexto}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle /> Pregúntanos por WhatsApp
                  </a>
                </Button>
              </div>
            )}

            <ul className="mt-8 grid gap-3 rounded-3xl bg-secondary/70 p-5 text-sm sm:grid-cols-3">
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> Asesoría por WhatsApp</li>
              <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> CBD + CBG + Terpenos</li>
              <li className="flex items-center gap-2"><PawPrint className="h-4 w-4 text-primary" /> Uso veterinario</li>
            </ul>

            <Accordion type="multiple" defaultValue={["specs"]} className="mt-8">
              <AccordionItem value="specs">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">Ficha técnica</AccordionTrigger>
                <AccordionContent>
                  <dl className="divide-y rounded-2xl border bg-card">
                    {specs.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="text-right font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="beneficios">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">Beneficios</AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                  <ul className="space-y-3">
                    {BENEFITS.map((b) => (
                      <li key={b.title}>
                        <strong className="text-foreground">{b.title}.</strong> {b.lead} {b.text}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <section className="mt-20" aria-labelledby="related-title">
          <h2 id="related-title" className="section-title text-3xl sm:text-4xl">Otras presentaciones</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 shadow-[0_-8px_24px_-12px_hsl(var(--foreground)/0.15)] backdrop-blur-lg md:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className={product.price === null ? "text-sm font-semibold text-primary" : "price text-lg font-bold"}>{product.price === null ? priceOrQuote(null) : formatPrice(product.price * qty)}</p>
          </div>
          {comprable ? (
            <Button size="lg" onClick={() => add(product.id, qty)}>
              <ShoppingBag /> Agregar
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline">
              <a href={`https://wa.me/${STORE.whatsapp}?text=${waTexto}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
