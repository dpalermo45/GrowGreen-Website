import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import fixtures from "./fixtures/google-reviews.json";
import {
  mapStarRating,
  normalizeReview,
  listAllReviews,
} from "../src/lib/google-reviews/googleApi";
import {
  beginOAuth,
  completeOAuthCallback,
  createPkcePair,
  OAuthCallbackError,
  refreshAccessToken,
} from "../src/lib/google-reviews/oauth";
import { readGoogleReviewsConfig } from "../src/lib/google-reviews/config";
import { isLoopbackHost, isSetupAccessAllowed } from "../src/lib/google-reviews/loopback";
import {
  getDisplayReviews,
  isCacheFresh,
  isCacheWithinHardLimit,
  confirmLocationSelection,
  selectFeaturedReviews,
} from "../src/lib/google-reviews/service";
import { saveCache, saveTokens, saveSelection, loadCache } from "../src/lib/google-reviews/storage";
import type { ReviewsCache } from "../src/lib/google-reviews/types";

const originalFetch = globalThis.fetch;

function tempConfig(overrides: Record<string, string> = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "ggwc-reviews-"));
  const env = {
    GOOGLE_REVIEWS_CLIENT_ID: "test-client-id",
    GOOGLE_REVIEWS_CLIENT_SECRET: "test-client-secret",
    GOOGLE_REVIEWS_REDIRECT_URI: "http://localhost:4321/api/google-reviews/callback",
    GOOGLE_REVIEWS_DATA_DIR: dir,
    GOOGLE_REVIEWS_CACHE_TTL_SECONDS: "3600",
    GOOGLE_REVIEWS_CACHE_MAX_AGE_SECONDS: "86400",
    GOOGLE_REVIEWS_DISPLAY_COUNT: "6",
    GOOGLE_REVIEWS_SETUP_ENABLED: "true",
    PUBLIC_SITE_URL: "http://localhost:4321",
    ...overrides,
  } as NodeJS.ProcessEnv;
  return { dir, config: readGoogleReviewsConfig(env), env };
}

describe("google reviews — rating & text mapping", () => {
  it("maps Google star enums without inventing values", () => {
    expect(mapStarRating("FIVE")).toBe(5);
    expect(mapStarRating("STAR_RATING_TWO")).toBe(2);
    expect(mapStarRating("UNKNOWN")).toBe(0);
  });

  it("preserves review comment text exactly and never treats it as HTML", () => {
    const n = normalizeReview({
      reviewId: "x",
      reviewer: { displayName: "Pat <b>H</b>" },
      starRating: "THREE",
      comment: "Great lawn. <script>alert(1)</script>",
      createTime: "2026-01-01T00:00:00Z",
      updateTime: "2026-01-02T00:00:00Z",
    });
    expect(n?.comment).toBe("Great lawn. <script>alert(1)</script>");
    expect(n?.reviewerName).toBe("Pat <b>H</b>");
    expect(n?.starRating).toBe(3);
  });

  it("uses Google averageRating/totalReviewCount from the API response, not sample math", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("pageToken=")) {
        return new Response(JSON.stringify(fixtures.listReviewsPage2), { status: 200 });
      }
      return new Response(JSON.stringify(fixtures.listReviewsPage1), { status: 200 });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await listAllReviews("token", "111", "222");
    expect(result.averageRating).toBe(4.8);
    expect(result.totalReviewCount).toBe(42);
    expect(result.reviews).toHaveLength(3);
    // Sample average of displayed stars would be (5+2+4)/3 = 3.67 — must NOT replace API average.
    const sampleAvg =
      result.reviews.reduce((s, r) => s + (r?.starRating || 0), 0) / result.reviews.length;
    expect(sampleAvg).not.toBeCloseTo(4.8);
    expect(result.averageRating).toBe(4.8);
    // Includes a negative review — no silent filtering.
    expect(result.reviews.some((r) => r?.starRating === 2)).toBe(true);
  });
});

describe("google reviews — OAuth security", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("creates PKCE verifier/challenge pair", () => {
    const a = createPkcePair();
    const b = createPkcePair();
    expect(a.codeVerifier).not.toEqual(a.codeChallenge);
    expect(a.codeVerifier).not.toEqual(b.codeVerifier);
  });

  it("rejects callback state mismatch", async () => {
    const { config, dir } = tempConfig();
    await beginOAuth(config);
    await expect(
      completeOAuthCallback(config, { code: "abc", state: "wrong-state", error: null }),
    ).rejects.toBeInstanceOf(OAuthCallbackError);
    rmSync(dir, { recursive: true, force: true });
  });

  it("rejects OAuth denial without leaking codes", async () => {
    const { config, dir } = tempConfig();
    await expect(
      completeOAuthCallback(config, { code: null, state: "x", error: "access_denied" }),
    ).rejects.toMatchObject({ code: "denied" });
    rmSync(dir, { recursive: true, force: true });
  });

  it("exchanges code with PKCE and stores tokens (fixture)", async () => {
    const { config, dir } = tempConfig();
    const { authorizeUrl } = await beginOAuth(config);
    expect(authorizeUrl).toContain("code_challenge=");
    expect(authorizeUrl).toContain("access_type=offline");
    expect(authorizeUrl).toContain(encodeURIComponent(config.scope));

    const pendingPath = path.join(dir, "oauth-pending.json");
    const pending = JSON.parse(readFileSync(pendingPath, "utf8")) as {
      state: string;
      codeVerifier: string;
    };

    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "access-1",
          refresh_token: "refresh-1",
          expires_in: 3600,
          token_type: "Bearer",
          scope: config.scope,
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const tokens = await completeOAuthCallback(config, {
      code: "auth-code",
      state: pending.state,
      error: null,
    });
    expect(tokens.access_token).toBe("access-1");
    expect(tokens.refresh_token).toBe("refresh-1");
    expect(existsSync(pendingPath)).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });

  it("refreshes access tokens using refresh_token", async () => {
    const { config, dir } = tempConfig();
    await saveTokens(dir, {
      access_token: "old",
      refresh_token: "refresh-1",
      expiry_date: Date.now() - 1000,
      updated_at: new Date().toISOString(),
    });

    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ access_token: "new-access", expires_in: 3600, token_type: "Bearer" }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const next = await refreshAccessToken(config, {
      access_token: "old",
      refresh_token: "refresh-1",
      expiry_date: Date.now() - 1000,
      updated_at: new Date().toISOString(),
    });
    expect(next.access_token).toBe("new-access");
    expect(next.refresh_token).toBe("refresh-1");
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("google reviews — setup route protection", () => {
  it("recognizes loopback hosts", () => {
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("growgreenweedcontrol.com")).toBe(false);
  });

  it("blocks public hosts without setup token", () => {
    const { config, dir } = tempConfig({
      GOOGLE_REVIEWS_SETUP_ENABLED: "false",
      GOOGLE_REVIEWS_SETUP_TOKEN: "secret-setup",
    });
    const req = new Request("https://growgreenweedcontrol.com/google-reviews/setup/");
    const url = new URL(req.url);
    expect(isSetupAccessAllowed(req, url, config)).toBe(false);

    const okReq = new Request("https://growgreenweedcontrol.com/google-reviews/setup/", {
      headers: { "x-ggwc-setup-token": "secret-setup" },
    });
    expect(isSetupAccessAllowed(okReq, url, config)).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it("allows localhost when setup enabled", () => {
    const { config, dir } = tempConfig();
    const req = new Request("http://localhost:4321/google-reviews/setup/");
    expect(isSetupAccessAllowed(req, new URL(req.url), config)).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("google reviews — cache expiry & unavailable states", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("treats soft TTL and hard max-age correctly", () => {
    const now = Date.now();
    const cache: ReviewsCache = {
      averageRating: 4.8,
      totalReviewCount: 42,
      reviews: [],
      fetchedAt: new Date(now - 1000).toISOString(),
      expiresAt: new Date(now - 500).toISOString(),
      hardExpiresAt: new Date(now + 60_000).toISOString(),
      accountId: "111",
      locationId: "222",
      order: "updateTime desc",
    };
    expect(isCacheFresh(cache, now)).toBe(false);
    expect(isCacheWithinHardLimit(cache, now)).toBe(true);
    cache.hardExpiresAt = new Date(now - 1).toISOString();
    expect(isCacheWithinHardLimit(cache, now)).toBe(false);
  });

  it("returns link-only payload when disconnected", async () => {
    const { config, dir } = tempConfig();
    const payload = await getDisplayReviews(config);
    expect(payload.available).toBe(false);
    expect(payload.reviews).toEqual([]);
    expect(payload.averageRating).toBeNull();
    expect(payload.googleProfileUrl).toContain("share.google");
    rmSync(dir, { recursive: true, force: true });
  });

  it("serves cached reviews and drops hard-expired cache", async () => {
    const { config, dir } = tempConfig();
    await saveTokens(dir, {
      access_token: "a",
      refresh_token: "r",
      expiry_date: Date.now() + 60_000,
      updated_at: new Date().toISOString(),
    });
    await saveSelection(dir, {
      accountName: "accounts/111",
      accountId: "111",
      locationName: "locations/222",
      locationId: "222",
      title: "Grow Green",
      selectedAt: new Date().toISOString(),
    });

    const fresh: ReviewsCache = {
      averageRating: 4.8,
      totalReviewCount: 42,
      reviews: [
        {
          reviewId: "r1",
          reviewerName: "Alex P.",
          starRating: 5,
          comment: "Showed up when promised.",
          createTime: "2026-01-10T15:00:00Z",
          updateTime: "2026-01-10T15:00:00Z",
        },
      ],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      hardExpiresAt: new Date(Date.now() + 120_000).toISOString(),
      accountId: "111",
      locationId: "222",
      order: "updateTime desc",
    };
    await saveCache(dir, fresh);
    const payload = await getDisplayReviews(config);
    expect(payload.available).toBe(true);
    expect(payload.averageRating).toBe(4.8);
    expect(payload.totalReviewCount).toBe(42);
    expect(payload.reviews[0]?.comment).toBe("Showed up when promised.");

    // Hard expiry forces removal.
    fresh.hardExpiresAt = new Date(Date.now() - 1000).toISOString();
    fresh.expiresAt = new Date(Date.now() - 1000).toISOString();
    await saveCache(dir, fresh);
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network");
    }) as typeof fetch;
    const empty = await getDisplayReviews(config);
    expect(empty.available).toBe(false);
    expect(await loadCache(dir)).toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });

  it("requires explicit location confirmation (does not auto-pick first)", async () => {
    const { config, dir } = tempConfig();
    const selection = await confirmLocationSelection(config, {
      accountId: "111",
      locationId: "333",
      title: "Other Location",
    });
    expect(selection.locationId).toBe("333");
    expect(selection.locationId).not.toBe("222");
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("google reviews — featured sample filter", () => {
  it("keeps only 5-star reviews that include a written comment", () => {
    const featured = selectFeaturedReviews(
      [
        {
          reviewId: "a",
          reviewerName: "A",
          starRating: 5,
          comment: "Great service.",
          createTime: "2026-01-01T00:00:00Z",
          updateTime: "2026-01-01T00:00:00Z",
        },
        {
          reviewId: "b",
          reviewerName: "B",
          starRating: 5,
          comment: "   ",
          createTime: "2026-01-01T00:00:00Z",
          updateTime: "2026-01-01T00:00:00Z",
        },
        {
          reviewId: "c",
          reviewerName: "C",
          starRating: 4,
          comment: "Solid work.",
          createTime: "2026-01-01T00:00:00Z",
          updateTime: "2026-01-01T00:00:00Z",
        },
        {
          reviewId: "d",
          reviewerName: "D",
          starRating: 5,
          comment: "",
          createTime: "2026-01-01T00:00:00Z",
          updateTime: "2026-01-01T00:00:00Z",
        },
      ],
      6,
    );
    expect(featured).toHaveLength(1);
    expect(featured[0]?.reviewId).toBe("a");
  });
});

describe("google reviews — safe rendering helpers", () => {
  it("fixture comments stay plain text when assigned via textContent semantics", () => {
    const comment = fixtures.listReviewsPage1.reviews[0].comment;
    const el = { textContent: "" as string };
    el.textContent = comment;
    expect(el.textContent).toBe(comment);
    expect(el.textContent).not.toContain("<div");
  });
});
