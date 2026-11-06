import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Index from "./pages/Index";

// Secondary routes are code-split so the landing loads fast
const ProductPage = lazy(() => import("./pages/ProductPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const VerifyEmailPage = lazy(() => import("./pages/EmailLinkPages").then((m) => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import("./pages/EmailLinkPages").then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./pages/EmailLinkPages").then((m) => ({ default: m.ResetPasswordPage })));

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });

// The shareable preview build runs inside a frame where URL paths can't change, so it routes in memory.
const Router = import.meta.env.VITE_ROUTER === "memory" ? MemoryRouter : BrowserRouter;

const PageLoader = () => (
  <div className="grid min-h-dvh place-items-center" aria-busy="true">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CatalogProvider>
      <CurrencyProvider>
      <CartProvider>
        <TooltipProvider>
          <Sonner theme="light" position="top-center" richColors closeButton duration={3500} />
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/producto/:slug" element={<ProductPage />} />
                <Route path="/ingresar" element={<AuthPage />} />
                <Route
                  path="/checkout"
                  element={
                    <RequireAuth reason="checkout">
                      <CheckoutPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/cuenta"
                  element={
                    <RequireAuth>
                      <AccountPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/pedido/:id"
                  element={
                    <RequireAuth>
                      <OrderConfirmationPage />
                    </RequireAuth>
                  }
                />
                <Route path="/verificar" element={<VerifyEmailPage />} />
                <Route path="/recuperar" element={<ForgotPasswordPage />} />
                <Route path="/restablecer" element={<ResetPasswordPage />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth admin>
                      <AdminPage />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </TooltipProvider>
      </CartProvider>
      </CurrencyProvider>
      </CatalogProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
