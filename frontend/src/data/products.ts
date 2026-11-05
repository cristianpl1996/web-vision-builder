/**
 * El catálogo vive en la API (Admin › Productos). Aquí solo:
 *  - los datos fijos de la tienda (WhatsApp, Instagram, moneda);
 *  - la forma `Product` que usan las pantallas y cómo se arma desde la API.
 */

export const STORE = {
  currency: "MXN",
  locale: "es-MX",
  whatsapp: "525548993902",
  whatsappDisplay: "(+52) 55 4899 39 02",
  instagram: "marczuk.mario",
} as const;

/** Lo que devuelve `/v1/productos` (ver backend/app/schemas.py · ProductoOut). */
export interface ApiProduct {
  id: number;
  slug: string;
  linea: string;
  nombre: string;
  descripcion: string;
  mg: number | null;
  volumen: string;
  concentracion: string;
  cbd: string;
  cbg: string;
  precio: number | null;
  precio_anterior: number | null;
  estado: "publicado" | "oculto" | "agotado" | "proximamente";
  destacado: boolean;
  orden: number;
  ficha: [string, string][];
  fotos: { id: number; url: string }[];
}

export interface Product {
  id: string;
  slug: string;
  line: string;
  name: string;
  description: string;
  totalMg: number;
  concentration: string;
  cbd: string;
  cbg: string;
  volume: string;
  /** MXN. `null` = «Precio por WhatsApp». */
  price: number | null;
  compareAtPrice?: number;
  /** Primera foto: el frasco recortado (se dibuja en escalera por mg). */
  bottle: string;
  /** Segunda foto si existe (foto completa); si no, la misma. */
  image: string;
  /** Altura relativa del frasco en pantalla: crece con los mg dentro de su línea. */
  bottleScale: number;
  featured: boolean;
  soldOut: boolean;
  specs: [string, string][];
}

/** Presentación anunciada que todavía no se vende (estado «próximamente»). */
export interface UpcomingSlot {
  id: string;
  comingSoon: true;
  name: string;
}

export type ShopItem = Product | UpcomingSlot;
export const isUpcoming = (item: ShopItem): item is UpcomingSlot => "comingSoon" in item;

const SIN_FOTO = "/placeholder.svg";

export function toShopItems(api: ApiProduct[]): ShopItem[] {
  // Escalera de frascos: dentro de cada línea, el de menos mg mide 0.6 y el de más, 1.
  const mgPorLinea = new Map<string, number[]>();
  for (const p of api) {
    if (p.mg && p.estado !== "proximamente") {
      mgPorLinea.set(p.linea, [...(mgPorLinea.get(p.linea) ?? []), p.mg]);
    }
  }
  const escala = (p: ApiProduct) => {
    const mgs = [...new Set(mgPorLinea.get(p.linea) ?? [])].sort((a, b) => a - b);
    if (!p.mg || mgs.length < 2) return 1;
    return 0.6 + (0.4 * mgs.indexOf(p.mg)) / (mgs.length - 1);
  };

  return api.map((p): ShopItem => {
    if (p.estado === "proximamente") return { id: String(p.id), comingSoon: true, name: p.nombre };
    const bottle = p.fotos[0]?.url ?? SIN_FOTO;
    return {
      id: String(p.id),
      slug: p.slug,
      line: p.linea,
      name: p.nombre,
      description: p.descripcion,
      totalMg: p.mg ?? 0,
      concentration: p.concentracion,
      cbd: p.cbd,
      cbg: p.cbg,
      volume: p.volumen,
      price: p.precio,
      compareAtPrice: p.precio_anterior ?? undefined,
      bottle,
      image: p.fotos[1]?.url ?? bottle,
      bottleScale: escala(p),
      featured: p.destacado,
      soldOut: p.estado === "agotado",
      specs: p.ficha,
    };
  });
}
