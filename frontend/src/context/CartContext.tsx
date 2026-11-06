import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { useCatalog } from "@/context/CatalogContext";
import { useCurrency } from "@/context/CurrencyContext";
import { readStorage, writeStorage } from "@/lib/format";

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface CartLineDetailed extends CartLine {
  product: Product;
  /** En la moneda elegida. */
  lineTotal: number;
}

type Action =
  | { type: "add"; productId: string; quantity: number }
  | { type: "set"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" }
  | { type: "replace"; lines: CartLine[] };

const MAX_QTY = 20;
const KEY = "sinergia.cart";

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "add": {
      const existing = state.find((l) => l.productId === action.productId);
      if (existing) {
        return state.map((l) =>
          l.productId === action.productId ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + action.quantity) } : l,
        );
      }
      return [...state, { productId: action.productId, quantity: Math.min(MAX_QTY, action.quantity) }];
    }
    case "set":
      if (action.quantity <= 0) return state.filter((l) => l.productId !== action.productId);
      return state.map((l) =>
        l.productId === action.productId ? { ...l, quantity: Math.min(MAX_QTY, action.quantity) } : l,
      );
    case "remove":
      return state.filter((l) => l.productId !== action.productId);
    case "clear":
      return [];
    case "replace":
      return action.lines;
  }
}

interface CartContextValue {
  lines: CartLineDetailed[];
  count: number;
  /** Suma en la moneda elegida (0 mientras no haya precios). */
  subtotal: number;
  /** La misma suma en pesos: el envío gratis se decide en pesos. */
  subtotalPesos: number;
  isOpen: boolean;
  bump: number;
  open: () => void;
  close: () => void;
  setOpen: (v: boolean) => void;
  add: (productId: string, quantity?: number, opts?: { openDrawer?: boolean }) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { getById: getProductById, loading: catalogLoading, error: catalogError } = useCatalog();
  const [state, dispatch] = useReducer(reducer, undefined, () => readStorage<CartLine[]>(KEY, []));
  const { convert } = useCurrency();
  const [isOpen, setOpen] = useState(false);
  const [bump, setBump] = useState(0);

  useEffect(() => writeStorage(KEY, state), [state]);

  // Con el catálogo cargado, se quitan del carrito los productos que ya no se venden
  // (borrados, ocultos o agotados). Mientras carga, el carrito guardado no se toca.
  useEffect(() => {
    if (catalogLoading || catalogError) return;
    const vigentes = state.filter((l) => {
      const p = getProductById(l.productId);
      return p && !p.soldOut;
    });
    if (vigentes.length !== state.length) dispatch({ type: "replace", lines: vigentes });
  }, [catalogLoading, catalogError, state, getProductById]);

  // Keep carts in sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      dispatch({ type: "replace", lines: readStorage<CartLine[]>(KEY, []) });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const lines = useMemo<CartLineDetailed[]>(
    () =>
      state.flatMap((l) => {
        const product = getProductById(l.productId);
        return product && !product.soldOut
          ? [{ ...l, product, lineTotal: convert(product.price ?? 0) * l.quantity }]
          : [];
      }),
    [state, getProductById, convert],
  );

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const subtotalPesos = lines.reduce((n, l) => n + (l.product.price ?? 0) * l.quantity, 0);

  const add = useCallback<CartContextValue["add"]>((productId, quantity = 1, opts) => {
    const product = getProductById(productId);
    if (!product) return;
    dispatch({ type: "add", productId, quantity });
    setBump((b) => b + 1);
    if (opts?.openDrawer ?? true) setOpen(true);
    else toast.success(`${product.name} agregado al carrito`);
  }, [getProductById]);

  const remove = useCallback((productId: string) => {
    const product = getProductById(productId);
    const line = state.find((l) => l.productId === productId);
    dispatch({ type: "remove", productId });
    if (product && line) {
      toast(`${product.name} eliminado`, {
        action: { label: "Deshacer", onClick: () => dispatch({ type: "add", productId, quantity: line.quantity }) },
      });
    }
  }, [state, getProductById]);

  const value: CartContextValue = {
    lines,
    count,
    subtotal,
    subtotalPesos,
    isOpen,
    bump,
    open: () => setOpen(true),
    close: () => setOpen(false),
    setOpen,
    add,
    setQuantity: (productId, quantity) => dispatch({ type: "set", productId, quantity }),
    remove,
    clear: () => dispatch({ type: "clear" }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
