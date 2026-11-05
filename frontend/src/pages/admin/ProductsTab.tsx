import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, ImagePlus, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field } from "@/components/forms/Field";
import { adminService, type ProductInput } from "@/services/admin";
import type { ApiProduct } from "@/data/products";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const ESTADOS: Record<ApiProduct["estado"], { label: string; tone: string }> = {
  publicado: { label: "Publicado", tone: "bg-emerald-100 text-emerald-900" },
  oculto: { label: "Oculto", tone: "bg-muted text-muted-foreground" },
  agotado: { label: "Agotado", tone: "bg-amber-100 text-amber-900" },
  proximamente: { label: "Próximamente", tone: "bg-sky-100 text-sky-900" },
};
const selectCls = "h-12 w-full cursor-pointer rounded-xl border border-input bg-card px-3 text-base";

const VACIO: ProductInput = {
  slug: "",
  linea: "SINERGIA",
  nombre: "",
  descripcion: "",
  mg: null,
  volumen: "",
  concentracion: "",
  cbd: "",
  cbg: "",
  precio: null,
  precio_anterior: null,
  estado: "oculto",
  destacado: false,
  orden: 0,
  ficha: [],
};

const slugDe = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const errorDe = (e: unknown, defecto: string) => (e instanceof ApiError ? e.message : defecto);

export function ProductsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-productos"], queryFn: adminService.products });
  const [editando, setEditando] = useState<ApiProduct | "nuevo" | null>(null);
  const [borrar, setBorrar] = useState<ApiProduct | null>(null);

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ["admin-productos"] });
    qc.invalidateQueries({ queryKey: ["productos"] }); // la tienda
  };

  const duplicar = async (p: ApiProduct) => {
    try {
      const copia = await adminService.duplicateProduct(p.id);
      refrescar();
      setEditando(copia);
      toast.success("Copia creada (oculta). Ajusta lo necesario y publícala.");
    } catch (e) {
      toast.error(errorDe(e, "No se pudo duplicar."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Lo publicado se ve en la tienda en el orden de esta lista. La primera foto es la principal.
          </p>
        </div>
        <Button onClick={() => setEditando("nuevo")}>
          <Plus /> Nuevo producto
        </Button>
      </div>

      {q.isLoading ? (
        <div className="grid h-48 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {q.data?.map((p) => (
            <li key={p.id} className="flex gap-4 rounded-3xl border bg-card p-4">
              <button
                type="button"
                onClick={() => setEditando(p)}
                className="relative grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary cursor-pointer"
                aria-label={`Editar ${p.nombre}`}
              >
                {p.fotos[0] ? (
                  <img src={p.fotos[0].url} alt="" className="absolute inset-0 h-full w-full object-contain p-1.5" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setEditando(p)} className="text-left font-semibold leading-tight hover:underline cursor-pointer">
                    {p.nombre}
                  </button>
                  {p.destacado && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-label="Destacado" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.linea} · #{p.orden}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", ESTADOS[p.estado].tone)}>
                    {ESTADOS[p.estado].label}
                  </span>
                  <span className="price text-sm font-bold">{p.precio === null ? "Sin precio" : formatPrice(p.precio)}</span>
                </div>
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => duplicar(p)} aria-label={`Duplicar ${p.nombre}`}>
                    <Copy /> Duplicar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setBorrar(p)} aria-label={`Eliminar ${p.nombre}`}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {editando && (
            <ProductForm
              key={editando === "nuevo" ? "nuevo" : editando.id}
              producto={editando === "nuevo" ? null : editando}
              siguienteOrden={(q.data?.length ?? 0) + 1}
              onSaved={(p) => {
                refrescar();
                setEditando(p);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!borrar} onOpenChange={(v) => !v && setBorrar(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>¿Eliminar «{borrar?.nombre}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Deja de verse en la tienda y no se puede deshacer. Las órdenes que ya lo incluyen no cambian. Si solo quieres
            esconderlo un tiempo, ponlo como «Oculto».
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!borrar) return;
                try {
                  await adminService.deleteProduct(borrar.id);
                  refrescar();
                  toast.success("Producto eliminado.");
                } catch (e) {
                  toast.error(errorDe(e, "No se pudo eliminar."));
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductForm({
  producto,
  siguienteOrden,
  onSaved,
}: {
  producto: ApiProduct | null;
  siguienteOrden: number;
  onSaved: (p: ApiProduct) => void;
}) {
  const [datos, setDatos] = useState<ProductInput>(() => {
    if (!producto) return { ...VACIO, orden: siguienteOrden };
    const { id: _id, fotos: _fotos, ...resto } = producto;
    return resto;
  });
  const [slugTocado, setSlugTocado] = useState(!!producto);
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setDatos((d) => ({ ...d, [k]: v }));
  const numero = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v))));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const limpio = { ...datos, ficha: datos.ficha.filter(([k, v]) => k.trim() && v.trim()) };
      const p = producto ? await adminService.updateProduct(producto.id, limpio) : await adminService.createProduct(limpio);
      toast.success(producto ? "Cambios guardados." : "Producto creado. Ahora súbele fotos.");
      onSaved(p);
    } catch (err) {
      toast.error(errorDe(err, "No se pudo guardar."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <SheetTitle className="font-display text-2xl">{producto ? producto.nombre : "Nuevo producto"}</SheetTitle>
        <SheetDescription>Los cambios se ven en la tienda al guardar.</SheetDescription>
      </div>

      {producto && <Fotos producto={producto} onChange={onSaved} />}

      <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-6">
        <Field id="p-nombre" label="Nombre" required className="sm:col-span-4">
          <Input
            id="p-nombre"
            value={datos.nombre}
            placeholder="Ej. SINERGIA 750 mg"
            onChange={(e) => {
              set("nombre", e.target.value);
              if (!slugTocado) set("slug", slugDe(e.target.value));
            }}
            required
          />
        </Field>
        <Field id="p-linea" label="Línea o marca" className="sm:col-span-2">
          <Input id="p-linea" value={datos.linea} placeholder="SINERGIA" onChange={(e) => set("linea", e.target.value)} />
        </Field>
        <Field id="p-slug" label="Dirección web" hint={`/producto/${datos.slug || "…"}`} className="sm:col-span-3">
          <Input
            id="p-slug"
            value={datos.slug}
            onChange={(e) => {
              setSlugTocado(true);
              set("slug", slugDe(e.target.value));
            }}
            required
          />
        </Field>
        <Field id="p-estado" label="Estado" className="sm:col-span-3">
          <select id="p-estado" className={selectCls} value={datos.estado} onChange={(e) => set("estado", e.target.value as ProductInput["estado"])}>
            {Object.entries(ESTADOS).map(([v, { label }]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="p-precio" label="Precio (MXN)" hint="Vacío = «Precio por WhatsApp»" className="sm:col-span-2">
          <Input id="p-precio" inputMode="numeric" value={datos.precio ?? ""} placeholder="Ej. 1590" onChange={(e) => set("precio", numero(e.target.value))} />
        </Field>
        <Field id="p-anterior" label="Precio anterior" hint="Para mostrar una oferta" className="sm:col-span-2">
          <Input id="p-anterior" inputMode="numeric" value={datos.precio_anterior ?? ""} placeholder="Opcional" onChange={(e) => set("precio_anterior", numero(e.target.value))} />
        </Field>
        <Field id="p-orden" label="Orden en la tienda" className="sm:col-span-2">
          <Input id="p-orden" inputMode="numeric" value={datos.orden} onChange={(e) => set("orden", numero(e.target.value) ?? 0)} />
        </Field>
        <Field id="p-mg" label="Contenido (mg)" className="sm:col-span-2">
          <Input id="p-mg" inputMode="numeric" value={datos.mg ?? ""} placeholder="Ej. 750" onChange={(e) => set("mg", numero(e.target.value))} />
        </Field>
        <Field id="p-vol" label="Volumen" className="sm:col-span-2">
          <Input id="p-vol" value={datos.volumen} placeholder="Ej. 30 ml" onChange={(e) => set("volumen", e.target.value)} />
        </Field>
        <Field id="p-conc" label="Concentración" className="sm:col-span-2">
          <Input id="p-conc" value={datos.concentracion} placeholder="Ej. 25 mg/ml" onChange={(e) => set("concentracion", e.target.value)} />
        </Field>
        <Field id="p-cbd" label="CBD" className="sm:col-span-3">
          <Input id="p-cbd" value={datos.cbd} placeholder="Ej. 25 mg/ml" onChange={(e) => set("cbd", e.target.value)} />
        </Field>
        <Field id="p-cbg" label="CBG" className="sm:col-span-3">
          <Input id="p-cbg" value={datos.cbg} placeholder="Ej. 0.5 mg/ml" onChange={(e) => set("cbg", e.target.value)} />
        </Field>
        <Field id="p-desc" label="Descripción" className="sm:col-span-6">
          <Textarea id="p-desc" rows={4} className="rounded-xl text-base" value={datos.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 text-sm sm:col-span-6">
          <input type="checkbox" className="h-5 w-5 accent-[hsl(var(--primary))]" checked={datos.destacado} onChange={(e) => set("destacado", e.target.checked)} />
          Destacado (aparece primero en la tarjeta de la portada)
        </label>

        <fieldset className="space-y-2 sm:col-span-6">
          <legend className="text-sm font-semibold">Ficha técnica</legend>
          {datos.ficha.map(([k, v], i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label="Dato" placeholder="Ej. Terpenos" value={k} onChange={(e) => set("ficha", datos.ficha.map((f, j) => (j === i ? [e.target.value, f[1]] : f)))} />
              <Input aria-label="Valor" placeholder="Ej. Linalol, mirceno, nerodiol" value={v} onChange={(e) => set("ficha", datos.ficha.map((f, j) => (j === i ? [f[0], e.target.value] : f)))} />
              <Button type="button" variant="ghost" size="icon" aria-label="Quitar fila" onClick={() => set("ficha", datos.ficha.filter((_, j) => j !== i))}>
                <X />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set("ficha", [...datos.ficha, ["", ""]])}>
            <Plus /> Agregar dato
          </Button>
        </fieldset>

        <Button type="submit" size="lg" className="sm:col-span-6" disabled={guardando}>
          {guardando && <Loader2 className="animate-spin" />} {producto ? "Guardar cambios" : "Crear producto"}
        </Button>
      </form>
    </div>
  );
}

function Fotos({ producto, onChange }: { producto: ApiProduct; onChange: (p: ApiProduct) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const ids = producto.fotos.map((f) => f.id);

  const subir = async (archivos: FileList | null) => {
    if (!archivos?.length) return;
    setSubiendo(true);
    try {
      let p = producto;
      for (const a of Array.from(archivos)) p = await adminService.uploadPhoto(producto.id, a);
      onChange(p);
    } catch (e) {
      toast.error(errorDe(e, "No se pudo subir la foto."));
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  };
  const mover = async (i: number, d: -1 | 1) => {
    const nuevo = [...ids];
    [nuevo[i], nuevo[i + d]] = [nuevo[i + d], nuevo[i]];
    onChange(await adminService.reorderPhotos(producto.id, nuevo));
  };

  return (
    <section className="space-y-3 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Fotos</p>
        <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={subiendo}>
          {subiendo ? <Loader2 className="animate-spin" /> : <ImagePlus />} Subir fotos
        </Button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => subir(e.target.files)} />
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG o WebP de hasta 5 MB. La primera es la principal: para frascos, mejor con fondo transparente.</p>
      {producto.fotos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Aún no tiene fotos.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {producto.fotos.map((f, i) => (
            <li key={f.id} className="relative rounded-xl border bg-secondary/40 p-1">
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Principal</span>}
              <img src={f.url} alt="" className="aspect-square w-full object-contain" />
              <div className="mt-1 flex justify-center gap-0.5">
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Mover antes">
                  <ArrowUp />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={i === ids.length - 1} onClick={() => mover(i, 1)} aria-label="Mover después">
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={async () => onChange(await adminService.deletePhoto(producto.id, f.id))}
                  aria-label="Quitar foto"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
