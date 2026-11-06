/**
 * La moneda en la que el cliente ve y paga: pesos (MXN) o dólares (USD).
 * Los productos tienen su precio en pesos; en dólares se convierte con el tipo de cambio de
 * Admin › Ajustes, con la MISMA regla que `services/ordenes.convertir` del backend (dólares
 * enteros hacia arriba). Aquí solo se muestra: el total que vale lo calcula el servidor.
 * Sin tipo de cambio configurado, la tienda es solo en pesos y el selector no aparece.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { convertirPesos, formatMoney, formatMoneyPrecise, readStorage, writeStorage, type Currency } from "@/lib/format";
import { useStoreConfig } from "@/services/store";

const KEY = "sinergia.moneda";

interface CurrencyValue {
  /** Moneda efectiva (USD solo si la tienda la ofrece). */
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** La tienda ofrece dólares (hay tipo de cambio en Ajustes). */
  usdEnabled: boolean;
  /** Pesos → moneda elegida. */
  convert: (pesos: number) => number;
  /** Un monto YA en la moneda elegida, con formato. */
  format: (value: number) => string;
  /** Pesos → moneda elegida, con formato. */
  price: (pesos: number) => string;
  pricePrecise: (value: number) => string;
  priceOrQuote: (pesos: number | null) => string;
}

const CurrencyContext = createContext<CurrencyValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data: config } = useStoreConfig();
  const [elegida, setElegida] = useState<Currency>(() => readStorage<Currency>(KEY, "MXN"));
  useEffect(() => writeStorage(KEY, elegida), [elegida]);

  const rate = config?.usdRate ?? null;
  const currency: Currency = rate ? elegida : "MXN";
  const convert = useCallback((pesos: number) => (currency === "USD" ? convertirPesos(pesos, rate) : pesos), [currency, rate]);
  const format = (value: number) => formatMoney(value, currency);
  const value: CurrencyValue = {
    currency,
    setCurrency: setElegida,
    usdEnabled: !!rate,
    convert,
    format,
    price: (pesos) => format(convert(pesos)),
    pricePrecise: (value) => formatMoneyPrecise(value, currency),
    priceOrQuote: (pesos) => (pesos === null ? "Precio por WhatsApp" : format(convert(pesos))),
  };
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
