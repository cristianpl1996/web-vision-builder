import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, ShoppingBag, ShieldCheck, Package, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/forms/Field";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { PRICES_READY } from "@/data/products";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresa tu correo").email("Ingresa un correo válido, por ejemplo nombre@correo.com"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Ingresa tu nombre"),
    lastName: z.string().trim().min(2, "Ingresa tus apellidos"),
    email: z.string().trim().min(1, "Ingresa tu correo").email("Ingresa un correo válido, por ejemplo nombre@correo.com"),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Ingresa 10 dígitos, sin espacios ni lada internacional"),
    password: z
      .string()
      .min(8, "Usa al menos 8 caracteres")
      .regex(/[A-Za-z]/, "Incluye al menos una letra")
      .regex(/\d/, "Incluye al menos un número"),
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "Debes aceptar los términos y el aviso de privacidad" }) }),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [params, setParams] = useSearchParams();
  const redirect = params.get("redirect") || "/cuenta";
  const fromCheckout = params.get("reason") === "checkout" || redirect === "/checkout";
  const [mode, setMode] = useState<"login" | "register">(params.get("modo") === "registro" ? "register" : "login");
  const { user, loading } = useAuth();
  const { count, subtotal } = useCart();

  useEffect(() => {
    document.title = (mode === "login" ? "Iniciar sesión" : "Crear cuenta") + " · SINERGIA";
  }, [mode]);

  if (!loading && user) return <Navigate to={redirect} replace />;

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    const next = new URLSearchParams(params);
    if (m === "register") next.set("modo", "registro");
    else next.delete("modo");
    setParams(next, { replace: true });
  };

  return (
    <SiteLayout minimal hideFab>
      <div className="container grid gap-10 py-8 md:py-14 lg:grid-cols-12 lg:gap-16">
        <div className="mx-auto w-full max-w-md lg:col-span-6 lg:col-start-2">
          {fromCheckout && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/20 bg-secondary p-4 text-sm">
              <Lock className="h-5 w-5 shrink-0 text-primary" />
              <p>
                <strong>Casi listo.</strong> Inicia sesión o crea tu cuenta para finalizar tu compra
                {count > 0 && (
                  <>
                    {" "}de <strong className="price">{count} {count === 1 ? "producto" : "productos"}{PRICES_READY ? ` · ${formatPrice(subtotal)}` : ""}</strong>
                  </>
                )}
                .
              </p>
            </div>
          )}

          <h1 className="font-display text-4xl font-medium">{mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "login" ? "Ingresa con tu correo y contraseña." : "Solo te tomará un minuto."}
          </p>

          <div role="tablist" aria-label="Tipo de acceso" className="mt-6 grid grid-cols-2 rounded-full border bg-card p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={cn(
                  "h-11 rounded-full text-sm font-semibold transition-colors cursor-pointer",
                  mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "login" ? "Iniciar sesión" : "Registrarme"}
              </button>
            ))}
          </div>

          <div className="mt-8">{mode === "login" ? <LoginForm redirect={redirect} onSwitch={() => switchMode("register")} /> : <RegisterForm redirect={redirect} onSwitch={() => switchMode("login")} />}</div>
        </div>

        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-24 rounded-3xl bg-primary-dark p-8 text-primary-foreground">
            <p className="font-display text-2xl">Beneficios de tu cuenta</p>
            <ul className="mt-6 space-y-5">
              {[
                { icon: Package, title: "Sigue tus pedidos", text: "Consulta el estado y el historial de tus compras." },
                { icon: MapPin, title: "Direcciones guardadas", text: "Compra más rápido la próxima vez." },
                { icon: ShieldCheck, title: "Todo en un lugar", text: "Tus datos y pedidos en tu cuenta." },
                { icon: ShoppingBag, title: "Recompra en un clic", text: "Repite tu pedido cuando se termine el frasco." },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="text-sm text-white/70">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}

function LoginForm({ redirect, onSwitch }: { redirect: string; onSwitch: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: "onTouched" });

  const onSubmit = async (v: LoginValues) => {
    setServerError(null);
    try {
      const u = await login(v.email, v.password);
      toast.success(`¡Hola de nuevo, ${u.firstName}!`);
      navigate(redirect, { replace: true });
    } catch (e) {
      setServerError((e as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <Field id="login-email" label="Correo electrónico" error={errors.email?.message}>
        <Input id="login-email" type="email" placeholder="nombre@correo.com" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} aria-describedby="login-email-msg" {...register("email")} />
      </Field>
      <Field id="login-password" label="Contraseña" error={errors.password?.message}>
        <PasswordInput id="login-password" placeholder="Escribe tu contraseña" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby="login-password-msg" {...register("password")} />
      </Field>
      <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Lock />}
        {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:underline cursor-pointer">
          Crea tu cuenta
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ redirect, onSwitch }: { redirect: string; onSwitch: () => void }) {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), mode: "onTouched" });

  const onSubmit = async (v: RegisterValues) => {
    setServerError(null);
    try {
      const u = await registerUser({ firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone, password: v.password });
      toast.success(`¡Bienvenido, ${u.firstName}! Tu cuenta fue creada.`);
      navigate(redirect, { replace: true });
    } catch (e) {
      setServerError((e as Error).message);
    }
  };

  const field = (name: keyof RegisterValues) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": `reg-${name}-msg`,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="reg-firstName" label="Nombre" required error={errors.firstName?.message}>
          <Input id="reg-firstName" placeholder="Ej. María" autoComplete="given-name" {...field("firstName")} {...register("firstName")} />
        </Field>
        <Field id="reg-lastName" label="Apellidos" required error={errors.lastName?.message}>
          <Input id="reg-lastName" placeholder="Ej. González López" autoComplete="family-name" {...field("lastName")} {...register("lastName")} />
        </Field>
      </div>
      <Field id="reg-email" label="Correo electrónico" required error={errors.email?.message}>
        <Input id="reg-email" type="email" placeholder="nombre@correo.com" inputMode="email" autoComplete="email" {...field("email")} {...register("email")} />
      </Field>
      <Field id="reg-phone" label="Celular" required error={errors.phone?.message} hint="10 dígitos. Te avisaremos del estado de tu pedido.">
        <Input id="reg-phone" type="tel" placeholder="Ej. 5512345678" inputMode="numeric" autoComplete="tel-national" maxLength={10} {...field("phone")} {...register("phone")} />
      </Field>
      <Field id="reg-password" label="Contraseña" required error={errors.password?.message} hint="Mínimo 8 caracteres, con letras y números.">
        <PasswordInput id="reg-password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field("password")} {...register("password")} />
      </Field>
      <Field id="reg-confirm" label="Confirma tu contraseña" required error={errors.confirm?.message}>
        <PasswordInput id="reg-confirm" placeholder="Repite tu contraseña" autoComplete="new-password" {...field("confirm")} {...register("confirm")} />
      </Field>
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <Checkbox
            checked={watch("terms") === true}
            onCheckedChange={(c) => setValue("terms", (c === true) as true, { shouldValidate: true })}
            aria-invalid={!!errors.terms}
            aria-describedby="reg-terms-msg"
            className="mt-0.5 h-5 w-5"
          />
          <span className="leading-relaxed text-muted-foreground">
            Acepto los <Link to="#" className="font-semibold text-primary hover:underline">términos y condiciones</Link> y el{" "}
            <Link to="#" className="font-semibold text-primary hover:underline">aviso de privacidad</Link>.
          </span>
        </label>
        {errors.terms && (
          <p id="reg-terms-msg" role="alert" className="mt-1.5 text-sm text-destructive">
            {errors.terms.message}
          </p>
        )}
      </div>
      <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta y continuar"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:underline cursor-pointer">
          Inicia sesión
        </button>
      </p>
    </form>
  );
}
