/**
 * Cliente de la API (`/v1`). En desarrollo Vite lo manda al backend; en Docker, Caddy.
 * El token de sesión vive en localStorage; las pantallas nunca llaman a `fetch` directo.
 */
import { readStorage, writeStorage } from "@/lib/format";

const TOKEN_KEY = "sinergia.token";

export const getToken = () => readStorage<string | null>(TOKEN_KEY, null);
export const setToken = (token: string | null) => writeStorage(TOKEN_KEY, token);

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** FastAPI devuelve `detail` como texto o, si falla la validación, como lista de errores. */
function mensajeDeError(cuerpo: unknown, status: number): string {
  const detail = (cuerpo as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    const primero = detail[0] as { msg?: string; loc?: (string | number)[]; type?: string };
    const campo = String(primero.loc?.at(-1) ?? "");
    // Los mensajes propios del backend vienen en español («Value error, …»); los de pydantic, en inglés.
    if (primero.msg?.startsWith("Value error, ")) return primero.msg.replace(/^Value error, /, "");
    if (campo === "email") return "Revisa el correo electrónico: no parece válido.";
    if (campo === "phone") return "El celular debe tener 10 dígitos.";
    if (campo === "postalCode") return "El código postal debe tener 5 dígitos.";
    return "Revisa los datos marcados e intenta de nuevo.";
  }
  if (status >= 500) return "Tuvimos un problema. Intenta de nuevo en un momento.";
  return "No pudimos completar la acción. Intenta de nuevo.";
}

interface Opciones {
  method?: string;
  body?: unknown;
  form?: FormData;
}

export async function api<T = unknown>(path: string, { method = "GET", body, form }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`/v1${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError("Sin conexión. Revisa tu internet e intenta de nuevo.", 0);
  }
  if (res.status === 204) return undefined as T;
  const cuerpo = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(mensajeDeError(cuerpo, res.status), res.status);
  return cuerpo as T;
}

/** Archivo privado (p. ej. un comprobante): se baja con la sesión y se abre en otra pestaña. */
export async function abrirArchivo(path: string): Promise<void> {
  const token = getToken();
  // La pestaña se abre ANTES del await: si no, el navegador la bloquea como ventana emergente.
  const ventana = window.open("", "_blank");
  try {
    const res = await fetch(`/v1${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new ApiError(mensajeDeError(await res.json().catch(() => null), res.status), res.status);
    const url = URL.createObjectURL(await res.blob());
    if (ventana) ventana.location.href = url;
    else window.location.assign(url);
  } catch (e) {
    ventana?.close();
    throw e;
  }
}
