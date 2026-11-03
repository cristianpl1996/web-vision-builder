import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Package, MapPin, RotateCcw, ShoppingBag } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { orderService, ORDER_STATUS_LABEL, type Order } from "@/services/orders";
import { formatDate, formatPrice } from "@/lib/format";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    document.title = "Mi cuenta · SINERGIA";
    if (user) orderService.listByUser(user.id).then(setOrders);
  }, [user]);

  if (!user) return null;

  const reorder = (o: Order) => {
    o.items.forEach((i, idx) => add(i.productId, i.quantity, { openDrawer: idx === o.items.length - 1 }));
  };

  return (
    <SiteLayout>
      <div className="container py-10 md:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Mi cuenta</p>
            <h1 className="mt-2 font-display text-4xl font-medium">Hola, {user.firstName}</h1>
            <p className="mt-1 text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            <LogOut /> Cerrar sesión
          </Button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <section className="lg:col-span-8" aria-labelledby="orders-title">
            <h2 id="orders-title" className="flex items-center gap-2 font-sans text-xl font-bold">
              <Package className="h-5 w-5 text-primary" /> Mis pedidos
            </h2>
            <div className="mt-5 space-y-4">
              {orders === null ? (
                [0, 1].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)
              ) : orders.length === 0 ? (
                <div className="rounded-3xl border border-dashed bg-card p-10 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-primary" />
                  <p className="mt-3 font-display text-2xl">Aún no tienes pedidos</p>
                  <p className="mt-1 text-sm text-muted-foreground">Cuando compres, aquí verás el estado de tus pedidos.</p>
                  <Button asChild className="mt-5"><Link to="/#productos">Ir a la tienda</Link></Button>
                </div>
              ) : (
                orders.map((o) => (
                  <article key={o.id} className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link to={`/pedido/${o.id}`} className="font-semibold hover:underline">Pedido {o.number}</Link>
                        <p className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{ORDER_STATUS_LABEL[o.status]}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      {o.items.map((i) => (
                        <img key={i.productId} src={i.image} alt={i.name} width={48} height={48} className="h-12 w-12 rounded-xl border bg-white object-contain" />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {o.items.reduce((n, i) => n + i.quantity, 0)} artículos
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <span className="price text-lg font-bold">{formatPrice(o.total)}</span>
                      <Button size="sm" variant="outline" onClick={() => reorder(o)}>
                        <RotateCcw /> Volver a comprar
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <aside className="lg:col-span-4" aria-labelledby="addresses-title">
            <h2 id="addresses-title" className="flex items-center gap-2 font-sans text-xl font-bold">
              <MapPin className="h-5 w-5 text-primary" /> Direcciones
            </h2>
            <div className="mt-5 space-y-3">
              {user.addresses.length === 0 ? (
                <p className="rounded-3xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
                  Guardaremos tu dirección al finalizar tu primera compra.
                </p>
              ) : (
                user.addresses.map((a, i) => (
                  <div key={i} className="rounded-3xl border bg-card p-5 text-sm">
                    <p className="font-semibold">{a.fullName}</p>
                    <p className="mt-1 text-muted-foreground">
                      {a.street} {a.extNumber}, {a.neighborhood}<br />
                      {a.city}, {a.state}, C.P. {a.postalCode}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
