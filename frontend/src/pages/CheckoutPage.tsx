import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Loader2, Lock, ShieldCheck, Truck, CreditCard, MessageCircle, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/forms/Field";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { STORE } from "@/data/products";
import { MX_STATES } from "@/data/content";
import { formatPrice } from "@/lib/format";
import { orderService, type PaymentMethod } from "@/services/orders";
import { shippingFor, useStoreConfig } from "@/services/store";
import { ApiError } from "@/lib/api";
import type { Address } from "@/services/auth";
import { cn } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().trim().min(3, "Ingresa el nombre de quien recibe"),
  phone: z.string().trim().regex(/^\d{10}$/, "Ingresa 10 dígitos"),
  street: z.string().trim().min(2, "Ingresa la calle"),
  extNumber: z.string().trim().min(1, "Ingresa el número exterior"),
  intNumber: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Ingresa la colonia"),
  postalCode: z.string().trim().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
  city: z.string().trim().min(2, "Ingresa la ciudad o alcaldía"),
  state: z.string().min(1, "Selecciona un estado"),
  references: z.string().trim().max(200).optional(),
  saveAddress: z.boolean().default(true),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});
type Values = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { lines, subtotal, count, clear } = useCart();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { data: config, isLoading: configLoading } = useStoreConfig();
  const [paymentId, setPaymentId] = useState<PaymentMethod | null>(null);
  // Con Mercado Pago activo se propone tarjeta; si no, WhatsApp.
  const metodo: PaymentMethod = paymentId ?? (config?.mercadopago ? "mercadopago" : "whatsapp");
  const PAYMENT_METHODS = [
    {
      id: "mercadopago" as const,
      label: "Tarjeta, OXXO o transferencia (Mercado Pago)",
      description: config?.mercadopago
        ? "Pagas en el sitio seguro de Mercado Pago y vuelves aquí."
        : "Disponible muy pronto.",
      enabled: !!config?.mercadopago,
    },
    {
      id: "whatsapp" as const,
      label: "Coordinar el pago por WhatsApp",
      description: "Te enviamos los datos de pago por WhatsApp al recibir tu pedido.",
      enabled: true,
    },
  ];
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const saved = user?.addresses[0];
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: saved
      ? { ...saved, saveAddress: true }
      : {
          fullName: user ? `${user.firstName} ${user.lastName}` : "",
          phone: user?.phone ?? "",
          state: "",
          saveAddress: true,
        },
  });

  useEffect(() => {
    document.title = "Finalizar compra · SINERGIA";
  }, []);

  // Mismo cálculo que el servidor, solo para mostrar: el total que vale es el que devuelve la API.
  const shipping = shippingFor(config, subtotal);
  const total = subtotal + shipping;

  if (!placing && lines.length === 0) return <Navigate to="/" replace />;
  if (!user) return null;

  const onSubmit = async (v: Values) => {
    setPlacing(true);
    try {
      const { saveAddress, notes, ...rest } = v;
      const address = rest as Address;
      if (saveAddress) {
        await updateProfile({ addresses: [address, ...user.addresses.filter((a) => a.postalCode !== address.postalCode || a.street !== address.street)].slice(0, 3) });
      }
      const { order, paymentUrl } = await orderService.create({
        items: lines.map((l) => ({ productId: Number(l.productId), quantity: l.quantity })),
        address,
        paymentMethod: metodo,
        notes: notes || undefined,
      });
      clear();
      if (paymentUrl) {
        window.location.assign(paymentUrl); // checkout de Mercado Pago
        return;
      }
      navigate(`/pedido/${order.id}`, { replace: true });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No pudimos procesar tu pedido. Intenta de nuevo.");
      setPlacing(false);
    }
  };

  const onInvalid = (errs: typeof errors) => {
    const first = Object.keys(errs)[0] as keyof Values | undefined;
    if (first) setFocus(first);
    toast.error("Revisa los campos marcados para continuar.");
  };

  const reg = (name: keyof Values) => ({
    id: `co-${name}`,
    "aria-invalid": !!errors[name],
    "aria-describedby": `co-${name}-msg`,
    ...register(name),
  });

  const Summary = (
    <div className="space-y-4">
      <ul className="space-y-4">
        {lines.map(({ product, quantity, lineTotal }) => (
          <li key={product.id} className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-xl border bg-white">
              <img src={product.image} alt="" width={64} height={64} className="h-14 w-14 object-contain" />
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-foreground px-1 text-xs font-bold text-background">
                {quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.concentration} · {product.volume}</p>
            </div>
            <span className="price font-semibold">{formatPrice(lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="price">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Envío</dt>
          <dd className="price text-right font-medium">{shipping === 0 ? "Sin costo" : formatPrice(shipping)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t pt-3 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="price text-2xl font-bold">
            <span className="mr-1 text-xs font-medium text-muted-foreground">{STORE.currency}</span>
            {formatPrice(total)}
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <SiteLayout minimal hideFab>
      {/* Mobile collapsible summary */}
      <div className="border-b bg-secondary/60 lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="container flex h-14 items-center justify-between text-sm font-semibold text-primary cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {summaryOpen ? "Ocultar" : "Ver"} resumen ({count})
            <ChevronDown className={cn("h-4 w-4 transition-transform", summaryOpen && "rotate-180")} />
          </span>
          <span className="price text-base text-foreground">{total === null ? `${count} ${count === 1 ? "producto" : "productos"}` : formatPrice(total)}</span>
        </button>
        {summaryOpen && <div className="container pb-5">{Summary}</div>}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="container grid gap-10 py-8 lg:grid-cols-12 lg:gap-14 lg:py-12">
        <div className="space-y-10 lg:col-span-7">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Seguir comprando
            </Link>
            <h1 className="mt-3 font-display text-4xl font-medium">Finalizar compra</h1>
          </div>

          {/* Step 1: account */}
          <section aria-labelledby="step-account" className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-4">
              <StepBadge n={1} done />
              <div>
                <h2 id="step-account" className="text-sm font-semibold text-muted-foreground">Cuenta</h2>
                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </section>

          {/* Step 2: address */}
          <section aria-labelledby="step-address">
            <div className="mb-5 flex items-center gap-4">
              <StepBadge n={2} />
              <h2 id="step-address" className="font-sans text-xl font-bold">Dirección de envío</h2>
            </div>
            <fieldset className="grid gap-5 sm:grid-cols-6">
              <legend className="sr-only">Dirección de envío</legend>
              <Field id="co-fullName" label="Nombre de quien recibe" required error={errors.fullName?.message} className="sm:col-span-4">
                <Input autoComplete="name" placeholder="Ej. María González" {...reg("fullName")} />
              </Field>
              <Field id="co-phone" label="Celular" required error={errors.phone?.message} className="sm:col-span-2">
                <Input type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="Ej. 5512345678" {...reg("phone")} />
              </Field>
              <Field id="co-street" label="Calle" required error={errors.street?.message} className="sm:col-span-4">
                <Input autoComplete="address-line1" placeholder="Ej. Av. Insurgentes Sur" {...reg("street")} />
              </Field>
              <Field id="co-extNumber" label="Núm. ext." required error={errors.extNumber?.message} className="sm:col-span-1">
                <Input placeholder="Ej. 123" {...reg("extNumber")} />
              </Field>
              <Field id="co-intNumber" label="Núm. int." error={errors.intNumber?.message} className="sm:col-span-1">
                <Input autoComplete="address-line2" placeholder="Ej. 4B" {...reg("intNumber")} />
              </Field>
              <Field id="co-postalCode" label="Código postal" required error={errors.postalCode?.message} className="sm:col-span-2">
                <Input inputMode="numeric" maxLength={5} autoComplete="postal-code" placeholder="Ej. 06700" {...reg("postalCode")} />
              </Field>
              <Field id="co-neighborhood" label="Colonia" required error={errors.neighborhood?.message} className="sm:col-span-4">
                <Input autoComplete="address-level3" placeholder="Ej. Roma Norte" {...reg("neighborhood")} />
              </Field>
              <Field id="co-city" label="Ciudad / Alcaldía" required error={errors.city?.message} className="sm:col-span-3">
                <Input autoComplete="address-level2" placeholder="Ej. Cuauhtémoc" {...reg("city")} />
              </Field>
              <Field id="co-state" label="Estado" required error={errors.state?.message} className="sm:col-span-3">
                <select
                  {...reg("state")}
                  autoComplete="address-level1"
                  className="flex h-12 w-full cursor-pointer rounded-xl border border-input bg-card px-4 text-base aria-[invalid=true]:border-destructive"
                >
                  <option value="">Selecciona tu estado</option>
                  {MX_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field id="co-references" label="Referencias (opcional)" hint="Entre calles, color de fachada, etc." className="sm:col-span-6">
                <Textarea rows={2} className="rounded-xl bg-card text-base" placeholder="Ej. Entre calle Durango y Colima, portón negro" {...reg("references")} />
              </Field>
              <Field id="co-notes" label="Notas para tu pedido (opcional)" error={errors.notes?.message} className="sm:col-span-6">
                <Textarea rows={2} className="rounded-xl bg-card text-base" placeholder="Ej. Entregar por la tarde" {...reg("notes")} />
              </Field>
              <label className="flex cursor-pointer items-center gap-3 text-sm sm:col-span-6">
                <Checkbox
                  checked={watch("saveAddress")}
                  onCheckedChange={(c) => setValue("saveAddress", c === true)}
                  className="h-5 w-5"
                />
                Guardar esta dirección en mi cuenta
              </label>
            </fieldset>
          </section>

          {/* Step 3: shipping */}
          <section aria-labelledby="step-shipping">
            <div className="mb-5 flex items-center gap-4">
              <StepBadge n={3} />
              <h2 id="step-shipping" className="font-sans text-xl font-bold">Envío</h2>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border bg-card p-4 sm:p-5">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                {shipping === 0 ? "Envío sin costo" : `Envío a domicilio: ${formatPrice(shipping)}`}
                {config?.freeShippingFrom != null && shipping > 0 &&
                  ` · gratis en compras desde ${formatPrice(config.freeShippingFrom)}`}
                . Te avisamos por correo cuando tu pedido salga, con la paquetería y el número de guía.
              </p>
            </div>
          </section>

          {/* Step 4: payment */}
          <section aria-labelledby="step-payment">
            <div className="mb-5 flex items-center gap-4">
              <StepBadge n={4} />
              <h2 id="step-payment" className="font-sans text-xl font-bold">Pago</h2>
            </div>
            <div role="radiogroup" aria-labelledby="step-payment" className="space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <OptionCard
                  key={m.id}
                  selected={metodo === m.id}
                  disabled={!m.enabled}
                  onSelect={() => setPaymentId(m.id)}
                  icon={m.id === "mercadopago" ? CreditCard : MessageCircle}
                  title={m.label}
                  text={m.description}
                >
                  {!m.enabled && <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-muted-foreground sm:px-2.5 sm:text-xs">Pronto</span>}
                </OptionCard>
              ))}
            </div>
          </section>
        </div>

        {/* Desktop summary */}
        <aside className="lg:col-span-5">
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="hidden rounded-3xl border bg-card p-6 shadow-soft lg:block">
              <h2 className="mb-5 font-sans text-lg font-bold">Resumen del pedido</h2>
              {Summary}
            </div>
            <Button type="submit" size="xl" className="w-full" disabled={placing || configLoading}>
              {placing ? <Loader2 className="animate-spin" /> : <Lock />}
              {placing
                ? "Procesando pedido…"
                : metodo === "mercadopago"
                  ? `Pagar ${formatPrice(total)}`
                  : `Confirmar pedido · ${formatPrice(total)}`}
            </Button>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Tus datos solo se usan para procesar tu pedido.
            </p>
          </div>
        </aside>
      </form>
    </SiteLayout>
  );
}

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold",
        done ? "bg-success text-white" : "bg-primary text-primary-foreground",
      )}
      aria-hidden
    >
      {done ? <Check className="h-4 w-4" /> : n}
    </span>
  );
}

function OptionCard({
  selected,
  disabled,
  onSelect,
  icon: Icon,
  title,
  text,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-colors cursor-pointer sm:p-5",
        selected ? "border-primary bg-secondary/50" : "border-border hover:border-foreground/25",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-primary" : "border-input")}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
      <Icon className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </button>
  );
}
