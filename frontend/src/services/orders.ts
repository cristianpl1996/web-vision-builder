/**
 * Órdenes contra la API. El total lo calcula el servidor: aquí solo se mandan ids y cantidades.
 */
import { api } from "@/lib/api";
import type { Address } from "@/services/auth";

export type OrderStatus = "pendiente_pago" | "pagada" | "preparando" | "enviada" | "entregada" | "cancelada";
export type PaymentMethod = "mercadopago" | "whatsapp";

export interface OrderItem {
  productId: number | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface OrderEvent {
  estado: OrderStatus;
  nota: string;
  por: string;
  fecha: string;
}

export interface Order {
  id: number;
  number: string;
  email: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: Address;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  carrier: string | null;
  tracking: string | null;
  paymentUrl: string | null;
  notes: string;
  events: OrderEvent[];
  createdAt: string;
}

export interface NewOrder {
  items: { productId: number; quantity: number }[];
  address: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
}

interface Created {
  order: Order;
  paymentUrl: string | null;
}

export const orderService = {
  create: (o: NewOrder) => api<Created>("/ordenes", { method: "POST", body: o }),
  listMine: () => api<Order[]>("/ordenes"),
  get: (id: number | string) => api<Order>(`/ordenes/${id}`),
  retryPayment: (id: number) => api<Created>(`/ordenes/${id}/pago`, { method: "POST" }),
  verifyPayment: (id: number | string) => api<Order>(`/ordenes/${id}/verificar-pago`, { method: "POST" }),
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente_pago: "Pendiente de pago",
  pagada: "Pagado",
  preparando: "En preparación",
  enviada: "Enviado",
  entregada: "Entregado",
  cancelada: "Cancelado",
};

/** Colores de la etiqueta de estado (texto + fondo, con contraste AA). */
export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  pendiente_pago: "bg-amber-100 text-amber-900",
  pagada: "bg-emerald-100 text-emerald-900",
  preparando: "bg-sky-100 text-sky-900",
  enviada: "bg-indigo-100 text-indigo-900",
  entregada: "bg-primary/15 text-primary",
  cancelada: "bg-red-100 text-red-900",
};

/** Espejo de `TRANSICIONES` en backend/app/services/ordenes.py (el backend es quien valida). */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pendiente_pago: ["pagada", "cancelada"],
  pagada: ["preparando", "enviada", "cancelada"],
  preparando: ["enviada", "cancelada"],
  enviada: ["entregada"],
  entregada: [],
  cancelada: [],
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  mercadopago: "Mercado Pago",
  whatsapp: "Coordinado por WhatsApp",
};
