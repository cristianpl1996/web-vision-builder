import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Lo que el checkout necesita saber de la tienda (`/v1/tienda`). */
export interface StoreConfig {
  /** Pasarela encendida y con credenciales. */
  mercadopago: boolean;
  /** Pago por transferencia/depósito con comprobante encendido. */
  transferencia: boolean;
  /** Datos para transferir que escribe el superadmin (banco, titular, CLABE…). Vacío = por WhatsApp. */
  transferInfo: string;
  shippingCost: number;
  freeShippingFrom: number | null;
  /** Pesos por dólar; null = la tienda solo vende en pesos. Precios y envío vienen en pesos. */
  usdRate: number | null;
  /** La cuenta de Mercado Pago acepta cobros en dólares. */
  mercadopagoUsd: boolean;
}

export const useStoreConfig = () =>
  useQuery({ queryKey: ["tienda"], queryFn: () => api<StoreConfig>("/tienda"), staleTime: 60_000 });

/** Envío EN PESOS, con la regla de `services/ordenes.cotizar` del backend (que es quien manda). */
export function shippingFor(config: StoreConfig | undefined, subtotalPesos: number): number {
  if (!config) return 0;
  if (config.freeShippingFrom !== null && subtotalPesos >= config.freeShippingFrom) return 0;
  return config.shippingCost;
}

/** Qué formas de pago sirven para un monto en esta moneda (mismo criterio que el backend). */
export function paymentOptions(config: StoreConfig | undefined, currency: "MXN" | "USD") {
  return {
    mercadopago: !!config?.mercadopago && (currency === "MXN" || !!config?.mercadopagoUsd),
    transferencia: !!config?.transferencia,
  };
}

/** Cómo se paga, en palabras de cliente, según lo encendido en Ajustes (landing, FAQ y pie). */
export function paymentPhrase(config: StoreConfig | undefined): string {
  if (config?.mercadopago && config.transferencia) return "en línea con Mercado Pago o por transferencia con tu comprobante";
  if (config?.mercadopago) return "en línea con Mercado Pago (tarjeta, OXXO o SPEI)";
  return "por transferencia o depósito, subiendo tu comprobante en tu pedido";
}
