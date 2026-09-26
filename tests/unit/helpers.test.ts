/**
 * Unit tests for utility helpers.
 * Run: bun test
 */
import { test, expect } from "bun:test";
import { slugify } from "../../src/lib/errors";
import {
  formatDuration,
  formatViews,
  formatRelativeTime,
} from "../../src/lib/constants";

test("slugify converts plain text", () => {
  expect(slugify("Hello World")).toBe("hello-world");
  expect(slugify("Crimson Frontier")).toBe("crimson-frontier");
});

test("slugify strips special chars", () => {
  expect(slugify("Hello, World!")).toBe("hello-world");
  expect(slugify("Movie: The Sequel (2024)")).toBe("movie-the-sequel-2024");
});

test("slugify collapses multiple dashes", () => {
  expect(slugify("A   B   C")).toBe("a-b-c");
  expect(slugify("A-B--C")).toBe("a-b-c");
});

test("slugify trims and lowercases", () => {
  expect(slugify("  HELLO  ")).toBe("hello");
});

test("slugify truncates to 120 chars", () => {
  const long = "a".repeat(200);
  expect(slugify(long).length).toBeLessThanOrEqual(120);
});

test("formatDuration formats seconds", () => {
  expect(formatDuration(0)).toBe("0m");
  expect(formatDuration(60)).toBe("1m");
  expect(formatDuration(3600)).toBe("1h 0m");
  expect(formatDuration(5400)).toBe("1h 30m");
});

test("formatViews abbreviates large numbers", () => {
  expect(formatViews(1)).toBe("1");
  expect(formatViews(999)).toBe("999");
  expect(formatViews(1500)).toBe("1.5K");
  expect(formatViews(2_500_000)).toBe("2.5M");
});

test("formatRelativeTime returns recent for now", () => {
  const now = new Date();
  const result = formatRelativeTime(now);
  expect(result).toMatch(/m ago|h ago|d ago/);
});
