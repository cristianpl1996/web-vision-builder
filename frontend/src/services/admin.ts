/** Lo que usa el panel del superadmin. Todo lo valida el backend (`/v1/admin/*`). */
import { api } from "@/lib/api";
import type { ApiProduct } from "@/data/products";
import type { Order, OrderStatus } from "@/services/orders";

export interface OrdersPage {
  items: Order[];
  total: number;
}

export interface OrdersFilter {
  estado?: string;
  buscar?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
}

export type ProductInput = Omit<ApiProduct, "id" | "fotos">;

export type Settings = Record<string, string | boolean>;

export const adminService = {
  orders(f: OrdersFilter) {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && v !== "" && q.set(k, String(v)));
    return api<OrdersPage>(`/admin/ordenes?${q}`);
  },
  changeStatus: (id: number, body: { status: OrderStatus; note?: string; carrier?: string; tracking?: string }) =>
    api<Order>(`/admin/ordenes/${id}/estado`, { method: "PATCH", body }),

  products: () => api<ApiProduct[]>("/admin/productos"),
  createProduct: (p: ProductInput) => api<ApiProduct>("/admin/productos", { method: "POST", body: p }),
  updateProduct: (id: number, p: ProductInput) => api<ApiProduct>(`/admin/productos/${id}`, { method: "PUT", body: p }),
  duplicateProduct: (id: number) => api<ApiProduct>(`/admin/productos/${id}/duplicar`, { method: "POST" }),
  deleteProduct: (id: number) => api<void>(`/admin/productos/${id}`, { method: "DELETE" }),
  uploadPhoto(id: number, file: File) {
    const form = new FormData();
    form.append("archivo", file);
    return api<ApiProduct>(`/admin/productos/${id}/fotos`, { method: "POST", form });
  },
  reorderPhotos: (id: number, ids: number[]) =>
    api<ApiProduct>(`/admin/productos/${id}/fotos/orden`, { method: "PUT", body: { ids } }),
  deletePhoto: (id: number, fotoId: number) =>
    api<ApiProduct>(`/admin/productos/${id}/fotos/${fotoId}`, { method: "DELETE" }),

  settings: () => api<Settings>("/admin/ajustes"),
  saveSettings: (s: Record<string, string>) => api<Settings>("/admin/ajustes", { method: "PUT", body: s }),
  testEmail: (email: string) =>
    api<{ ok: boolean; message: string }>("/admin/ajustes/probar-correo", { method: "POST", body: { email } }),
};
