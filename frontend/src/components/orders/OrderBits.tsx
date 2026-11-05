import { Check } from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, type Order, type OrderStatus } from "@/services/orders";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", ORDER_STATUS_TONE[status], className)}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

/** Historial de la orden: cada cambio de estado con su fecha y nota. */
export function OrderTimeline({ order, showAuthor = false }: { order: Order; showAuthor?: boolean }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {order.events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[31px] top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </span>
          <p className="text-sm font-semibold">{ORDER_STATUS_LABEL[e.estado] ?? e.estado}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(e.fecha)}
            {showAuthor && ` · ${e.por}`}
          </p>
          {e.nota && <p className="mt-1 text-sm text-muted-foreground">{e.nota}</p>}
        </li>
      ))}
    </ol>
  );
}

/** Productos, envío y total tal como los guardó el servidor. */
export function OrderTotals({ order }: { order: Order }) {
  return (
    <>
      <ul className="divide-y">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex items-center gap-4 py-3">
            {i.image ? (
              <img src={i.image} alt="" width={48} height={48} className="h-12 w-12 rounded-xl border bg-white object-contain p-1" />
            ) : (
              <span className="h-12 w-12 rounded-xl border bg-secondary" />
            )}
            <span className="min-w-0 flex-1 font-medium">
              {i.name} <span className="text-muted-foreground">× {i.quantity}</span>
            </span>
            <span className="price font-semibold">{formatPrice(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="price">{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Envío</dt>
          <dd className="price">{order.shipping === 0 ? "Sin costo" : formatPrice(order.shipping)}</dd>
        </div>
        <div className="flex justify-between pt-2 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="price text-xl font-bold">{formatPrice(order.total)}</dd>
        </div>
      </dl>
    </>
  );
}

export function AddressBlock({ order }: { order: Order }) {
  const a = order.address;
  return (
    <p className="text-sm text-muted-foreground">
      {a.fullName} · {a.phone}
      <br />
      {a.street} {a.extNumber}
      {a.intNumber ? ` int. ${a.intNumber}` : ""}, {a.neighborhood}
      <br />
      {a.city}, {a.state}, C.P. {a.postalCode}
      {a.references && (
        <>
          <br />
          Referencias: {a.references}
        </>
      )}
    </p>
  );
}
