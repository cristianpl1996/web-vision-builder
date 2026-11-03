import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Lock, ArrowRight, Info } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { PRICES_READY, PRODUCTS } from "@/data/products";
import { formatPrice, priceOrQuote } from "@/lib/format";
import { QuantityStepper } from "./QuantityStepper";

export function CartDrawer() {
  const { lines, count, subtotal, isOpen, setOpen, setQuantity, remove, add, close } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const upsell = PRODUCTS.filter((p) => !lines.some((l) => l.productId === p.id)).slice(-2);

  const checkout = () => {
    close();
    navigate(user ? "/checkout" : "/ingresar?redirect=/checkout&reason=checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0">
        <div className="flex h-16 items-center border-b px-5 pr-16">
          <SheetTitle className="font-sans text-lg font-bold">
            Tu carrito <span className="font-medium text-muted-foreground">({count})</span>
          </SheetTitle>
          <SheetDescription className="sr-only">Productos agregados a tu carrito de compras</SheetDescription>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary">
              <ShoppingBag className="h-9 w-9 text-primary" />
            </div>
            <div>
              <p className="font-display text-2xl">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-muted-foreground">Elige la presentación ideal para tu mascota.</p>
            </div>
            <Button
              onClick={() => {
                close();
                setTimeout(() => {
                  if (location.pathname === "/") document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
                  else navigate("/#productos");
                }, 250);
              }}
            >
              Ver productos <ArrowRight />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <ul className="divide-y px-5 pt-2">
                {lines.map(({ product, quantity, lineTotal }) => (
                  <li key={product.id} className="flex gap-4 py-4">
                    <Link
                      to={`/producto/${product.slug}`}
                      onClick={close}
                      className="grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-white"
                    >
                      <img src={product.image} alt={product.name} width={80} height={96} className="h-full w-full object-contain p-1" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={`/producto/${product.slug}`} onClick={close} className="font-semibold leading-tight hover:underline">
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {product.concentration} · {product.volume}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(product.id)}
                          className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive cursor-pointer"
                          aria-label={`Eliminar ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantityStepper size="sm" value={quantity} onChange={(q) => setQuantity(product.id, q)} min={1} />
                        {PRICES_READY && <span className="price font-semibold">{formatPrice(lineTotal)}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {upsell.length > 0 && (
                <div className="border-t bg-muted/50 px-5 py-5">
                  <p className="mb-3 text-sm font-semibold">También te puede interesar</p>
                  <div className="grid grid-cols-2 gap-3">
                    {upsell.map((p) => (
                      <div key={p.id} className="flex flex-col rounded-2xl border bg-card p-3">
                        <img src={p.image} alt={p.name} loading="lazy" width={120} height={120} className="mx-auto h-24 w-24 object-contain" />
                        <p className="mt-2 text-sm font-semibold leading-tight">{p.name}</p>
                        <p className="price text-sm text-muted-foreground">{priceOrQuote(p.price)}</p>
                        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => add(p.id, 1, { openDrawer: false })}>
                          Agregar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t bg-background p-5 pb-safe shadow-[0_-8px_24px_-12px_hsl(var(--foreground)/0.12)]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">{PRICES_READY ? "Subtotal" : "Productos"}</span>
                <span className="price text-xl font-bold">{PRICES_READY ? formatPrice(subtotal) : count}</span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" aria-hidden /> {PRICES_READY ? "Envío por confirmar al enviar tu pedido." : "Precio y envío te los confirmamos por WhatsApp."}
              </p>
              <Button size="xl" className="mt-4 w-full" onClick={checkout}>
                <Lock /> Finalizar compra
              </Button>
              <button
                type="button"
                onClick={close}
                className="mt-2 w-full py-2 text-center text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
