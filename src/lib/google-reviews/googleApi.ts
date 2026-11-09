import type {
  GoogleAccount,
  GoogleApiReview,
  GoogleLocationOption,
  ListReviewsResponse,
} from "./types";

const ACCOUNTS_URL = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
const LOCATIONS_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const REVIEWS_BASE = "https://mybusiness.googleapis.com/v4";

export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

async function googleFetch(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  return res;
}

async function readJsonOrThrow(res: Response, label: string): Promise<unknown> {
  if (res.status === 429) {
    throw new GoogleApiError(`${label}: rate limited`, 429, true);
  }
  if (res.status === 401 || res.status === 403) {
    throw new GoogleApiError(`${label}: unauthorized`, res.status, false);
  }
  if (!res.ok) {
    throw new GoogleApiError(`${label}: HTTP ${res.status}`, res.status, res.status >= 500);
  }
  return res.json();
}

export async function listAccounts(accessToken: string): Promise<GoogleAccount[]> {
  const accounts: GoogleAccount[] = [];
  let pageToken = "";

  do {
    const url = new URL(ACCOUNTS_URL);
    url.searchParams.set("pageSize", "20");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await googleFetch(url.toString(), accessToken);
    const data = (await readJsonOrThrow(res, "accounts.list")) as {
      accounts?: Array<{ name?: string; accountName?: string; type?: string }>;
      nextPageToken?: string;
    };

    for (const a of data.accounts || []) {
      if (!a.name) continue;
      accounts.push({
        name: a.name,
        accountName: a.accountName || a.name,
        type: a.type,
      });
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return accounts;
}

/**
 * Business Information API requires readMask.
 * Location resource name is typically `locations/{locationId}` (not nested under account).
 */
export async function listLocations(
  accessToken: string,
  accountName: string,
): Promise<GoogleLocationOption[]> {
  const accountId = accountName.replace(/^accounts\//, "");
  const locations: GoogleLocationOption[] = [];
  let pageToken = "";

  do {
    const url = new URL(`${LOCATIONS_BASE}/accounts/${accountId}/locations`);
    url.searchParams.set("readMask", "name,title,storefrontAddress");
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await googleFetch(url.toString(), accessToken);
    const data = (await readJsonOrThrow(res, "locations.list")) as {
      locations?: Array<{
        name?: string;
        title?: string;
        storefrontAddress?: {
          addressLines?: string[];
          locality?: string;
          administrativeArea?: string;
          postalCode?: string;
        };
      }>;
      nextPageToken?: string;
    };

    for (const loc of data.locations || []) {
      if (!loc.name) continue;
      const locationId = loc.name.replace(/^locations\//, "");
      const addr = loc.storefrontAddress;
      const storefrontAddress = addr
        ? [
            ...(addr.addressLines || []),
            [addr.locality, addr.administrativeArea].filter(Boolean).join(", "),
            addr.postalCode,
          ]
            .filter(Boolean)
            .join(" · ")
        : undefined;

      locations.push({
        name: loc.name,
        title: loc.title || locationId,
        storefrontAddress,
        accountId,
        locationId,
      });
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return locations;
}

export function mapStarRating(value?: string): number {
  switch (value) {
    case "ONE":
    case "STAR_RATING_ONE":
      return 1;
    case "TWO":
    case "STAR_RATING_TWO":
      return 2;
    case "THREE":
    case "STAR_RATING_THREE":
      return 3;
    case "FOUR":
    case "STAR_RATING_FOUR":
      return 4;
    case "FIVE":
    case "STAR_RATING_FIVE":
      return 5;
    default:
      return 0;
  }
}

export function normalizeReview(raw: GoogleApiReview): {
  reviewId: string;
  reviewerName: string;
  starRating: number;
  comment: string;
  createTime: string;
  updateTime: string;
} | null {
  const reviewId =
    raw.reviewId ||
    (raw.name ? raw.name.split("/").pop() : "") ||
    "";
  if (!reviewId) return null;

  const anonymous = raw.reviewer?.isAnonymous === true;
  const reviewerName = anonymous
    ? "Google user"
    : (raw.reviewer?.displayName || "").trim() || "Google user";

  // Preserve review wording exactly — only coerce to plain string (never HTML).
  const comment = typeof raw.comment === "string" ? raw.comment : "";

  return {
    reviewId,
    reviewerName,
    starRating: mapStarRating(raw.starRating),
    comment,
    createTime: raw.createTime || "",
    updateTime: raw.updateTime || raw.createTime || "",
  };
}

/**
 * List reviews for a location. Uses Google-supplied averageRating / totalReviewCount.
 * orderBy defaults to updateTime desc (documented neutral display order).
 */
export async function listAllReviews(
  accessToken: string,
  accountId: string,
  locationId: string,
  options?: { maxPages?: number; pageSize?: number },
): Promise<{
  reviews: ReturnType<typeof normalizeReview>[];
  averageRating: number | null;
  totalReviewCount: number | null;
}> {
  const maxPages = options?.maxPages ?? 20;
  const pageSize = Math.min(options?.pageSize ?? 50, 50);
  const collected: NonNullable<ReturnType<typeof normalizeReview>>[] = [];
  let pageToken = "";
  let averageRating: number | null = null;
  let totalReviewCount: number | null = null;
  let pages = 0;

  do {
    const url = new URL(
      `${REVIEWS_BASE}/accounts/${accountId}/locations/${locationId}/reviews`,
    );
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("orderBy", "updateTime desc");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await googleFetch(url.toString(), accessToken);
    const data = (await readJsonOrThrow(res, "reviews.list")) as ListReviewsResponse;

    if (typeof data.averageRating === "number") averageRating = data.averageRating;
    if (typeof data.totalReviewCount === "number") totalReviewCount = data.totalReviewCount;

    for (const raw of data.reviews || []) {
      const n = normalizeReview(raw);
      if (n) collected.push(n);
    }

    pageToken = data.nextPageToken || "";
    pages += 1;
  } while (pageToken && pages < maxPages);

  return { reviews: collected, averageRating, totalReviewCount };
}
