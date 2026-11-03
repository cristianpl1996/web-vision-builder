/**
 * Payment gateway adapter.
 *
 * Checkout calls `startPayment(methodId, order)` after the order is created.
 * To plug a gateway (Mercado Pago, Stripe, Conekta, Openpay, Wompi...):
 *   1. Create a backend endpoint that builds the payment/session from the order ID
 *      (prices must be recalculated server-side).
 *   2. Add a provider here whose `start()` calls that endpoint and returns
 *      `{ type: "redirect", url }` (hosted checkout) or `{ type: "done" }`.
 *   3. Set `enabled: true` on the method.
 * The UI already handles both result types.
 */
import type { Order } from "@/services/orders";

export type PaymentResult = { type: "redirect"; url: string } | { type: "done" };

export interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  start: (order: Order) => Promise<PaymentResult>;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "card",
    label: "Tarjeta de crédito o débito",
    description: "Pago en línea con tarjeta.",
    enabled: false, // ← enable once the gateway is connected
    start: async () => {
      throw new Error("Pasarela de pago aún no configurada.");
    },
  },
  {
    id: "manual",
    label: "Pago coordinado por WhatsApp",
    description: "Al enviarnos tu pedido por WhatsApp te confirmamos el precio, el envío y las opciones de pago.",
    enabled: true,
    start: async () => ({ type: "done" }),
  },
];

export async function startPayment(methodId: string, order: Order): Promise<PaymentResult> {
  const method = PAYMENT_METHODS.find((m) => m.id === methodId && m.enabled);
  if (!method) throw new Error("Método de pago no disponible.");
  return method.start(order);
}
