import { promises as fs } from "node:fs";
import path from "node:path";
import type { GoogleTokens, LocationSelection, ReviewsCache } from "./types";

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  await fs.rename(tmp, filePath);
}

async function removeFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

export function tokenPath(dataDir: string): string {
  return path.join(dataDir, "tokens.json");
}

export function selectionPath(dataDir: string): string {
  return path.join(dataDir, "selection.json");
}

export function cachePath(dataDir: string): string {
  return path.join(dataDir, "reviews-cache.json");
}

export function oauthPendingPath(dataDir: string): string {
  return path.join(dataDir, "oauth-pending.json");
}

export async function loadTokens(dataDir: string): Promise<GoogleTokens | null> {
  return readJson<GoogleTokens>(tokenPath(dataDir));
}

export async function saveTokens(dataDir: string, tokens: GoogleTokens): Promise<void> {
  await writeJson(tokenPath(dataDir), tokens);
}

export async function clearTokens(dataDir: string): Promise<void> {
  await removeFile(tokenPath(dataDir));
}

export async function loadSelection(dataDir: string): Promise<LocationSelection | null> {
  return readJson<LocationSelection>(selectionPath(dataDir));
}

export async function saveSelection(
  dataDir: string,
  selection: LocationSelection,
): Promise<void> {
  await writeJson(selectionPath(dataDir), selection);
}

export async function clearSelection(dataDir: string): Promise<void> {
  await removeFile(selectionPath(dataDir));
}

export async function loadCache(dataDir: string): Promise<ReviewsCache | null> {
  return readJson<ReviewsCache>(cachePath(dataDir));
}

export async function saveCache(dataDir: string, cache: ReviewsCache): Promise<void> {
  await writeJson(cachePath(dataDir), cache);
}

export async function clearCache(dataDir: string): Promise<void> {
  await removeFile(cachePath(dataDir));
}

export type OAuthPending = {
  state: string;
  codeVerifier: string;
  createdAt: number;
};

export async function saveOAuthPending(dataDir: string, pending: OAuthPending): Promise<void> {
  await writeJson(oauthPendingPath(dataDir), pending);
}

export async function loadOAuthPending(dataDir: string): Promise<OAuthPending | null> {
  return readJson<OAuthPending>(oauthPendingPath(dataDir));
}

export async function clearOAuthPending(dataDir: string): Promise<void> {
  await removeFile(oauthPendingPath(dataDir));
}

/** Wipe tokens, selection, cache, and pending OAuth (disconnect / revoke cleanup). */
export async function clearAllGoogleReviewsData(dataDir: string): Promise<void> {
  await Promise.all([
    clearTokens(dataDir),
    clearSelection(dataDir),
    clearCache(dataDir),
    clearOAuthPending(dataDir),
  ]);
}
