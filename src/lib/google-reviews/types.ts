/** Public display review (safe for browser). */
export type DisplayReview = {
  reviewId: string;
  reviewerName: string;
  starRating: number;
  comment: string;
  createTime: string;
  updateTime: string;
};

export type DisplayReviewsPayload = {
  ok: true;
  available: boolean;
  averageRating: number | null;
  totalReviewCount: number | null;
  order: "updateTime desc";
  reviews: DisplayReview[];
  googleProfileUrl: string;
  fetchedAt: string | null;
  cacheExpiresAt: string | null;
  sampleNote: string;
};

export type GoogleTokens = {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
  scope?: string;
  token_type?: string;
  updated_at: string;
};

export type LocationSelection = {
  accountName: string;
  accountId: string;
  locationName: string;
  locationId: string;
  title: string;
  storefrontAddress?: string;
  selectedAt: string;
};

export type ReviewsCache = {
  averageRating: number | null;
  totalReviewCount: number | null;
  reviews: DisplayReview[];
  fetchedAt: string;
  /** Soft TTL — refresh after this instant. */
  expiresAt: string;
  /** Absolute max retention (≤ 30 days from fetch). */
  hardExpiresAt: string;
  accountId: string;
  locationId: string;
  order: "updateTime desc";
};

export type GoogleAccount = {
  name: string;
  accountName: string;
  type?: string;
};

export type GoogleLocationOption = {
  name: string;
  title: string;
  storefrontAddress?: string;
  accountId: string;
  locationId: string;
};

/** Raw review shape from My Business API v4 (subset). */
export type GoogleApiReview = {
  reviewId?: string;
  name?: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
};

export type ListReviewsResponse = {
  reviews?: GoogleApiReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
};
