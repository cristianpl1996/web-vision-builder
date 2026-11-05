import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, type ProfilePatch, type RegisterInput, type User } from "@/services/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<User>;
  /** Para cuando otra acción devuelve el usuario actualizado (verificar correo, restablecer). */
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getSession()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAdmin: user?.role === "superadmin",
    setUser,
    login: async (email, password) => {
      const u = await authService.login(email, password);
      setUser(u);
      return u;
    },
    register: async (input) => {
      const u = await authService.register(input);
      setUser(u);
      return u;
    },
    logout: async () => {
      await authService.logout();
      setUser(null);
    },
    updateProfile: async (patch) => {
      const u = await authService.updateProfile(patch);
      setUser(u);
      return u;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
