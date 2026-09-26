/**
 * Integration tests for the StreamVerse API.
 *
 * These hit the running dev server at http://localhost:3000.
 * They're skipped automatically if the server isn't reachable.
 *
 * Run: bun test tests/integration/api.test.ts
 */
import { test, expect, describe } from "bun:test";

const BASE = process.env.TEST_API_URL || "http://localhost:3000";

async function skipIfNoServer() {
  try {
    await fetch(`${BASE}/api/genres`, { signal: AbortSignal.timeout(2000) });
    return false;
  } catch {
    return true;
  }
}

const shouldSkip = await skipIfNoServer();

describe.skipIf(shouldSkip)("StreamVerse API integration", () => {
  test("GET /api/genres returns 200 with items", async () => {
    const res = await fetch(`${BASE}/api/genres`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0]).toHaveProperty("id");
    expect(data.items[0]).toHaveProperty("name");
    expect(data.items[0]).toHaveProperty("slug");
  });

  test("GET /api/languages returns 10+ languages", async () => {
    const res = await fetch(`${BASE}/api/languages`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBeGreaterThanOrEqual(10);
  });

  test("GET /api/movies returns published movies", async () => {
    const res = await fetch(`${BASE}/api/movies`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBeGreaterThan(0);
    for (const m of data.items) {
      expect(m.status).toBe("PUBLISHED");
    }
  });

  test("GET /api/movies/:slug returns full movie", async () => {
    const list = await fetch(`${BASE}/api/movies`).then((r) => r.json());
    const slug = list.items[0].slug;
    const res = await fetch(`${BASE}/api/movies/${slug}`);
    expect(res.status).toBe(200);
    const movie = await res.json();
    expect(movie).toHaveProperty("movie");
    expect(movie.movie.slug).toBe(slug);
    expect(movie.movie.genres).toBeDefined();
    expect(movie.movie.language).toBeDefined();
  });

  test("GET /api/movies/unknown-slug returns 404", async () => {
    const res = await fetch(`${BASE}/api/movies/this-slug-does-not-exist-12345`);
    expect(res.status).toBe(404);
  });

  test("GET /api/series returns published series", async () => {
    const res = await fetch(`${BASE}/api/series`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBeGreaterThan(0);
  });

  test("GET /api/series/:slug returns series with seasons", async () => {
    const list = await fetch(`${BASE}/api/series`).then((r) => r.json());
    const slug = list.items[0].slug;
    const res = await fetch(`${BASE}/api/series/${slug}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.series).toBeDefined();
    expect(Array.isArray(data.series.seasons)).toBe(true);
  });

  test("GET /api/plans returns subscription plans", async () => {
    const res = await fetch(`${BASE}/api/plans`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBeGreaterThanOrEqual(3);
  });

  test("GET /api/banners returns banners", async () => {
    const res = await fetch(`${BASE}/api/banners`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("GET /api/search returns results", async () => {
    const res = await fetch(`${BASE}/api/search?q=crimson`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.movies.length + data.series.length).toBeGreaterThan(0);
  });

  test("GET /api/search with empty q returns 422", async () => {
    const res = await fetch(`${BASE}/api/search`);
    expect(res.status).toBe(422);
  });

  test("GET /api/watchlist without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/watchlist`);
    expect(res.status).toBe(401);
  });

  test("GET /api/history without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/history`);
    expect(res.status).toBe(401);
  });

  test("GET /api/admin/dashboard without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/admin/dashboard`);
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/login with bad credentials returns 401", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@example.com", password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/login as admin succeeds", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@streamverse.local",
        password: "admin12345",
        remember: false,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.role).toBe("ADMIN");

    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("sv_session=");

    const sessionCookie = cookie!.split(";")[0];

    const dashRes = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: { Cookie: sessionCookie },
    });
    expect(dashRes.status).toBe(200);
    const dash = await dashRes.json();
    expect(dash.counts).toBeDefined();
    expect(dash.charts).toBeDefined();
    expect(dash.counts.users).toBeGreaterThan(0);
    expect(dash.counts.movies).toBeGreaterThan(0);
  });
});
