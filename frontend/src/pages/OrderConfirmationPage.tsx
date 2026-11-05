import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, CreditCard, Loader2, MessageCircle, Package, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { AddressBlock, OrderTimeline, OrderTotals, StatusBadge } from "@/components/orders/OrderBits";
import { orderService, type Order } from "@/services/orders";
import { useAuth } from "@/context/AuthContext";
import { STORE } from "@/data/products";
import { ApiError } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

function mensajeWhatsApp(order: Order) {
  const a = order.address;
  return encodeURIComponent(
    [
      `Hola, quiero confirmar mi pedido ${order.number}:`,
      ...order.items.map((i) => `- ${i.quantity} x ${i.name} (${formatPrice(i.price * i.quantity)})`),
      `Total: ${formatPrice(order.total)}`,
      "",
      `Enviar a: ${a.fullName}, tel. ${a.phone}`,
      `${a.street} ${a.extNumber}${a.intNumber ? ` int. ${a.intNumber}` : ""}, col. ${a.neighborhood}, ${a.city}, ${a.state}, C.P. ${a.postalCode}`,
      `Correo: ${order.email}`,
      "",
      "¿Me comparten los datos de pago?",
    ].join("\n"),
  );
}

export default function OrderConfirmationPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const retorno = params.get("pago"); // aprobado | pendiente | rechazado (lo pone Mercado Pago al volver)
  const { user } = useAuth();
  const qc = useQueryClient();
  const [paying, setPaying] = useState(false);

  const q = useQuery({
    queryKey: ["orden", id],
    // Al volver de Mercado Pago se consulta el pago a MP (por API, no por la URL).
    queryFn: () => (retorno ? orderService.verifyPayment(id) : orderService.get(id)),
    retry: false,
    // Si MP dijo «aprobado» pero el aviso aún no llega, se vuelve a preguntar unos segundos.
    refetchInterval: (query) => {
      const o = query.state.data as Order | undefined;
      return retorno === "aprobado" && o?.status === "pendiente_pago" && query.state.dataUpdateCount < 6 ? 2500 : false;
    },
  });
  const order = q.data;

  useEffect(() => {
    document.title = order ? `Pedido ${order.number} · SINERGIA` : "Tu pedido · SINERGIA";
  }, [order]);

  const pagar = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const { paymentUrl } = await orderService.retryPayment(order.id);
      if (paymentUrl) window.location.assign(paymentUrl);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No pudimos abrir el pago. Intenta de nuevo.");
      setPaying(false);
      qc.invalidateQueries({ queryKey: ["orden", id] });
    }
  };

  if (q.isLoading) {
    return (
      <SiteLayout minimal>
        <div className="grid min-h-[60vh] place-items-center" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (!order) {
    return (
      <SiteLayout minimal>
        <div className="container py-24 text-center">
          <h1 className="font-display text-3xl">No encontramos este pedido</h1>
          <Button asChild className="mt-6">
            <Link to="/cuenta">Ver mis pedidos</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const pendiente = order.status === "pendiente_pago";
  const encabezado = (() => {
    if (order.status === "cancelada") return { icon: XCircle, tone: "text-destructive", title: "Pedido cancelado" };
    if (!pendiente) return { icon: CheckCircle2, tone: "text-success", title: `¡Gracias, ${user?.firstName}!` };
    if (retorno === "rechazado") return { icon: XCircle, tone: "text-destructive", title: "El pago no se completó" };
    if (retorno) return { icon: Clock, tone: "text-amber-600", title: "Estamos confirmando tu pago" };
    return { icon: CheckCircle2, tone: "text-success", title: `¡Gracias, ${user?.firstName}!` };
  })();
  const Icono = encabezado.icon;

  return (
    <SiteLayout minimal>
      <div className="container max-w-3xl py-10 md:py-16">
        <div className="text-center">
          <Icono className={`mx-auto h-16 w-16 animate-fade-up ${encabezado.tone}`} />
          <h1 className="mt-5 font-display text-4xl font-medium sm:text-5xl">{encabezado.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Pedido <strong className="text-foreground">{order.number}</strong>
          </p>
        </div>

        {/* Siguiente paso según el estado */}
        {pendiente && order.paymentMethod === "mercadopago" && (
          <div className="mt-8 rounded-3xl border border-primary/20 bg-secondary p-6 text-center">
            <p className="font-semibold">
              {retorno === "aprobado" || retorno === "pendiente"
                ? "Mercado Pago nos avisará en cuanto se acredite. Te mandaremos un correo."
                : "Tu pedido está guardado. Completa el pago para que lo preparemos."}
            </p>
            {retorno !== "aprobado" && (
              <Button size="lg" className="mt-4" onClick={pagar} disabled={paying}>
                {paying ? <Loader2 className="animate-spin" /> : <CreditCard />} Pagar {formatPrice(order.total)}
              </Button>
            )}
          </div>
        )}
        {pendiente && order.paymentMethod === "whatsapp" && (
          <div className="mt-8 rounded-3xl border border-primary/20 bg-secondary p-6 text-center">
            <p className="font-semibold">Último paso: envíanos tu pedido por WhatsApp</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Te abrimos el mensaje con tu pedido listo. Solo envíalo y te compartimos los datos de pago.
            </p>
            <Button asChild size="lg" className="mt-4 bg-[#25D366] text-white hover:bg-[#1fb857] hover:shadow-none">
              <a href={`https://wa.me/${STORE.whatsapp}?text=${mensajeWhatsApp(order)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Enviar pedido por WhatsApp
              </a>
            </Button>
          </div>
        )}
        {order.status === "enviada" && (
          <div className="mt-8 flex items-start gap-4 rounded-3xl border bg-card p-6">
            <Truck className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Tu pedido va en camino</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Paquetería: <strong className="text-foreground">{order.carrier}</strong> · Guía:{" "}
                <strong className="text-foreground">{order.tracking}</strong>
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            <StatusBadge status={order.status} />
          </div>
          <OrderTotals order={order} />
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-muted p-4">
              <p className="mb-1 text-sm font-semibold">Enviar a</p>
              <AddressBlock order={order} />
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Seguimiento</p>
              <OrderTimeline order={order} />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" variant="outline">
            <Link to="/cuenta">
              <Package /> Ver mis pedidos
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/">Volver a la tienda</Link>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}
