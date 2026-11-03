import img250 from "@/assets/sinergia-250.webp";
import img500 from "@/assets/sinergia-500.webp";
import img750 from "@/assets/sinergia-750.webp";
import img1000 from "@/assets/sinergia-1000.webp";
import img1500 from "@/assets/sinergia-1500.webp";
import bottle250 from "@/assets/bottle-250.webp";
import bottle500 from "@/assets/bottle-500.webp";
import bottle750 from "@/assets/bottle-750.webp";
import bottle1000 from "@/assets/bottle-1000.webp";
import bottle1500 from "@/assets/bottle-1500.webp";

/**
 * ─────────────────────────────────────────────────────────────
 *  STORE CONFIG
 *  The original landing published no prices or shipping terms, so none are
 *  shown. Set each product's `price` (MXN) once BOTICAN confirms them and the
 *  store shows prices, subtotals and totals automatically.
 * ─────────────────────────────────────────────────────────────
 */
export const STORE = {
  currency: "MXN",
  locale: "es-MX",
  whatsapp: "525548993902",
  whatsappDisplay: "(+52) 55 4899 39 02",
  instagram: "marczuk.mario",
} as const;

export interface Product {
  id: string;
  slug: string;
  name: string;
  totalMg: number;
  concentration: string;
  cbd: string;
  cbg: string;
  volume: string;
  /** MXN. `null` until BOTICAN confirms the price. */
  price: number | null;
  compareAtPrice?: number;
  image: string;
  /** Tightly cropped bottle (transparent) */
  bottle: string;
  /** Relative on-screen bottle height (grows with the mg of the presentation) */
  bottleScale: number;
  /** Shown in the hero card. Not a sales claim. */
  featured?: boolean;
  tier: "standard" | "high";
}

/** On-screen bottle height grows with the presentation: 250 < 500 < 750 < 1000 < 1500 mg. */
const BOTTLE_SCALE: Record<number, number> = { 250: 0.6, 500: 0.7, 750: 0.8, 1000: 0.9, 1500: 1 };

/** Product data taken from the bottle labels (250–750: 25 mg/ml · 1000–1500: 50 mg/ml). */
export const PRODUCTS: Product[] = [
  { id: "sinergia-250", slug: "sinergia-250", name: "SINERGIA 250 mg", totalMg: 250, concentration: "25 mg/ml", cbd: "25 mg/ml", cbg: "0.5 mg/ml", volume: "10 ml", price: null, image: img250, bottle: bottle250, bottleScale: BOTTLE_SCALE[250], tier: "standard" },
  { id: "sinergia-500", slug: "sinergia-500", name: "SINERGIA 500 mg", totalMg: 500, concentration: "25 mg/ml", cbd: "25 mg/ml", cbg: "0.5 mg/ml", volume: "20 ml", price: null, image: img500, bottle: bottle500, bottleScale: BOTTLE_SCALE[500], tier: "standard" },
  { id: "sinergia-750", slug: "sinergia-750", name: "SINERGIA 750 mg", totalMg: 750, concentration: "25 mg/ml", cbd: "25 mg/ml", cbg: "0.5 mg/ml", volume: "30 ml", price: null, image: img750, bottle: bottle750, bottleScale: BOTTLE_SCALE[750], tier: "standard", featured: true },
  { id: "sinergia-1000", slug: "sinergia-1000", name: "SINERGIA 1000 mg", totalMg: 1000, concentration: "50 mg/ml", cbd: "50 mg/ml", cbg: "1 mg/ml", volume: "20 ml", price: null, image: img1000, bottle: bottle1000, bottleScale: BOTTLE_SCALE[1000], tier: "high" },
  { id: "sinergia-1500", slug: "sinergia-1500", name: "SINERGIA 1500 mg", totalMg: 1500, concentration: "50 mg/ml", cbd: "50 mg/ml", cbg: "1 mg/ml", volume: "30 ml", price: null, image: img1500, bottle: bottle1500, bottleScale: BOTTLE_SCALE[1500], tier: "high" },
];

/** True only when every product has a confirmed price. */
export const PRICES_READY = PRODUCTS.every((p) => p.price !== null);

export const TIER_LABEL: Record<Product["tier"], string> = {
  standard: "Concentración 25 mg/ml",
  high: "Concentración 50 mg/ml",
};

/** Factual description built only from label data. */
export const describeProduct = (p: Product) =>
  `Cannabinoides de espectro amplio (Broad Spectrum) con ${p.cbd} de CBD, ${p.cbg} de CBG y terpenos naturales. Contenido total de ${p.totalMg} mg en frasco de ${p.volume}. Uso veterinario para perros y gatos.`;

export const getProductBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const getProductById = (id: string) => PRODUCTS.find((p) => p.id === id);
