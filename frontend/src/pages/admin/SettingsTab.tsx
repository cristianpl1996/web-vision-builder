import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, CreditCard, DollarSign, Landmark, Loader2, Mail, Send, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/forms/Field";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { adminService, type Settings } from "@/services/admin";
import { ApiError } from "@/lib/api";
import { convertirPesos, formatMoney, formatPrice } from "@/lib/format";

/** Campos secretos: el servidor solo dice si están configurados; aquí se escriben, nunca se leen. */
const SECRETOS = ["mp_access_token", "mp_webhook_secret", "smtp_password"] as const;
type Secreto = (typeof SECRETOS)[number];

export function SettingsTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["admin-ajustes"], queryFn: adminService.settings });
  const [form, setForm] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);

  useEffect(() => {
    if (!q.data) return;
    const valores: Record<string, string> = {};
    for (const [k, v] of Object.entries(q.data)) valores[k] = typeof v === "string" ? v : "";
    setForm(valores);
  }, [q.data]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const configurado = (k: Secreto) => (q.data as Settings | undefined)?.[k] === true;
  const webhook = `${window.location.origin}/v1/pagos/webhook/mercadopago`;
  const encendida = (k: "pago_mercadopago" | "pago_transferencia") => form[k] === "1";
  const mpListo = configurado("mp_access_token") || !!form.mp_access_token;
  // Ejemplo con la misma regla del servidor: dólares enteros, redondeados hacia arriba.
  const tc = Number((form.tipo_cambio_usd ?? "").replace(",", "."));
  const ejemploUsd = tc >= 1 && tc <= 1000 ? convertirPesos(1590, tc) : null;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await adminService.saveSettings(form);
      // Los secretos se vacían en el formulario: ya quedaron guardados (cifrados).
      setForm((f) => ({ ...f, ...Object.fromEntries(SECRETOS.map((k) => [k, ""])) }));
      qc.invalidateQueries({ queryKey: ["admin-ajustes"] });
      qc.invalidateQueries({ queryKey: ["tienda"] });
      toast.success("Ajustes guardados.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudieron guardar los ajustes.");
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (k: Secreto) => {
    await adminService.saveSettings({ [k]: "__borrar__" });
    qc.invalidateQueries({ queryKey: ["admin-ajustes"] });
    qc.invalidateQueries({ queryKey: ["tienda"] });
    toast.success("Credencial eliminada.");
  };

  const probar = async () => {
    if (!user) return;
    setProbando(true);
    try {
      const r = await adminService.testEmail(user.email);
      if (r.ok) toast.success(`${r.message} Revisa ${user.email}.`);
      else toast.error(r.message);
    } finally {
      setProbando(false);
    }
  };

  if (q.isLoading) {
    return (
      <div className="grid h-48 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Función y no componente: un componente declarado aquí adentro se re-montaría en cada tecla y el input perdería el foco.
  const secretoInput = ({ k, label, hint, placeholder }: { k: Secreto; label: string; hint?: string; placeholder: string }) => (
    <Field id={`a-${k}`} label={label} hint={hint}>
      <div className="flex gap-2">
        <div className="flex-1">
          <PasswordInput
            id={`a-${k}`}
            autoComplete="off"
            placeholder={configurado(k) ? "•••••••• (guardado; escribe para reemplazar)" : placeholder}
            value={form[k] ?? ""}
            onChange={(e) => set(k, e.target.value)}
          />
        </div>
        {configurado(k) && (
          <Button type="button" variant="ghost" className="text-destructive" onClick={() => borrar(k)}>
            Quitar
          </Button>
        )}
      </div>
    </Field>
  );

  return (
    <form onSubmit={guardar} className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Las credenciales se guardan cifradas y nunca se vuelven a mostrar: solo se ve si están configuradas.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border bg-card p-6">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
          <Wallet className="h-5 w-5 text-primary" /> Formas de pago
        </h2>
        <p className="text-sm text-muted-foreground">
          Enciende las que quieras ofrecer; el checkout y la página del pedido muestran solo esas. Siempre debe quedar al
          menos una.
        </p>
        <label htmlFor="a-pago_mercadopago" className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary p-4 text-sm">
          <Checkbox
            id="a-pago_mercadopago"
            className="mt-0.5"
            checked={encendida("pago_mercadopago")}
            onCheckedChange={(v) => set("pago_mercadopago", v === true ? "1" : "")}
          />
          <span>
            <span className="flex items-center gap-1.5 font-semibold">
              <CreditCard className="h-4 w-4 text-primary" /> Pago en línea con Mercado Pago (pasarela)
            </span>
            <span className="mt-1 block text-muted-foreground">
              {mpListo
                ? "Tarjeta, OXXO o SPEI. El pago se confirma solo y la orden pasa a «Pagado»."
                : "Necesita las credenciales de abajo. Mientras no estén, no se muestra en la tienda."}
            </span>
          </span>
        </label>
        <label htmlFor="a-pago_transferencia" className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary p-4 text-sm">
          <Checkbox
            id="a-pago_transferencia"
            className="mt-0.5"
            checked={encendida("pago_transferencia")}
            onCheckedChange={(v) => set("pago_transferencia", v === true ? "1" : "")}
          />
          <span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Landmark className="h-4 w-4 text-primary" /> Transferencia o depósito con comprobante
            </span>
            <span className="mt-1 block text-muted-foreground">
              El cliente ve los datos de abajo, paga y sube su comprobante en su pedido. Te llega un correo y tú la marcas
              «Pagado» al revisarlo.
            </span>
          </span>
        </label>
        <Field
          id="a-transferencia_datos"
          label="Datos para transferencia o depósito"
          hint="Lo que verá el cliente. Si lo dejas vacío, le pedimos que te escriba por WhatsApp para dárselos."
        >
          <Textarea
            id="a-transferencia_datos"
            rows={4}
            className="rounded-xl"
            value={form.transferencia_datos ?? ""}
            placeholder={"Banco: …\nTitular: …\nCLABE: …"}
            onChange={(e) => set("transferencia_datos", e.target.value)}
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-6">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
          <CreditCard className="h-5 w-5 text-primary" /> Mercado Pago
          {configurado("mp_access_token") && !encendida("pago_mercadopago") ? (
            <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Apagado</span>
          ) : configurado("mp_access_token") ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="h-3.5 w-3.5" /> Activo
            </span>
          ) : (
            <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Sin configurar</span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          En Mercado Pago › Tu negocio › Configuración › Credenciales. Usa las de <strong>prueba</strong> (empiezan con
          «TEST-») para probar y las de <strong>producción</strong> («APP_USR-») para cobrar de verdad.
        </p>
        {secretoInput({ k: "mp_access_token", label: "Access Token", placeholder: "APP_USR-… o TEST-…" })}
        <Field id="a-mp_public_key" label="Public Key">
          <Input id="a-mp_public_key" value={form.mp_public_key ?? ""} placeholder="APP_USR-… o TEST-…" onChange={(e) => set("mp_public_key", e.target.value)} />
        </Field>
        <div className="rounded-2xl bg-secondary p-4 text-sm">
          <p className="font-semibold">Notificaciones (webhook)</p>
          <p className="mt-1 text-muted-foreground">
            En Mercado Pago › Webhooks, configura esta URL para el evento «Pagos» y pega aquí la clave secreta que te da.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-card px-3 py-2 text-xs">{webhook}</code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard?.writeText(webhook).then(() => toast.success("URL copiada."))}
            >
              <Copy /> Copiar
            </Button>
          </div>
        </div>
        {secretoInput({ k: "mp_webhook_secret", label: "Clave secreta del webhook", hint: "Con ella se verifica que cada aviso venga de Mercado Pago.", placeholder: "Pega la clave secreta" })}
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-6">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
          <Truck className="h-5 w-5 text-primary" /> Envío
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="a-envio_costo" label="Costo de envío (MXN)" hint="0 = sin costo">
            <Input id="a-envio_costo" inputMode="numeric" value={form.envio_costo ?? ""} placeholder="Ej. 149" onChange={(e) => set("envio_costo", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field id="a-envio_gratis_desde" label="Envío gratis desde (MXN)" hint="Vacío = nunca gratis">
            <Input id="a-envio_gratis_desde" inputMode="numeric" value={form.envio_gratis_desde ?? ""} placeholder="Ej. 1500" onChange={(e) => set("envio_gratis_desde", e.target.value.replace(/\D/g, ""))} />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-6">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
          <DollarSign className="h-5 w-5 text-primary" /> Monedas
          {ejemploUsd !== null ? (
            <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">MXN y USD</span>
          ) : (
            <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Solo MXN</span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          Los precios se capturan en pesos. Con un tipo de cambio, el cliente puede elegir ver y pagar en dólares: cada
          precio se convierte y se redondea al dólar de arriba. Cada pedido guarda la moneda y el tipo de cambio con que se hizo.
        </p>
        <Field
          id="a-tipo_cambio_usd"
          label="Tipo de cambio (pesos por dólar)"
          hint={ejemploUsd !== null ? `Ej.: un producto de ${formatPrice(1590)} se verá en ${formatMoney(ejemploUsd, "USD")}.` : "Vacío = la tienda solo vende en pesos."}
        >
          <Input id="a-tipo_cambio_usd" inputMode="decimal" value={form.tipo_cambio_usd ?? ""} placeholder="Ej. 18.50" onChange={(e) => set("tipo_cambio_usd", e.target.value.replace(/[^\d.,]/g, ""))} />
        </Field>
        <label htmlFor="a-mp_usd" className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary p-4 text-sm">
          <Checkbox id="a-mp_usd" className="mt-0.5" checked={form.mp_usd === "1"} onCheckedChange={(v) => set("mp_usd", v === true ? "1" : "")} />
          <span>
            <span className="font-semibold">Mi cuenta de Mercado Pago acepta cobros en dólares</span>
            <span className="mt-1 block text-muted-foreground">
              Las cuentas de México cobran en pesos. Actívalo solo si Mercado Pago te habilitó dólares y lo comprobaste con
              una compra de prueba. Si no, los pedidos en dólares se pagan por transferencia.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-6">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
          <Mail className="h-5 w-5 text-primary" /> Correo
        </h2>
        <Field id="a-correo_avisos" label="Correo de avisos" hint="Aquí llega cada orden nueva y cada pago.">
          <Input id="a-correo_avisos" type="email" value={form.correo_avisos ?? ""} placeholder="pedidos@botican.mx" onChange={(e) => set("correo_avisos", e.target.value)} />
        </Field>
        <p className="text-sm text-muted-foreground">
          Servidor SMTP para enviar los correos (Google Workspace, Microsoft 365, SendGrid, Brevo…). Si lo dejas vacío se usa el del servidor.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="a-smtp_host" label="Servidor" className="sm:col-span-2">
            <Input id="a-smtp_host" value={form.smtp_host ?? ""} placeholder="smtp.gmail.com" onChange={(e) => set("smtp_host", e.target.value)} />
          </Field>
          <Field id="a-smtp_port" label="Puerto">
            <Input id="a-smtp_port" inputMode="numeric" value={form.smtp_port ?? ""} placeholder="587" onChange={(e) => set("smtp_port", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field id="a-smtp_usuario" label="Usuario" className="sm:col-span-3">
            <Input id="a-smtp_usuario" value={form.smtp_usuario ?? ""} placeholder="pedidos@botican.mx" autoComplete="off" onChange={(e) => set("smtp_usuario", e.target.value)} />
          </Field>
        </div>
        {secretoInput({ k: "smtp_password", label: "Contraseña SMTP", hint: "En Gmail/Google Workspace: una «contraseña de aplicación».", placeholder: "Contraseña o clave de aplicación" })}
        <Field id="a-smtp_remitente" label="Remitente" hint="Así aparece en la bandeja del cliente.">
          <Input id="a-smtp_remitente" value={form.smtp_remitente ?? ""} placeholder="SINERGIA <pedidos@botican.mx>" onChange={(e) => set("smtp_remitente", e.target.value)} />
        </Field>
        <Button type="button" variant="outline" onClick={probar} disabled={probando}>
          {probando ? <Loader2 className="animate-spin" /> : <Send />} Enviarme un correo de prueba
        </Button>
        <p className="text-xs text-muted-foreground">La prueba usa la configuración ya guardada: guarda primero si cambiaste algo.</p>
      </section>

      <div className="sticky bottom-4 z-10">
        <Button type="submit" size="xl" className="w-full shadow-medium" disabled={guardando}>
          {guardando && <Loader2 className="animate-spin" />} Guardar ajustes
        </Button>
      </div>
    </form>
  );
}
