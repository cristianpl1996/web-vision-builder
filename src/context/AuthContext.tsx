import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, type RegisterInput, type User } from "@/services/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<User, "id" | "email" | "createdAt">>) => Promise<User>;
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
      if (!user) throw new Error("No hay sesión activa");
      const u = await authService.updateProfile(user.id, patch);
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
