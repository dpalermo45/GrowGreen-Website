import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Read a local `.env` into a plain object without printing values.
 * Used because Astro/Vite expose PUBLIC_* via import.meta.env, but server
 * code that reads `process.env` does not automatically receive private keys
 * from `.env` unless they were already injected by the host.
 */
export function readDotEnvFile(cwd: string = process.cwd()): Record<string, string> {
  try {
    const text = readFileSync(path.join(cwd, ".env"), "utf8");
    const out: Record<string, string> = {};
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

let seeded = false;

/** Fill missing `process.env` keys from `.env` (never overwrite real env). */
export function seedProcessEnvFromDotEnv(cwd: string = process.cwd()): void {
  if (seeded) return;
  seeded = true;
  const fileEnv = readDotEnvFile(cwd);
  for (const [key, value] of Object.entries(fileEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/**
 * Resolve the env bag for server config readers.
 * Explicit bags (tests) win as-is. Otherwise: `.env` file then `process.env`.
 */
export function resolveServerEnv(
  explicit?: NodeJS.ProcessEnv,
  cwd: string = process.cwd(),
): NodeJS.ProcessEnv {
  if (explicit && explicit !== process.env) {
    return explicit;
  }
  seedProcessEnvFromDotEnv(cwd);
  return process.env;
}
