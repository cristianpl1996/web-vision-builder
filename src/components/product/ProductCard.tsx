import { Link } from "react-router-dom";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { type Product } from "@/data/products";
import { formatPrice, formatPricePrecise } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { add, lines } = useCart();
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
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              product.tier === "high" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            )}
          >
            {product.concentration}
          </span>
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
              CBD {product.cbd} · CBG {product.cbg} · {product.volume}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/80">CBD + CBG + Terpenos · Broad Spectrum</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {product.compareAtPrice && (
              <span className="price block text-sm text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
            <span className="price text-2xl font-bold">{formatPrice(product.price)}</span>
            <span className="price block text-xs text-muted-foreground">
              {formatPricePrecise(product.price / product.totalMg)} por mg
            </span>
          </div>
          <Button onClick={() => add(product.id)} aria-label={`Agregar ${product.name} al carrito`}>
            {inCart > 0 ? <Check /> : <ShoppingBag />}
            {inCart > 0 ? `En carrito (${inCart})` : "Agregar"}
          </Button>
        </div>
      </div>
    </article>
  );
}
