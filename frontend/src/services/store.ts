import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Lo que el checkout necesita saber de la tienda (`/v1/tienda`). */
export interface StoreConfig {
  mercadopago: boolean;
  shippingCost: number;
  freeShippingFrom: number | null;
}

export const useStoreConfig = () =>
  useQuery({ queryKey: ["tienda"], queryFn: () => api<StoreConfig>("/tienda"), staleTime: 60_000 });

/** Mismo cálculo que `services/ordenes.costo_envio` del backend (que es quien manda). */
export function shippingFor(config: StoreConfig | undefined, subtotal: number): number {
  if (!config) return 0;
  if (config.freeShippingFrom !== null && subtotal >= config.freeShippingFrom) return 0;
  return config.shippingCost;
}
