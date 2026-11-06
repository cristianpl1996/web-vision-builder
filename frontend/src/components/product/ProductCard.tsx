import { Link } from "react-router-dom";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { type Product } from "@/data/products";
import { useCurrency } from "@/context/CurrencyContext";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { add, lines } = useCart();
  const { price, convert, pricePrecise } = useCurrency();
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium",
        className,
      )}
    >
      <Link
        to={`/producto/${product.slug}`}
        className="relative block aspect-[4/4] overflow-hidden bg-white"
        aria-label={`Ver detalles de ${product.name}`}
      >
        {/* Bottles share one baseline and grow from 250 to 1500 mg */}
        <div className="absolute bottom-[12%] left-1/2 h-4 w-1/2 -translate-x-1/2 rounded-[100%] bg-foreground/15 blur-md" />
        <div className="absolute inset-x-0 bottom-[13%] top-[14%] flex items-end justify-center">
          <img
            src={product.bottle}
            alt={product.name}
            loading="lazy"
            style={{ height: `${product.bottleScale * 100}%` }}
            className="w-auto origin-bottom object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.18)] transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        </div>
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.concentration && (
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
              {product.concentration}
            </span>
          )}
          {product.soldOut && (
            <span className="rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">Agotado</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-medium sm:text-2xl">
              <Link to={`/producto/${product.slug}`} className="hover:text-primary">
                {product.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {[product.cbd && `CBD ${product.cbd}`, product.cbg && `CBG ${product.cbg}`, product.volume].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {/* La frase de la fórmula solo para productos con cannabinoides; otras líneas muestran su nombre. */}
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          {product.cbd ? "CBD + CBG + Terpenos · Broad Spectrum" : product.line}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {product.compareAtPrice && (
              <span className="price block text-sm text-muted-foreground line-through">{price(product.compareAtPrice)}</span>
            )}
            {product.price === null ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <MessageCircle className="h-4 w-4" /> Precio por WhatsApp
              </span>
            ) : (
              <>
                <span className="price text-2xl font-bold">{price(product.price)}</span>
                <span className="price block text-xs text-muted-foreground">
                  {product.totalMg > 0 && `${pricePrecise(convert(product.price) / product.totalMg)} por mg`}
                </span>
              </>
            )}
          </div>
          {product.soldOut ? (
            <Button variant="outline" disabled>
              Agotado
            </Button>
          ) : (
            <Button onClick={() => add(product.id)} aria-label={`Agregar ${product.name} al carrito`}>
              {inCart > 0 ? <Check /> : <ShoppingBag />}
              {inCart > 0 ? `En carrito (${inCart})` : "Agregar"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Placeholder for a presentation BOTICAN hasn't sent yet (data + professional photo pending). */
export function UpcomingCard({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border-2 border-dashed border-primary/25 bg-card/60",
        className,
      )}
      aria-label="Nueva presentación, próximamente"
    >
      <div className="relative grid aspect-square place-items-center bg-gradient-to-b from-secondary/70 to-card">
        <div className="flex flex-col items-center gap-3 text-primary/70">
          <svg viewBox="0 0 40 96" className="h-28 w-auto opacity-60" aria-hidden="true">
            <rect x="15" y="2" width="10" height="20" rx="4" fill="currentColor" opacity=".55" />
            <rect x="11" y="20" width="18" height="12" rx="2" fill="currentColor" opacity=".7" />
            <path d="M12 32h16v6c6 2 9 6 9 12v38a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V50c0-6 3-10 9-12z" fill="currentColor" opacity=".35" />
          </svg>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">Próximamente</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-xl font-medium text-foreground/70 sm:text-2xl">Nueva presentación</h3>
        <p className="mt-1 text-sm text-muted-foreground">CBD + CBG + Terpenos · Broad Spectrum</p>
        <p className="mt-auto pt-5 text-sm text-muted-foreground">Muy pronto en la tienda.</p>
      </div>
    </article>
  );
}
