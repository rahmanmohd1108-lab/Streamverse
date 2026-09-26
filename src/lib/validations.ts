/**
 * StreamVerse Zod Validation Schemas
 *
 * Reused across client forms and server API routes to keep a single
 * source of truth for request shape.
 */
import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Za-z]/, "Must include a letter")
  .regex(/[0-9]/, "Must include a number");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(1).max(60),
  avatar: z.string().optional(),
  language: z.string().min(2).max(8).default("en"),
  maturityLevel: z
    .enum(["ALL", "7+", "13+", "16+", "18+"])
    .default("ALL"),
  isKids: z.boolean().default(false),
});

export const movieSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000),
  releaseYear: z.number().int().min(1888).max(new Date().getFullYear() + 5),
  duration: z.number().int().min(1),
  ageRating: z.string().default("ALL"),
  posterUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  hlsUrl: z.string().optional(),
  videoProvider: z.string().default("demo"),
  languageId: z.string().optional(),
  country: z.string().optional(),
  cast: z.string().optional(),
  director: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isNewRelease: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  genreIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  publishedAt: z.string().optional(),
});

export const seriesSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000),
  releaseYear: z.number().int().min(1888).max(new Date().getFullYear() + 5),
  posterUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  languageId: z.string().optional(),
  ageRating: z.string().default("ALL"),
  country: z.string().optional(),
  cast: z.string().optional(),
  director: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isNewRelease: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  genreIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  publishedAt: z.string().optional(),
});

export const seasonSchema = z.object({
  seriesId: z.string().min(1),
  seasonNumber: z.number().int().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  posterUrl: z.string().optional(),
  releaseDate: z.string().optional(),
});

export const episodeSchema = z.object({
  seasonId: z.string().min(1),
  episodeNumber: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  duration: z.number().int().min(1),
  thumbnailUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  hlsUrl: z.string().optional(),
  videoProvider: z.string().default("demo"),
  releaseDate: z.string().optional(),
  isPreview: z.boolean().default(false),
  skipIntroStart: z.number().int().optional(),
  skipIntroEnd: z.number().int().optional(),
});

export const genreSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
});

export const languageSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
});

export const bannerSchema = z.object({
  title: z.string().min(1).max(200),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  contentId: z.string().optional(),
  contentType: z.enum(["movie", "series"]).optional(),
  active: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const watchlistSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(["movie", "series"]),
});

export const watchHistorySchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(["movie", "series", "episode"]),
  episodeId: z.string().optional(),
  progressSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(0),
  completed: z.boolean().optional(),
});

export const ratingSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(["movie", "series"]),
  rating: z.number().int().min(1).max(5),
});

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default("INR"),
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  features: z.string(),
  isPremium: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["movie", "series", "all"]).optional().default("all"),
  genre: z.string().optional(),
  language: z.string().optional(),
  year: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), "Year must be 4 digits"),
  minRating: z
    .string()
    .optional()
    .refine((v) => !v || /^[1-5]$/.test(v), "Rating must be 1-5"),
  sort: z
    .enum(["newest", "oldest", "rating", "popular", "title"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MovieInput = z.infer<typeof movieSchema>;
export type SeriesInput = z.infer<typeof seriesSchema>;
export type EpisodeInput = z.infer<typeof episodeSchema>;
export type SeasonInput = z.infer<typeof seasonSchema>;
