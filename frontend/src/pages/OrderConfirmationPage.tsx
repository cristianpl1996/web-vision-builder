import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, CreditCard, FileUp, Landmark, Loader2, MessageCircle, Package, Paperclip, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { AddressBlock, OrderTimeline, OrderTotals, StatusBadge } from "@/components/orders/OrderBits";
import { orderService, type Order, type PaymentMethod } from "@/services/orders";
import { paymentOptions, useStoreConfig, type StoreConfig } from "@/services/store";
import { useAuth } from "@/context/AuthContext";
import { STORE } from "@/data/products";
import { ApiError } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

function mensajeWhatsApp(order: Order, cierre: string) {
  const a = order.address;
  return encodeURIComponent(
    [
      `Hola, quiero confirmar mi pedido ${order.number}:`,
      ...order.items.map((i) => `- ${i.quantity} x ${i.name} (${formatMoney(i.price * i.quantity, order.currency)})`),
      `Total: ${formatMoney(order.total, order.currency)}`,
      "",
      `Enviar a: ${a.fullName}, tel. ${a.phone}`,
      `${a.street} ${a.extNumber}${a.intNumber ? ` int. ${a.intNumber}` : ""}, col. ${a.neighborhood}, ${a.city}, ${a.state}, C.P. ${a.postalCode}`,
      `Correo: ${order.email}`,
      "",
      cierre,
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
  const { data: config } = useStoreConfig();
  // Forma de pago que el cliente está viendo (puede cambiarla mientras el pedido siga pendiente).
  const [forma, setForma] = useState<PaymentMethod | null>(null);

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
    if (retorno || order.hasReceipt) return { icon: Clock, tone: "text-amber-600", title: "Estamos confirmando tu pago" };
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

        {/* Cómo pagar: según la forma elegida y las que estén activas en Ajustes */}
        {pendiente && config && (
          <ComoPagar
            order={order}
            config={config}
            forma={forma}
            onForma={setForma}
            retorno={retorno}
            paying={paying}
            onPagar={pagar}
            onActualizada={(o) => qc.setQueryData(["orden", id], o)}
          />
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

/** Qué forma de pago mostrar: la del pedido (o la que eligió aquí) si sigue activa; si no, la otra. */
function formaVigente(preferida: PaymentMethod, disponibles: Record<PaymentMethod, boolean>): PaymentMethod | null {
  if (disponibles[preferida]) return preferida;
  const otra: PaymentMethod = preferida === "mercadopago" ? "transferencia" : "mercadopago";
  return disponibles[otra] ? otra : null;
}

function ComoPagar({
  order,
  config,
  forma,
  onForma,
  retorno,
  paying,
  onPagar,
  onActualizada,
}: {
  order: Order;
  config: StoreConfig;
  forma: PaymentMethod | null;
  onForma: (f: PaymentMethod) => void;
  retorno: string | null;
  paying: boolean;
  onPagar: () => void;
  onActualizada: (o: Order) => void;
}) {
  const disponibles = paymentOptions(config, order.currency);
  const actual = formaVigente(forma ?? order.paymentMethod, disponibles);
  const total = formatMoney(order.total, order.currency);
  const whatsapp = (cierre: string) => `https://wa.me/${STORE.whatsapp}?text=${mensajeWhatsApp(order, cierre)}`;

  if (actual === "mercadopago") {
    return (
      <div className="mt-8 rounded-3xl border border-primary/20 bg-secondary p-6 text-center">
        <CreditCard className="mx-auto h-7 w-7 text-primary" />
        <p className="mt-2 font-semibold">
          {retorno === "aprobado" || retorno === "pendiente"
            ? "Mercado Pago nos avisará en cuanto se acredite. Te mandaremos un correo."
            : "Tu pedido está guardado. Completa el pago con Mercado Pago para que lo preparemos."}
        </p>
        {retorno !== "aprobado" && (
          <Button size="lg" className="mt-4" onClick={onPagar} disabled={paying}>
            {paying ? <Loader2 className="animate-spin" /> : <CreditCard />} Pagar {total}
          </Button>
        )}
        {disponibles.transferencia && retorno !== "aprobado" && (
          <button
            type="button"
            onClick={() => onForma("transferencia")}
            className="mt-4 block w-full cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Prefiero pagar por transferencia o depósito
          </button>
        )}
      </div>
    );
  }

  if (actual === "transferencia") {
    return (
      <Transferencia
        order={order}
        datos={config.transferInfo}
        whatsapp={whatsapp}
        onActualizada={onActualizada}
        mercadoPago={disponibles.mercadopago ? onPagar : undefined}
        paying={paying}
      />
    );
  }

  // Ninguna forma activa (no debería pasar: Ajustes exige al menos una).
  return (
    <div className="mt-8 rounded-3xl border border-primary/20 bg-secondary p-6 text-center">
      <p className="font-semibold">Escríbenos para completar tu pago</p>
      <Button asChild size="lg" className="mt-4 bg-[#25D366] text-white hover:bg-[#1fb857] hover:shadow-none">
        <a href={whatsapp("¿Cómo puedo pagarlo?")} target="_blank" rel="noopener noreferrer">
          <MessageCircle /> Escribir por WhatsApp
        </a>
      </Button>
    </div>
  );
}

function Transferencia({
  order,
  datos,
  whatsapp,
  onActualizada,
  mercadoPago,
  paying,
}: {
  order: Order;
  datos: string;
  whatsapp: (cierre: string) => string;
  onActualizada: (o: Order) => void;
  mercadoPago?: () => void;
  paying: boolean;
}) {
  const archivo = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const total = formatMoney(order.total, order.currency);

  const subir = async (file: File | undefined) => {
    if (!file) return;
    setSubiendo(true);
    try {
      onActualizada(await orderService.uploadReceipt(order.id, file));
      toast.success("Recibimos tu comprobante. Te avisamos por correo en cuanto confirmemos el pago.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No pudimos subir el comprobante. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
      if (archivo.current) archivo.current.value = "";
    }
  };
  const ver = () =>
    orderService
      .openReceipt(order.id)
      .catch((e) => toast.error(e instanceof ApiError ? e.message : "No pudimos abrir el comprobante."));

  return (
    <div className="mt-8 rounded-3xl border border-primary/20 bg-secondary p-6 sm:p-8">
      <input
        ref={archivo}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        aria-label="Archivo del comprobante"
        onChange={(e) => subir(e.target.files?.[0])}
      />
      {order.hasReceipt ? (
        <div className="text-center">
          <Paperclip className="mx-auto h-7 w-7 text-primary" />
          <p className="mt-2 font-semibold">Recibimos tu comprobante</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.receiptAt && `Lo enviaste el ${formatDate(order.receiptAt)} · `}
            Lo revisamos y te avisamos por correo en cuanto confirmemos el pago.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Button variant="outline" onClick={ver}>
              <Paperclip /> Ver mi comprobante
            </Button>
            <Button variant="ghost" onClick={() => archivo.current?.click()} disabled={subiendo}>
              {subiendo ? <Loader2 className="animate-spin" /> : <FileUp />} Cambiar archivo
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Landmark className="h-6 w-6 shrink-0 text-primary" />
            <p className="font-semibold">Paga por transferencia o depósito</p>
          </div>
          <ol className="mt-4 space-y-5 text-sm">
            <li>
              <p>
                <span className="font-semibold">1. Transfiere {total}</span> y usa como referencia{" "}
                <strong>{order.number}</strong>.
              </p>
              {datos ? (
                <p className="mt-2 whitespace-pre-line rounded-2xl bg-card p-4 font-medium leading-relaxed">{datos}</p>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  Escríbenos por WhatsApp y te compartimos los datos para pagar.{" "}
                  <a
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                    href={whatsapp("¿Me comparten los datos de pago?")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pedir los datos
                  </a>
                </p>
              )}
            </li>
            <li>
              <p className="font-semibold">2. Sube tu comprobante</p>
              <p className="text-muted-foreground">Una foto o captura de pantalla, o el PDF de tu banco.</p>
              <Button size="lg" className="mt-3 w-full sm:w-auto" onClick={() => archivo.current?.click()} disabled={subiendo}>
                {subiendo ? <Loader2 className="animate-spin" /> : <FileUp />} Subir comprobante
              </Button>
            </li>
          </ol>
        </>
      )}
      <div className="mt-6 flex flex-col items-center gap-3 border-t border-primary/10 pt-4 text-sm sm:flex-row sm:justify-between">
        <a
          className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
          href={whatsapp("Tengo una duda sobre el pago.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="h-4 w-4" /> ¿Dudas? Escríbenos por WhatsApp
        </a>
        {mercadoPago && !order.hasReceipt && (
          <Button variant="outline" size="sm" onClick={mercadoPago} disabled={paying}>
            {paying ? <Loader2 className="animate-spin" /> : <CreditCard />} Mejor pagar en línea con Mercado Pago
          </Button>
        )}
      </div>
    </div>
  );
}
