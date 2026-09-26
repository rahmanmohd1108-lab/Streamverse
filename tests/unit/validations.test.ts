/**
 * Unit tests for the Zod validation schemas.
 * Run: bun test
 */
import { test, expect } from "bun:test";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  movieSchema,
  seriesSchema,
  episodeSchema,
  seasonSchema,
  genreSchema,
  languageSchema,
  searchQuerySchema,
  watchlistSchema,
  watchHistorySchema,
  ratingSchema,
} from "../../src/lib/validations";

test("registerSchema accepts valid input", () => {
  const parsed = registerSchema.parse({
    name: "Jane Doe",
    email: "jane@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  });
  expect(parsed.email).toBe("jane@example.com");
});

test("registerSchema rejects mismatched passwords", () => {
  expect(() =>
    registerSchema.parse({
      name: "Jane",
      email: "jane@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    }),
  ).toThrow();
});

test("registerSchema rejects short password", () => {
  expect(() =>
    registerSchema.parse({
      name: "Jane",
      email: "jane@example.com",
      password: "abc",
      confirmPassword: "abc",
    }),
  ).toThrow();
});

test("registerSchema rejects invalid email", () => {
  expect(() =>
    registerSchema.parse({
      name: "Jane",
      email: "not-an-email",
      password: "Password1",
      confirmPassword: "Password1",
    }),
  ).toThrow();
});

test("loginSchema accepts valid input", () => {
  const parsed = loginSchema.parse({
    email: "jane@example.com",
    password: "Password1",
    remember: true,
  });
  expect(parsed.remember).toBe(true);
});

test("loginSchema defaults remember to false", () => {
  const parsed = loginSchema.parse({
    email: "jane@example.com",
    password: "Password1",
  });
  expect(parsed.remember).toBe(false);
});

test("forgotPasswordSchema requires email", () => {
  expect(() => forgotPasswordSchema.parse({})).toThrow();
  expect(() => forgotPasswordSchema.parse({ email: "bad" })).toThrow();
  expect(forgotPasswordSchema.parse({ email: "good@example.com" }).email).toBe("good@example.com");
});

test("resetPasswordSchema requires matching passwords", () => {
  expect(() =>
    resetPasswordSchema.parse({
      token: "abc123def",
      password: "Password1",
      confirmPassword: "Password2",
    }),
  ).toThrow();
});

test("movieSchema accepts a minimal movie", () => {
  const parsed = movieSchema.parse({
    title: "Test Movie",
    description: "A test description",
    releaseYear: 2024,
    duration: 600,
  });
  expect(parsed.status).toBe("DRAFT");
  expect(parsed.isFeatured).toBe(false);
});

test("movieSchema rejects future year beyond +5", () => {
  expect(() =>
    movieSchema.parse({
      title: "Test",
      description: "Desc",
      releaseYear: new Date().getFullYear() + 10,
      duration: 600,
    }),
  ).toThrow();
});

test("seriesSchema accepts valid series", () => {
  const parsed = seriesSchema.parse({
    title: "Test Series",
    description: "A series",
    releaseYear: 2023,
  });
  expect(parsed.status).toBe("DRAFT");
});

test("episodeSchema accepts valid episode", () => {
  const parsed = episodeSchema.parse({
    seasonId: "abc",
    episodeNumber: 1,
    title: "Pilot",
    duration: 600,
  });
  expect(parsed.videoProvider).toBe("demo");
  expect(parsed.isPreview).toBe(false);
});

test("seasonSchema requires seriesId", () => {
  expect(() => seasonSchema.parse({ seasonNumber: 1 })).toThrow();
});

test("genreSchema accepts name", () => {
  expect(genreSchema.parse({ name: "Action" }).name).toBe("Action");
});

test("languageSchema accepts name", () => {
  expect(languageSchema.parse({ name: "English" }).name).toBe("English");
});

test("searchQuerySchema parses defaults", () => {
  const parsed = searchQuerySchema.parse({ q: "test" });
  expect(parsed.page).toBe(1);
  expect(parsed.limit).toBe(20);
  expect(parsed.sort).toBe("newest");
  expect(parsed.type).toBe("all");
});

test("searchQuerySchema rejects invalid year", () => {
  expect(() => searchQuerySchema.parse({ q: "test", year: "abc" })).toThrow();
});

test("searchQuerySchema rejects invalid minRating", () => {
  expect(() => searchQuerySchema.parse({ q: "test", minRating: "9" })).toThrow();
});

test("watchlistSchema requires contentType movie or series", () => {
  expect(() => watchlistSchema.parse({ contentId: "x", contentType: "episode" })).toThrow();
  expect(() => watchlistSchema.parse({ contentId: "x", contentType: "movie" })).not.toThrow();
});

test("watchHistorySchema accepts valid input", () => {
  const parsed = watchHistorySchema.parse({
    contentId: "x",
    contentType: "movie",
    progressSeconds: 60,
    durationSeconds: 600,
  });
  expect(parsed.completed).toBeUndefined();
});

test("ratingSchema requires rating 1-5", () => {
  expect(() => ratingSchema.parse({ contentId: "x", contentType: "movie", rating: 0 })).toThrow();
  expect(() => ratingSchema.parse({ contentId: "x", contentType: "movie", rating: 6 })).toThrow();
  expect(ratingSchema.parse({ contentId: "x", contentType: "movie", rating: 3 }).rating).toBe(3);
});
