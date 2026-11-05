import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/** Only blocks the routes that need an account (checkout, account). The store stays open to everyone. */
export function RequireAuth({ children, reason }: { children: ReactNode; reason?: string }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    const qs = new URLSearchParams({ redirect: pathname });
    if (reason) qs.set("reason", reason);
    return <Navigate to={`/ingresar?${qs}`} replace />;
  }
  return <>{children}</>;
}
