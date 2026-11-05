import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, LayoutDashboard, Loader2, LogOut, MailWarning, MapPin, Package, RotateCcw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/forms/Field";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { StatusBadge } from "@/components/orders/OrderBits";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { authService } from "@/services/auth";
import { orderService, type Order } from "@/services/orders";
import { ApiError } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

export default function AccountPage() {
  const { user, logout, isAdmin } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useQuery({ queryKey: ["mis-ordenes"], queryFn: orderService.listMine });

  useEffect(() => {
    document.title = "Mi cuenta · SINERGIA";
  }, []);

  if (!user) return null;

  const reorder = (o: Order) => {
    const vigentes = o.items.filter((i) => i.productId !== null);
    vigentes.forEach((i, idx) =>
      add(String(i.productId), i.quantity, { openDrawer: idx === vigentes.length - 1 }),
    );
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
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button asChild>
                <Link to="/admin">
                  <LayoutDashboard /> Panel de administración
                </Link>
              </Button>
            )}
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
        </div>

        {!user.emailVerified && <VerifyBanner />}

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <section className="lg:col-span-8" aria-labelledby="orders-title">
            <h2 id="orders-title" className="flex items-center gap-2 font-sans text-xl font-bold">
              <Package className="h-5 w-5 text-primary" /> Mis pedidos
            </h2>
            <div className="mt-5 space-y-4">
              {isLoading || !orders ? (
                [0, 1].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)
              ) : orders.length === 0 ? (
                <div className="rounded-3xl border border-dashed bg-card p-10 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-primary" />
                  <p className="mt-3 font-display text-2xl">Aún no tienes pedidos</p>
                  <p className="mt-1 text-sm text-muted-foreground">Cuando compres, aquí verás el estado de tus pedidos.</p>
                  <Button asChild className="mt-5">
                    <Link to="/#productos">Ir a la tienda</Link>
                  </Button>
                </div>
              ) : (
                orders.map((o) => (
                  <article key={o.id} className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link to={`/pedido/${o.id}`} className="font-semibold hover:underline">
                          Pedido {o.number}
                        </Link>
                        <p className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      {o.items.map((i, idx) =>
                        i.image ? (
                          <img key={idx} src={i.image} alt={i.name} width={48} height={48} className="h-12 w-12 rounded-xl border bg-white object-contain p-1" />
                        ) : null,
                      )}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {o.items.reduce((n, i) => n + i.quantity, 0)} artículos
                      </span>
                    </div>
                    {o.status === "enviada" && o.tracking && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {o.carrier} · guía <strong className="text-foreground">{o.tracking}</strong>
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                      <span className="price text-lg font-bold">{formatPrice(o.total)}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/pedido/${o.id}`}>Ver detalle</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reorder(o)}>
                          <RotateCcw /> Volver a comprar
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <aside className="space-y-10 lg:col-span-4">
            <section aria-labelledby="addresses-title">
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
                        {a.street} {a.extNumber}, {a.neighborhood}
                        <br />
                        {a.city}, {a.state}, C.P. {a.postalCode}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
            <ChangePassword />
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function VerifyBanner() {
  const [sending, setSending] = useState(false);
  const reenviar = async () => {
    setSending(true);
    try {
      await authService.resendVerification();
      toast.success("Te enviamos un nuevo correo de confirmación.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No pudimos enviar el correo.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-5 text-amber-950 sm:flex-row sm:items-center">
      <MailWarning className="h-6 w-6 shrink-0" />
      <p className="flex-1 text-sm">
        <strong>Confirma tu correo</strong> para recibir los avisos de tus pedidos. Revisa tu bandeja de entrada (y la de spam).
      </p>
      <Button size="sm" variant="outline" onClick={reenviar} disabled={sending}>
        {sending && <Loader2 className="animate-spin" />} Reenviar correo
      </Button>
    </div>
  );
}

function ChangePassword() {
  const { setUser } = useAuth();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [saving, setSaving] = useState(false);
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setUser(await authService.changePassword(actual, nueva));
      setActual("");
      setNueva("");
      toast.success("Contraseña actualizada. Cerramos tus sesiones en otros dispositivos.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section aria-labelledby="password-title">
      <h2 id="password-title" className="flex items-center gap-2 font-sans text-xl font-bold">
        <KeyRound className="h-5 w-5 text-primary" /> Contraseña
      </h2>
      <form onSubmit={guardar} className="mt-5 space-y-4 rounded-3xl border bg-card p-5">
        <Field id="pw-actual" label="Contraseña actual">
          <PasswordInput id="pw-actual" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
        </Field>
        <Field id="pw-nueva" label="Contraseña nueva" hint="Mínimo 8 caracteres, con letras y números.">
          <PasswordInput id="pw-nueva" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
        </Field>
        <Button type="submit" variant="outline" className="w-full" disabled={saving || !actual || !nueva}>
          {saving && <Loader2 className="animate-spin" />} Cambiar contraseña
        </Button>
      </form>
    </section>
  );
}
