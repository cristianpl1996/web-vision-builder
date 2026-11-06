/**
 * Cuentas contra la API (`/v1/auth`, `/v1/me`). Las pantallas usan `AuthContext`,
 * que es quien llama a este servicio.
 */
import { api, getToken, setToken } from "@/lib/api";

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  extNumber: string;
  intNumber?: string | null;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  references?: string | null;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  /** admin: órdenes y productos · superadmin: además Ajustes. */
  role: "cliente" | "admin" | "superadmin";
  emailVerified: boolean;
  createdAt: string;
  addresses: Address[];
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export type ProfilePatch = Partial<Pick<User, "firstName" | "lastName" | "phone" | "addresses">>;

interface Sesion {
  token: string;
  user: User;
}

const guardar = (s: Sesion) => {
  setToken(s.token);
  return s.user;
};

export const authService = {
  async getSession(): Promise<User | null> {
    if (!getToken()) return null;
    try {
      return await api<User>("/me");
    } catch {
      setToken(null); // token vencido o revocado
      return null;
    }
  },
  login: async (email: string, password: string) =>
    guardar(await api<Sesion>("/auth/login", { method: "POST", body: { email, password } })),
  register: async (input: RegisterInput) =>
    guardar(await api<Sesion>("/auth/registro", { method: "POST", body: input })),
  async logout() {
    setToken(null);
  },
  updateProfile: (patch: ProfilePatch) => api<User>("/me", { method: "PATCH", body: patch }),
  verifyEmail: (token: string) => api<User>("/auth/verificar", { method: "POST", body: { token } }),
  resendVerification: () => api<void>("/auth/reenviar-verificacion", { method: "POST" }),
  forgotPassword: (email: string) => api<void>("/auth/olvide", { method: "POST", body: { email } }),
  resetPassword: async (token: string, password: string) =>
    guardar(await api<Sesion>("/auth/restablecer", { method: "POST", body: { token, password } })),
  changePassword: async (actual: string, nueva: string) =>
    guardar(await api<Sesion>("/me/password", { method: "POST", body: { actual, nueva } })),
};
