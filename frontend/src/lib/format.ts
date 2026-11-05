import { STORE } from "@/data/products";

const currencyFmt = new Intl.NumberFormat(STORE.locale, {
  style: "currency",
  currency: STORE.currency,
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number) => currencyFmt.format(value);

const preciseFmt = new Intl.NumberFormat(STORE.locale, {
  style: "currency",
  currency: STORE.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const formatPricePrecise = (value: number) => preciseFmt.format(value);

/** Price or the agreed wording when it hasn't been confirmed yet. */
export const priceOrQuote = (value: number | null) => (value === null ? "Precio por WhatsApp" : formatPrice(value));

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(STORE.locale, { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));

/** Safe localStorage helpers (private mode / blocked storage won't crash the app). */
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
