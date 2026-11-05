import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Solo bloquea las rutas que piden cuenta (checkout, cuenta, pedidos) y el panel (`admin`).
 * La tienda queda abierta a todos. El backend vuelve a validar todo: esto es solo navegación.
 */
export function RequireAuth({ children, reason, admin = false }: { children: ReactNode; reason?: string; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    const qs = new URLSearchParams({ redirect: pathname + search });
    if (reason) qs.set("reason", reason);
    return <Navigate to={`/ingresar?${qs}`} replace />;
  }
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
