// El árbitro de la máquina, DENTRO del ciclo del agente (mismo patrón que Hubu):
// después de cada Edit/Write, el lint mira solo el archivo tocado y le devuelve el
// rechazo a Claude, que lo arregla antes de seguir.
//
// Sale 2 cuando el archivo tiene hallazgos (Claude los ve y los corrige) y 1 cuando
// no pudo medir (falta `npm install` o `uv`): eso avisa sin frenar el trabajo.
import { spawnSync } from "node:child_process";
import { join, relative, resolve, sep } from "node:path";

const raiz = resolve(import.meta.dirname, "../..");
let entrada = "";
for await (const trozo of process.stdin) entrada += trozo;
const ruta = JSON.parse(entrada).tool_input?.file_path;
if (!ruta) process.exit(0);

const rel = relative(raiz, resolve(ruta)).split(sep).join("/");
const win = process.platform === "win32";
let pasos = [];
if (/^frontend\/src\/.+\.tsx?$/.test(rel)) {
  // shadcn/ui se copió tal cual y trae 2 hallazgos de origen: no se le exige el lint.
  if (rel.startsWith("frontend/src/components/ui/")) process.exit(0);
  pasos = [[win ? "npx.cmd" : "npx", ["eslint", "--no-warn-ignored", rel.slice("frontend/".length)], "frontend"]];
} else if (/^backend\/.+\.py$/.test(rel) && !rel.startsWith("backend/.venv/")) {
  const archivo = rel.slice("backend/".length);
  // Versión fija de Ruff (como Hubu): entre versiones cambian las reglas.
  pasos = [
    ["uvx", ["ruff@0.16.7", "check", archivo], "backend"],
    ["uvx", ["ruff@0.16.7", "format", "--check", archivo], "backend"],
  ];
} else {
  process.exit(0);
}

for (const [cmd, args, dir] of pasos) {
  const r = spawnSync(cmd, args, { cwd: join(raiz, dir), encoding: "utf8", shell: win });
  if (r.error || r.status === null) {
    process.stderr.write(`Árbitro: no pude medir ${rel} (${r.error ?? "sin salida"}).\n`);
    process.exit(1);
  }
  if (r.status !== 0) {
    process.stderr.write(`${r.stdout ?? ""}${r.stderr ?? ""}`);
    process.exit(2);
  }
}
process.exit(0);
