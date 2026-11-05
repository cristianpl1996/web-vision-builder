import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, MessageCircle, Package, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { orderService, ORDER_STATUS_LABEL, type Order } from "@/services/orders";
import { useAuth } from "@/context/AuthContext";
import { STORE } from "@/data/products";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrderConfirmationPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    orderService.get(id).then((o) => setOrder(o && o.userId === user?.id ? o : null));
  }, [id, user?.id]);

  if (order === undefined) {
    return (
      <SiteLayout minimal>
        <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </SiteLayout>
    );
  }

  if (!order) {
    return (
      <SiteLayout minimal>
        <div className="container py-24 text-center">
          <h1 className="font-display text-3xl">No encontramos este pedido</h1>
          <Button asChild className="mt-6"><Link to="/cuenta">Ver mis pedidos</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  // Until a backend exists, the order reaches the store only through this WhatsApp message.
  const a = order.address;
  const waText = encodeURIComponent(
    [
      `Hola, quiero confirmar mi pedido ${order.number}:`,
      ...order.items.map((i) => `- ${i.quantity} x ${i.name}${i.price === null ? "" : ` (${formatPrice(i.price * i.quantity)})`}`),
      order.total === null ? "" : `Total productos: ${formatPrice(order.total)}`,
      "",
      `Enviar a: ${a.fullName}, tel. ${a.phone}`,
      `${a.street} ${a.extNumber}${a.intNumber ? ` int. ${a.intNumber}` : ""}, col. ${a.neighborhood}, ${a.city}, ${a.state}, C.P. ${a.postalCode}`,
      a.references ? `Referencias: ${a.references}` : "",
      `Correo: ${order.email}`,
      "",
      order.total === null ? "¿Me confirman el precio, el envío y las opciones de pago?" : "¿Me confirman el envío y las opciones de pago?",
    ]
      .filter((l, idx, arr) => l !== "" || arr[idx - 1] !== "")
      .join("\n"),
  );

  return (
    <SiteLayout minimal>
      <div className="container max-w-3xl py-10 md:py-16">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 animate-fade-up text-success" />
          <h1 className="mt-5 font-display text-4xl font-medium sm:text-5xl">¡Gracias, {user?.firstName}!</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Tu pedido <strong className="text-foreground">{order.number}</strong> está casi listo.
          </p>
        </div>

        {order.status === "pending_payment" && order.paymentMethod === "manual" && (
          <div className="mt-8 rounded-3xl border border-primary/20 bg-secondary p-6 text-center">
            <p className="font-semibold">Último paso: envíanos tu pedido por WhatsApp</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Te abrimos el mensaje con tu pedido listo. Solo envíalo y te confirmamos el precio, el pago y el envío.
            </p>
            <Button asChild size="lg" className="mt-4 bg-[#25D366] text-white hover:bg-[#1fb857] hover:shadow-none">
              <a href={`https://wa.me/${STORE.whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Enviar pedido por WhatsApp
              </a>
            </Button>
          </div>
        )}

        <div className="mt-8 rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{ORDER_STATUS_LABEL[order.status]}</span>
          </div>
          <ul className="divide-y">
            {order.items.map((i) => (
              <li key={i.productId} className="flex items-center gap-4 py-4">
                <img src={i.image} alt="" width={56} height={56} className="h-14 w-14 rounded-xl border bg-white object-contain" />
                <span className="flex-1 font-medium">{i.name} <span className="text-muted-foreground">× {i.quantity}</span></span>
                {i.price !== null && <span className="price font-semibold">{formatPrice(i.price * i.quantity)}</span>}
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t pt-4 text-sm">
            {order.total !== null && (
              <div className="flex justify-between text-base"><dt className="font-semibold">Total productos</dt><dd className="price text-xl font-bold">{formatPrice(order.total)}</dd></div>
            )}
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{order.total === null ? "Precio y envío" : "Envío"}</dt><dd className="text-right">Por confirmar en WhatsApp</dd></div>
          </dl>
          <div className="mt-6 rounded-2xl bg-muted p-4 text-sm">
            <p className="font-semibold">Enviar a</p>
            <p className="mt-1 text-muted-foreground">
              {order.address.fullName} · {order.address.phone}<br />
              {order.address.street} {order.address.extNumber}{order.address.intNumber ? ` int. ${order.address.intNumber}` : ""}, {order.address.neighborhood}<br />
              {order.address.city}, {order.address.state}, C.P. {order.address.postalCode}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" variant="outline"><Link to="/cuenta"><Package /> Ver mis pedidos</Link></Button>
          <Button asChild size="lg"><Link to="/">Volver a la tienda</Link></Button>
        </div>
      </div>
    </SiteLayout>
  );
}
