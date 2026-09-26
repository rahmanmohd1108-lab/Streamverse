/**
 * StreamVerse App Constants
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "StreamVerse";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || "";

export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sports",
  "Thriller",
  "Western",
] as const;

export const LANGUAGES = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Malayalam",
  "Kannada",
  "Bengali",
  "Marathi",
  "Punjabi",
  "Urdu",
] as const;

export const CATEGORIES = [
  "Featured",
  "Trending",
  "Popular",
  "New Releases",
  "Recommended",
  "Top Movies",
  "Top Series",
  "Recently Added",
] as const;

export const AGE_RATINGS = ["ALL", "7+", "13+", "16+", "18+"] as const;

export const SUBSCRIPTION_PLANS = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    currency: "INR",
    billingPeriod: "MONTHLY",
    features: JSON.stringify([
      "Limited catalog access",
      "Standard definition streaming",
      "1 device at a time",
      "Ad-supported playback",
    ]),
    isPremium: false,
    active: true,
  },
  {
    name: "Basic",
    slug: "basic",
    price: 199,
    currency: "INR",
    billingPeriod: "MONTHLY",
    features: JSON.stringify([
      "HD streaming",
      "Selected catalog access",
      "2 devices simultaneously",
      "Ad-free experience",
      "Mobile + tablet + web",
    ]),
    isPremium: false,
    active: true,
  },
  {
    name: "Premium",
    slug: "premium",
    price: 649,
    currency: "INR",
    billingPeriod: "MONTHLY",
    features: JSON.stringify([
      "Full premium catalog",
      "4K UHD + HDR streaming",
      "4 devices simultaneously",
      "Ad-free experience",
      "Downloads on mobile",
      "All platforms supported",
    ]),
    isPremium: true,
    active: true,
  },
  {
    name: "Premium Annual",
    slug: "premium-annual",
    price: 6499,
    currency: "INR",
    billingPeriod: "YEARLY",
    features: JSON.stringify([
      "Everything in Premium",
      "17% savings vs monthly",
      "Priority customer support",
      "Early access to new releases",
    ]),
    isPremium: true,
    active: true,
  },
] as const;

export const CONTENT_ROW_LABELS = {
  trending: "Trending Now",
  popularMovies: "Popular Movies",
  popularSeries: "Popular Series",
  newReleases: "New Releases",
  recommended: "Recommended For You",
  continueWatching: "Continue Watching",
  topMovies: "Top Movies",
  topSeries: "Top Series",
  recentlyAdded: "Recently Added",
  byGenre: "Browse by Genre",
  byLanguage: "Browse by Language",
  featured: "Featured",
} as const;

/**
 * Public-domain / sample video assets used by the demo seed.
 * These are real, freely-redistributable test streams from the
 * Mux test stream collection and Google sample CDN. Safe to use for
 * demonstration purposes — no copyright involved.
 */
export const DEMO_VIDEOS = {
  movieHls:
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  movieMp4:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  shortMp4:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  trailerMp4:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
};

export const DEMO_POSTERS = {
  // Generated SVG posters (no external copyright images)
  base: "/posters",
};

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}
