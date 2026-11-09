import { createHash, randomBytes } from "node:crypto";
import type { GoogleReviewsConfig } from "./config";
import {
  clearOAuthPending,
  loadOAuthPending,
  loadTokens,
  saveOAuthPending,
  saveTokens,
  type OAuthPending,
} from "./storage";
import type { GoogleTokens } from "./types";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PENDING_TTL_MS = 10 * 60 * 1000;

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64Url(randomBytes(32));
  const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

export function createOAuthState(): string {
  return base64Url(randomBytes(24));
}

export async function beginOAuth(
  config: GoogleReviewsConfig,
): Promise<{ authorizeUrl: string }> {
  const state = createOAuthState();
  const { codeVerifier, codeChallenge } = createPkcePair();
  const pending: OAuthPending = {
    state,
    codeVerifier,
    createdAt: Date.now(),
  };
  await saveOAuthPending(config.dataDir, pending);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "false",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return { authorizeUrl: `${AUTH_URL}?${params.toString()}` };
}

export class OAuthCallbackError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "denied"
      | "state_mismatch"
      | "expired"
      | "missing_code"
      | "token_exchange"
      | "config",
  ) {
    super(message);
    this.name = "OAuthCallbackError";
  }
}

export async function completeOAuthCallback(
  config: GoogleReviewsConfig,
  params: { code?: string | null; state?: string | null; error?: string | null },
): Promise<GoogleTokens> {
  if (params.error) {
    await clearOAuthPending(config.dataDir);
    throw new OAuthCallbackError("Authorization was denied or cancelled.", "denied");
  }
  if (!params.code) {
    throw new OAuthCallbackError("Missing authorization code.", "missing_code");
  }
  if (!params.state) {
    throw new OAuthCallbackError("Missing OAuth state.", "state_mismatch");
  }

  const pending = await loadOAuthPending(config.dataDir);
  await clearOAuthPending(config.dataDir);

  if (!pending || pending.state !== params.state) {
    throw new OAuthCallbackError("OAuth state mismatch.", "state_mismatch");
  }
  if (Date.now() - pending.createdAt > PENDING_TTL_MS) {
    throw new OAuthCallbackError("OAuth session expired. Start again.", "expired");
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: params.code,
    code_verifier: pending.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data.access_token !== "string") {
    throw new OAuthCallbackError("Token exchange failed.", "token_exchange");
  }

  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  const tokens: GoogleTokens = {
    access_token: data.access_token,
    refresh_token: typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    expiry_date: Date.now() + expiresIn * 1000,
    scope: typeof data.scope === "string" ? data.scope : config.scope,
    token_type: typeof data.token_type === "string" ? data.token_type : "Bearer",
    updated_at: new Date().toISOString(),
  };

  // Preserve prior refresh_token if Google omits it on re-consent edge cases.
  if (!tokens.refresh_token) {
    const prior = await loadTokens(config.dataDir);
    if (prior?.refresh_token) tokens.refresh_token = prior.refresh_token;
  }

  await saveTokens(config.dataDir, tokens);
  return tokens;
}

export async function refreshAccessToken(
  config: GoogleReviewsConfig,
  tokens: GoogleTokens,
): Promise<GoogleTokens> {
  if (!tokens.refresh_token) {
    throw new Error("missing_refresh_token");
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data.access_token !== "string") {
    const err = new Error("refresh_failed");
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  const next: GoogleTokens = {
    access_token: data.access_token,
    refresh_token:
      typeof data.refresh_token === "string" ? data.refresh_token : tokens.refresh_token,
    expiry_date: Date.now() + expiresIn * 1000,
    scope: typeof data.scope === "string" ? data.scope : tokens.scope,
    token_type: typeof data.token_type === "string" ? data.token_type : tokens.token_type,
    updated_at: new Date().toISOString(),
  };
  await saveTokens(config.dataDir, next);
  return next;
}

export async function getValidAccessToken(
  config: GoogleReviewsConfig,
  tokens: GoogleTokens,
  skewMs = 60_000,
): Promise<GoogleTokens> {
  if (tokens.expiry_date - skewMs > Date.now()) {
    return tokens;
  }
  return refreshAccessToken(config, tokens);
}
