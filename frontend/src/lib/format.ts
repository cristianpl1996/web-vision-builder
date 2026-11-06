import { STORE } from "@/data/products";

export type Currency = "MXN" | "USD";

const fmt = (currency: Currency, decimals: number) =>
  new Intl.NumberFormat(STORE.locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
const FMT = { MXN: [fmt("MXN", 0), fmt("MXN", 2)], USD: [fmt("USD", 0), fmt("USD", 2)] } as const;

/** «$1,590» en pesos; «$86 USD» en dólares (el símbolo solo no distingue la moneda). */
export const formatMoney = (value: number, currency: Currency = "MXN") =>
  currency === "USD" ? `${FMT.USD[0].format(value)} USD` : FMT.MXN[0].format(value);
export const formatMoneyPrecise = (value: number, currency: Currency = "MXN") =>
  currency === "USD" ? `${FMT.USD[1].format(value)} USD` : FMT.MXN[1].format(value);
/**
 * Pesos → dólares con la MISMA regla que `services/ordenes.convertir` del backend: dólares
 * enteros redondeados hacia arriba (con un redondeo previo a 6 decimales contra el ruido de
 * los flotantes). Solo para mostrar: el total que vale lo calcula el servidor.
 */
export const convertirPesos = (pesos: number, rate: number | null) =>
  rate ? Math.ceil(Number((pesos / rate).toFixed(6))) : pesos;

/** Pesos (lo que se configura en el panel). */
export const formatPrice = (value: number) => formatMoney(value, "MXN");

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
