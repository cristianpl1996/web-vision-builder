/**
 * Orders service. Same idea as auth: swap `localOrderService` for your API.
 * In production, totals MUST be recalculated on the server from product IDs —
 * never trust prices sent by the browser.
 */
import type { Address } from "@/services/auth";
import { readStorage, writeStorage } from "@/lib/format";

export type OrderStatus = "pending_payment" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  price: number | null;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  number: string;
  userId: string;
  email: string;
  items: OrderItem[];
  /** `null` while prices and shipping are confirmed by WhatsApp. */
  subtotal: number | null;
  shipping: number | null;
  total: number | null;
  address: Address;
  paymentMethod: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}

export type NewOrder = Omit<Order, "id" | "number" | "status" | "createdAt">;

export interface OrderService {
  create(order: NewOrder): Promise<Order>;
  listByUser(userId: string): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
}

const KEY = "sinergia.orders";

export const localOrderService: OrderService = {
  async create(input) {
    await new Promise((r) => setTimeout(r, 600));
    const orders = readStorage<Order[]>(KEY, []);
    const order: Order = {
      ...input,
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()),
      number: `SIN-${String(Date.now()).slice(-6)}`,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
    };
    writeStorage(KEY, [order, ...orders]);
    return order;
  },
  async listByUser(userId) {
    return readStorage<Order[]>(KEY, []).filter((o) => o.userId === userId);
  },
  async get(id) {
    return readStorage<Order[]>(KEY, []).find((o) => o.id === id) ?? null;
  },
};

export const orderService: OrderService = localOrderService;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
