import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isUpcoming, toShopItems, type ApiProduct, type Product, type ShopItem } from "@/data/products";

interface CatalogValue {
  loading: boolean;
  error: boolean;
  /** Todo lo que muestra la tienda, en orden (incluye «próximamente»). */
  shopItems: ShopItem[];
  /** Solo lo que tiene ficha (se puede ver y, si no está agotado, comprar). */
  products: Product[];
  getById: (id: string) => Product | undefined;
  getBySlug: (slug: string) => Product | undefined;
  /** true si todo lo publicado tiene precio (si no, la tienda habla de «precio por WhatsApp»). */
  pricesReady: boolean;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const q = useQuery({
    queryKey: ["productos"],
    queryFn: () => api<ApiProduct[]>("/productos"),
    staleTime: 60_000,
  });

  const value = useMemo<CatalogValue>(() => {
    const shopItems = q.data ? toShopItems(q.data) : [];
    const products = shopItems.filter((i): i is Product => !isUpcoming(i));
    const byId = new Map(products.map((p) => [p.id, p]));
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return {
      loading: q.isLoading,
      error: q.isError,
      shopItems,
      products,
      getById: (id) => byId.get(id),
      getBySlug: (slug) => bySlug.get(slug),
      pricesReady: products.every((p) => p.price !== null),
    };
  }, [q.data, q.isLoading, q.isError]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
