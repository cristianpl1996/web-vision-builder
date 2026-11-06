import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Paperclip, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Field } from "@/components/forms/Field";
import { AddressBlock, OrderTimeline, OrderTotals, StatusBadge } from "@/components/orders/OrderBits";
import { adminService, type OrdersFilter } from "@/services/admin";
import {
  NEXT_STATUSES,
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  type Order,
  type OrderStatus,
} from "@/services/orders";
import { ApiError } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

const POR_PAGINA = 25;
const selectCls = "h-11 w-full cursor-pointer rounded-xl border border-input bg-card px-3 text-sm";

export function OrdersTab() {
  const [filtro, setFiltro] = useState<OrdersFilter>({ pagina: 1 });
  const [buscar, setBuscar] = useState("");
  const [abierta, setAbierta] = useState<Order | null>(null);

  const q = useQuery({
    queryKey: ["admin-ordenes", filtro],
    queryFn: () => adminService.orders(filtro),
    placeholderData: keepPreviousData,
  });
  const paginas = Math.max(1, Math.ceil((q.data?.total ?? 0) / POR_PAGINA));
  const cambiar = (f: Partial<OrdersFilter>) => setFiltro((v) => ({ ...v, ...f, pagina: f.pagina ?? 1 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Órdenes</h1>
          <p className="text-sm text-muted-foreground">{q.data ? `${q.data.total} en total` : "Cargando…"}</p>
        </div>
      </div>

      <form
        className="grid gap-3 rounded-3xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          cambiar({ buscar: buscar.trim() || undefined });
        }}
      >
        <Field id="f-buscar" label="Buscar">
          <Input
            id="f-buscar"
            placeholder="Número, correo o nombre"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="h-11"
          />
        </Field>
        <Field id="f-estado" label="Estado">
          <select
            id="f-estado"
            className={selectCls}
            value={filtro.estado ?? ""}
            onChange={(e) => cambiar({ estado: e.target.value || undefined })}
          >
            <option value="">Todos</option>
            {Object.entries(ORDER_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field id="f-desde" label="Desde">
          <Input id="f-desde" type="date" className="h-11" value={filtro.desde ?? ""} onChange={(e) => cambiar({ desde: e.target.value || undefined })} />
        </Field>
        <Field id="f-hasta" label="Hasta">
          <Input id="f-hasta" type="date" className="h-11" value={filtro.hasta ?? ""} onChange={(e) => cambiar({ hasta: e.target.value || undefined })} />
        </Field>
        <Button type="submit" className="self-end">
          <Search /> Buscar
        </Button>
      </form>

      {q.isError && <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">No pudimos cargar las órdenes.</p>}

      <div className="overflow-hidden rounded-3xl border bg-card">
        {q.isLoading ? (
          <div className="grid h-48 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : q.data?.items.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">No hay órdenes con estos filtros.</p>
        ) : (
          <ul className="divide-y">
            {q.data?.items.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setAbierta(o)}
                  className="grid w-full gap-2 p-4 text-left transition-colors hover:bg-secondary/50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {o.number} <span className="font-normal text-muted-foreground">· {o.customerName}</span>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} artículos ·{" "}
                      {PAYMENT_LABEL[o.paymentMethod]}
                    </p>
                    {o.status === "pendiente_pago" && o.hasReceipt && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                        <Paperclip className="h-3 w-3" /> Comprobante por revisar
                      </p>
                    )}
                  </div>
                  <span className="price font-bold">{formatMoney(o.total, o.currency)}</span>
                  <StatusBadge status={o.status} className="justify-self-start" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {paginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" disabled={(filtro.pagina ?? 1) <= 1} onClick={() => cambiar({ pagina: (filtro.pagina ?? 1) - 1 })} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <span className="text-sm">
            Página {filtro.pagina} de {paginas}
          </span>
          <Button variant="outline" size="icon" disabled={(filtro.pagina ?? 1) >= paginas} onClick={() => cambiar({ pagina: (filtro.pagina ?? 1) + 1 })} aria-label="Página siguiente">
            <ChevronRight />
          </Button>
        </div>
      )}

      <OrderSheet order={abierta} onClose={() => setAbierta(null)} onChanged={setAbierta} />
    </div>
  );
}

function OrderSheet({ order, onClose, onChanged }: { order: Order | null; onClose: () => void; onChanged: (o: Order) => void }) {
  return (
    <Sheet open={!!order} onOpenChange={(v) => !v && onClose()}>
      <SheetContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-full overflow-y-auto sm:max-w-xl">
        {/* key: al abrir otra orden, el formulario empieza de cero */}
        {order && <OrderDetail key={order.id} order={order} onChanged={onChanged} />}
      </SheetContent>
    </Sheet>
  );
}

function OrderDetail({ order, onChanged }: { order: Order; onChanged: (o: Order) => void }) {
  const qc = useQueryClient();
  const [estado, setEstado] = useState<OrderStatus | "">("");
  const [nota, setNota] = useState("");
  const [paqueteria, setPaqueteria] = useState(order.carrier ?? "");
  const [guia, setGuia] = useState(order.tracking ?? "");
  const [guardando, setGuardando] = useState(false);

  const siguientes = NEXT_STATUSES[order.status];

  const guardar = async () => {
    if (!estado) return;
    setGuardando(true);
    try {
      const o = await adminService.changeStatus(order.id, {
        status: estado,
        note: nota.trim(),
        carrier: estado === "enviada" ? paqueteria.trim() : undefined,
        tracking: estado === "enviada" ? guia.trim() : undefined,
      });
      onChanged(o);
      setEstado("");
      setNota("");
      qc.invalidateQueries({ queryKey: ["admin-ordenes"] });
      toast.success(`Orden ${o.number}: ${ORDER_STATUS_LABEL[o.status]}. Le avisamos al cliente por correo.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No se pudo cambiar el estado.");
    } finally {
      setGuardando(false);
    }
  };

  return (
          <div className="space-y-6 pb-8">
            <div>
              <SheetTitle className="font-display text-2xl">Orden {order.number}</SheetTitle>
              <SheetDescription>
                {formatDate(order.createdAt)} · {PAYMENT_LABEL[order.paymentMethod]}
              </SheetDescription>
              <div className="mt-3">
                <StatusBadge status={order.status} />
              </div>
            </div>

            <section className="rounded-2xl border p-4">
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.email}</p>
              <div className="mt-3">
                <AddressBlock order={order} />
              </div>
              {order.notes && <p className="mt-3 rounded-xl bg-secondary p-3 text-sm">Nota del cliente: {order.notes}</p>}
            </section>

            <section>
              <OrderTotals order={order} />
            </section>

            {order.hasReceipt && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm">
                  <p className="font-semibold text-amber-950">Comprobante de pago</p>
                  <p className="text-amber-900/80">
                    {order.receiptAt && `Subido el ${formatDate(order.receiptAt)} · `}
                    {order.status === "pendiente_pago" ? "Revísalo y, si el dinero ya llegó, márcala «Pagado»." : "Ya revisado."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    adminService.openReceipt(order.id).catch((e) => toast.error(e instanceof ApiError ? e.message : "No se pudo abrir."))
                  }
                >
                  <Paperclip /> Ver comprobante
                </Button>
              </section>
            )}

            {order.status === "enviada" && (
              <p className="rounded-2xl bg-secondary p-4 text-sm">
                Enviada por <strong>{order.carrier}</strong> · guía <strong>{order.tracking}</strong>
              </p>
            )}

            {siguientes.length > 0 && (
              <section className="space-y-4 rounded-2xl border border-primary/20 bg-secondary/40 p-4">
                <p className="font-semibold">Cambiar estado</p>
                <Field id="o-estado" label="Nuevo estado">
                  <select id="o-estado" className={selectCls} value={estado} onChange={(e) => setEstado(e.target.value as OrderStatus)}>
                    <option value="">Elige…</option>
                    {siguientes.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </Field>
                {estado === "enviada" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id="o-paq" label="Paquetería" required>
                      <Input id="o-paq" placeholder="Ej. Estafeta" value={paqueteria} onChange={(e) => setPaqueteria(e.target.value)} />
                    </Field>
                    <Field id="o-guia" label="Número de guía" required>
                      <Input id="o-guia" placeholder="Ej. 1234567890" value={guia} onChange={(e) => setGuia(e.target.value)} />
                    </Field>
                  </div>
                )}
                {estado === "pagada" && order.paymentMethod === "transferencia" && (
                  <p className="text-xs text-muted-foreground">
                    Márcala pagada solo cuando el dinero ya esté en tu cuenta{order.hasReceipt ? " (revisa el comprobante)" : ""}.
                  </p>
                )}
                {estado === "pagada" && order.paymentMethod === "mercadopago" && (
                  <p className="text-xs text-muted-foreground">
                    Mercado Pago la marca pagada solo. Hazlo a mano únicamente si el cliente te pagó por otro medio.
                  </p>
                )}
                <Field id="o-nota" label="Nota (opcional, queda en el historial)">
                  <Textarea id="o-nota" rows={2} className="rounded-xl" placeholder="Ej. Pago por transferencia recibido" value={nota} onChange={(e) => setNota(e.target.value)} />
                </Field>
                <Button
                  className="w-full"
                  onClick={guardar}
                  disabled={!estado || guardando || (estado === "enviada" && (!paqueteria.trim() || !guia.trim()))}
                  variant={estado === "cancelada" ? "destructive" : "default"}
                >
                  {guardando && <Loader2 className="animate-spin" />}
                  {estado ? `Marcar como «${ORDER_STATUS_LABEL[estado]}»` : "Elige un estado"}
                </Button>
              </section>
            )}

            <section>
              <p className="mb-3 font-semibold">Historial</p>
              <OrderTimeline order={order} showAuthor />
            </section>
          </div>
  );
}
