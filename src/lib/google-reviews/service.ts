import type { GoogleReviewsConfig } from "./config";
import { hasOAuthCredentials } from "./config";
import { GoogleApiError, listAllReviews, listAccounts, listLocations } from "./googleApi";
import { getValidAccessToken } from "./oauth";
import {
  clearAllGoogleReviewsData,
  clearCache,
  clearSelection,
  clearTokens,
  loadCache,
  loadSelection,
  loadTokens,
  saveCache,
  saveSelection,
} from "./storage";
import type {
  DisplayReview,
  DisplayReviewsPayload,
  GoogleLocationOption,
  LocationSelection,
  ReviewsCache,
} from "./types";

const SAMPLE_NOTE =
  "Sample of recent 5-star write-ups. Overall rating and total count come from Google.";

let refreshInFlight: Promise<ReviewsCache | null> | null = null;

/** Website sample: five-star reviews that include a real write-up (never star-only). */
export function selectFeaturedReviews(
  reviews: DisplayReview[],
  limit: number,
): DisplayReview[] {
  return reviews
    .filter((review) => review.starRating === 5 && review.comment.trim().length > 0)
    .slice(0, Math.max(0, limit));
}

function emptyPayload(config: GoogleReviewsConfig): DisplayReviewsPayload {
  return {
    ok: true,
    available: false,
    averageRating: null,
    totalReviewCount: null,
    order: "updateTime desc",
    reviews: [],
    googleProfileUrl: config.googleProfileUrl,
    fetchedAt: null,
    cacheExpiresAt: null,
    sampleNote: SAMPLE_NOTE,
  };
}

function cacheToPayload(
  config: GoogleReviewsConfig,
  cache: ReviewsCache,
): DisplayReviewsPayload {
  const featured = selectFeaturedReviews(cache.reviews, config.displayCount);
  return {
    ok: true,
    available: featured.length > 0,
    averageRating: cache.averageRating,
    totalReviewCount: cache.totalReviewCount,
    order: "updateTime desc",
    reviews: featured,
    googleProfileUrl: config.googleProfileUrl,
    fetchedAt: cache.fetchedAt,
    cacheExpiresAt: cache.expiresAt,
    sampleNote: SAMPLE_NOTE,
  };
}

export function isCacheFresh(cache: ReviewsCache, now = Date.now()): boolean {
  return new Date(cache.expiresAt).getTime() > now;
}

export function isCacheWithinHardLimit(cache: ReviewsCache, now = Date.now()): boolean {
  return new Date(cache.hardExpiresAt).getTime() > now;
}

export async function getAuthorizedAccessToken(config: GoogleReviewsConfig): Promise<string> {
  const tokens = await loadTokens(config.dataDir);
  if (!tokens) throw new Error("not_connected");
  const valid = await getValidAccessToken(config, tokens);
  return valid.access_token;
}

export async function discoverLocations(
  config: GoogleReviewsConfig,
): Promise<{ accounts: { name: string; accountName: string }[]; locations: GoogleLocationOption[] }> {
  const accessToken = await getAuthorizedAccessToken(config);
  const accounts = await listAccounts(accessToken);
  const locations: GoogleLocationOption[] = [];
  for (const account of accounts) {
    const locs = await listLocations(accessToken, account.name);
    locations.push(...locs);
  }
  return {
    accounts: accounts.map((a) => ({ name: a.name, accountName: a.accountName })),
    locations,
  };
}

export async function confirmLocationSelection(
  config: GoogleReviewsConfig,
  input: {
    accountId: string;
    locationId: string;
    title: string;
    storefrontAddress?: string;
  },
): Promise<LocationSelection> {
  if (!input.accountId || !input.locationId) {
    throw new Error("missing_ids");
  }
  const selection: LocationSelection = {
    accountName: `accounts/${input.accountId}`,
    accountId: input.accountId,
    locationName: `locations/${input.locationId}`,
    locationId: input.locationId,
    title: input.title,
    storefrontAddress: input.storefrontAddress,
    selectedAt: new Date().toISOString(),
  };
  await saveSelection(config.dataDir, selection);
  await clearCache(config.dataDir);
  return selection;
}

async function fetchAndStoreCache(config: GoogleReviewsConfig): Promise<ReviewsCache> {
  const selection = await loadSelection(config.dataDir);
  if (!selection) throw new Error("no_selection");

  const accessToken = await getAuthorizedAccessToken(config);
  const { reviews, averageRating, totalReviewCount } = await listAllReviews(
    accessToken,
    selection.accountId,
    selection.locationId,
  );

  const now = Date.now();
  const fetchedAt = new Date(now).toISOString();
  const cache: ReviewsCache = {
    averageRating,
    totalReviewCount,
    reviews: reviews.filter(Boolean) as ReviewsCache["reviews"],
    fetchedAt,
    expiresAt: new Date(now + config.cacheTtlSeconds * 1000).toISOString(),
    hardExpiresAt: new Date(now + config.cacheMaxAgeSeconds * 1000).toISOString(),
    accountId: selection.accountId,
    locationId: selection.locationId,
    order: "updateTime desc",
  };
  await saveCache(config.dataDir, cache);
  return cache;
}

/** Single-flight refresh to prevent concurrent Google API storms. */
export async function refreshReviewsCache(
  config: GoogleReviewsConfig,
): Promise<ReviewsCache | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      return await fetchAndStoreCache(config);
    } catch (err) {
      if (err instanceof GoogleApiError && (err.status === 401 || err.status === 403)) {
        await clearTokens(config.dataDir);
      }
      throw err;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Display payload for SSR / public API.
 * Uses temporary cache; refreshes when soft-TTL expired; drops content past hard 30-day limit.
 */
export async function getDisplayReviews(
  config: GoogleReviewsConfig,
): Promise<DisplayReviewsPayload> {
  if (!hasOAuthCredentials(config)) {
    return emptyPayload(config);
  }

  const selection = await loadSelection(config.dataDir);
  const tokens = await loadTokens(config.dataDir);
  if (!selection || !tokens) {
    return emptyPayload(config);
  }

  let cache = await loadCache(config.dataDir);

  if (cache && !isCacheWithinHardLimit(cache)) {
    await clearCache(config.dataDir);
    cache = null;
  }

  if (!cache || !isCacheFresh(cache)) {
    try {
      cache = await refreshReviewsCache(config);
    } catch {
      if (cache && isCacheWithinHardLimit(cache)) {
        return cacheToPayload(config, cache);
      }
      return emptyPayload(config);
    }
  }

  if (!cache) return emptyPayload(config);
  return cacheToPayload(config, cache);
}

export async function disconnectGoogleReviews(config: GoogleReviewsConfig): Promise<void> {
  await clearAllGoogleReviewsData(config.dataDir);
}

export async function getConnectionStatus(config: GoogleReviewsConfig): Promise<{
  configured: boolean;
  connected: boolean;
  hasRefreshToken: boolean;
  selection: LocationSelection | null;
  cache: { fetchedAt: string; expiresAt: string; hardExpiresAt: string; count: number } | null;
}> {
  const tokens = await loadTokens(config.dataDir);
  const selection = await loadSelection(config.dataDir);
  const cache = await loadCache(config.dataDir);
  return {
    configured: hasOAuthCredentials(config),
    connected: Boolean(tokens?.access_token),
    hasRefreshToken: Boolean(tokens?.refresh_token),
    selection,
    cache: cache
      ? {
          fetchedAt: cache.fetchedAt,
          expiresAt: cache.expiresAt,
          hardExpiresAt: cache.hardExpiresAt,
          count: cache.reviews.length,
        }
      : null,
  };
}

export { clearSelection, clearTokens, clearCache };
