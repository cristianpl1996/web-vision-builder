/**
 * Auth service.
 *
 * The UI only talks to the `AuthService` interface. The current implementation
 * (`localAuthService`) stores accounts in the browser so the full flow works
 * without a backend. Before going live, replace it with a real provider
 * (Supabase Auth, Firebase Auth, Auth0 or your own API) — just implement the
 * same interface and export it as `authService`.
 */
import { readStorage, writeStorage } from "@/lib/format";

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  extNumber: string;
  intNumber?: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  references?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
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

export interface AuthService {
  getSession(): Promise<User | null>;
  login(email: string, password: string): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): Promise<void>;
  updateProfile(userId: string, patch: Partial<Omit<User, "id" | "email" | "createdAt">>): Promise<User>;
}

export class AuthError extends Error {}

// ───────────────────────── Local (demo) implementation ─────────────────────────

interface StoredUser extends User {
  salt: string;
  passwordHash: string;
}

const USERS_KEY = "sinergia.users";
const SESSION_KEY = "sinergia.session";

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

const randomId = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const strip = ({ salt: _s, passwordHash: _p, ...user }: StoredUser): User => user;
const getUsers = () => readStorage<StoredUser[]>(USERS_KEY, []);
const saveUsers = (users: StoredUser[]) => writeStorage(USERS_KEY, users);
const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

export const localAuthService: AuthService = {
  async getSession() {
    const id = readStorage<string | null>(SESSION_KEY, null);
    const user = id ? getUsers().find((u) => u.id === id) : undefined;
    return user ? strip(user) : null;
  },

  async login(email, password) {
    await delay();
    const user = getUsers().find((u) => u.email === email.trim().toLowerCase());
    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
      throw new AuthError("Correo o contraseña incorrectos.");
    }
    writeStorage(SESSION_KEY, user.id);
    return strip(user);
  },

  async register(input) {
    await delay();
    const email = input.email.trim().toLowerCase();
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      throw new AuthError("Ya existe una cuenta con este correo. Inicia sesión.");
    }
    const salt = randomId();
    const user: StoredUser = {
      id: randomId(),
      email,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim(),
      createdAt: new Date().toISOString(),
      addresses: [],
      salt,
      passwordHash: await hashPassword(input.password, salt),
    };
    saveUsers([...users, user]);
    writeStorage(SESSION_KEY, user.id);
    return strip(user);
  },

  async logout() {
    writeStorage(SESSION_KEY, null);
  },

  async updateProfile(userId, patch) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new AuthError("Sesión no válida.");
    users[idx] = { ...users[idx], ...patch };
    saveUsers(users);
    return strip(users[idx]);
  },
};

export const authService: AuthService = localAuthService;
