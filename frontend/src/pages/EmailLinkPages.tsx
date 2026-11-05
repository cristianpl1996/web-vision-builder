/**
 * Las páginas a las que llevan los enlaces de los correos: confirmar el correo,
 * pedir y crear una contraseña nueva.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth";
import { ApiError } from "@/lib/api";

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <SiteLayout minimal hideFab>
      <div className="container grid min-h-[60vh] place-items-center py-12">
        <div className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-soft sm:p-9">{children}</div>
      </div>
    </SiteLayout>
  );
}

const mensaje = (e: unknown, defecto: string) => (e instanceof ApiError ? e.message : defecto);

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { setUser, user } = useAuth();
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");
  const [error, setError] = useState("");
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current) return; // StrictMode monta dos veces en desarrollo
    enviado.current = true;
    authService
      .verifyEmail(params.get("token") ?? "")
      .then((u) => {
        if (user && user.id === u.id) setUser(u);
        setEstado("ok");
      })
      .catch((e) => {
        setError(mensaje(e, "No pudimos confirmar tu correo."));
        setEstado("error");
      });
  }, [params, setUser, user]);

  return (
    <Tarjeta>
      {estado === "cargando" && <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />}
      {estado === "ok" && (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h1 className="mt-4 font-display text-3xl">¡Correo confirmado!</h1>
          <p className="mt-2 text-muted-foreground">Te avisaremos por correo de cada paso de tus pedidos.</p>
          <Button asChild className="mt-6">
            <Link to="/">Ir a la tienda</Link>
          </Button>
        </div>
      )}
      {estado === "error" && (
        <div className="text-center">
          <XCircle className="mx-auto h-14 w-14 text-destructive" />
          <h1 className="mt-4 font-display text-3xl">El enlace no funcionó</h1>
          <p className="mt-2 text-muted-foreground">{error} Puedes pedir uno nuevo desde tu cuenta.</p>
          <Button asChild className="mt-6">
            <Link to="/cuenta">Ir a mi cuenta</Link>
          </Button>
        </div>
      )}
    </Tarjeta>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await authService.forgotPassword(email.trim());
      setListo(true);
    } catch (err) {
      toast.error(mensaje(err, "No pudimos enviar el correo. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta>
      {listo ? (
        <div className="text-center">
          <MailCheck className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-4 font-display text-3xl">Revisa tu correo</h1>
          <p className="mt-2 text-muted-foreground">
            Si <strong>{email}</strong> tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Vence en
            1 hora.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/ingresar">Volver a iniciar sesión</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-5">
          <div>
            <h1 className="font-display text-3xl">¿Olvidaste tu contraseña?</h1>
            <p className="mt-2 text-muted-foreground">Escribe tu correo y te enviamos un enlace para crear una nueva.</p>
          </div>
          <Field id="rec-email" label="Correo electrónico">
            <Input
              id="rec-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" size="xl" className="w-full" disabled={enviando || !email}>
            {enviando && <Loader2 className="animate-spin" />} Enviar enlace
          </Button>
          <p className="text-center text-sm">
            <Link to="/ingresar" className="font-semibold text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </Tarjeta>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const noCoinciden = confirm.length > 0 && confirm !== password;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noCoinciden) return;
    setGuardando(true);
    try {
      setUser(await authService.resetPassword(params.get("token") ?? "", password));
      toast.success("Listo: tu contraseña nueva ya funciona.");
      navigate("/cuenta", { replace: true });
    } catch (err) {
      toast.error(mensaje(err, "No pudimos cambiar la contraseña."));
      setGuardando(false);
    }
  };

  return (
    <Tarjeta>
      <form onSubmit={guardar} className="space-y-5">
        <div>
          <h1 className="font-display text-3xl">Crea una contraseña nueva</h1>
          <p className="mt-2 text-muted-foreground">Al guardarla, cerraremos tus sesiones en otros dispositivos.</p>
        </div>
        <Field id="rp-password" label="Contraseña nueva" hint="Mínimo 8 caracteres, con letras y números.">
          <PasswordInput
            id="rp-password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field id="rp-confirm" label="Confirma tu contraseña" error={noCoinciden ? "Las contraseñas no coinciden" : undefined}>
          <PasswordInput
            id="rp-confirm"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={noCoinciden}
            required
          />
        </Field>
        <Button type="submit" size="xl" className="w-full" disabled={guardando || !password || noCoinciden}>
          {guardando && <Loader2 className="animate-spin" />} Guardar contraseña
        </Button>
      </form>
    </Tarjeta>
  );
}
