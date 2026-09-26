/**
 * StreamVerse Recommendation Engine (MVP, deterministic)
 *
 * Signals used:
 *   - profile watch history (genres & languages of watched content)
 *   - profile watchlist (genres & languages of saved content)
 *   - profile ratings (liked genres)
 *   - global popularity (view counts)
 *
 * For each candidate (movie/series) we compute a simple weighted score:
 *
 *   score = 3 * genreMatch + 2 * languageMatch + 1 * ratingAffinity
 *           + 2 * popularityRank + 1 * isNewRelease
 *
 * This is a transparent rules-based scorer — easy to replace later
 * with an embedding/ML model. Documented in docs/ARCHITECTURE.md.
 */
import { db } from "@/lib/db";

interface RecoCandidate {
  id: string;
  title: string;
  slug: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number;
  description: string;
  score: number;
  contentType: "movie" | "series";
  languageId: string | null;
  duration?: number | null;
}

export async function getRecommendationsForProfile(
  profileId: string,
  limit = 20,
): Promise<RecoCandidate[]> {
  // Pull signals: history, watchlist, ratings
  const [history, watchlist, ratings] = await Promise.all([
    db.watchHistory.findMany({
      where: { profileId },
      select: {
        contentId: true,
        contentType: true,
        progressSeconds: true,
        completed: true,
      },
    }),
    db.watchlist.findMany({
      where: { profileId },
      select: { contentId: true, contentType: true },
    }),
    db.rating.findMany({
      where: { profileId, rating: { gte: 4 } },
      select: { contentId: true, contentType: true },
    }),
  ]);

  // Pull genres/languages for all referenced content
  const contentIds = Array.from(
    new Set([
      ...history.map((h) => h.contentId),
      ...watchlist.map((w) => w.contentId),
      ...ratings.map((r) => r.contentId),
    ]),
  );

  if (contentIds.length === 0) {
    // Cold-start: fall back to trending/popular content
    const popular = await db.movie.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isTrending: "desc" }, { isPopular: "desc" }],
      take: limit,
    });
    const popularSeries = await db.series.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isTrending: "desc" }, { isPopular: "desc" }],
      take: limit,
    });
    return [
      ...popular.map((m) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        releaseYear: m.releaseYear,
        description: m.description,
        score: 10,
        contentType: "movie" as const,
        languageId: m.languageId,
        duration: m.duration,
      })),
      ...popularSeries.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        posterUrl: s.posterUrl,
        backdropUrl: s.backdropUrl,
        releaseYear: s.releaseYear,
        description: s.description,
        score: 10,
        contentType: "series" as const,
        languageId: s.languageId,
        duration: null,
      })),
    ].slice(0, limit);
  }

  // Collect preferred genres & languages
  const [movies, series] = await Promise.all([
    db.movie.findMany({
      where: { id: { in: contentIds } },
      select: { id: true, genres: { select: { id: true } }, languageId: true },
    }),
    db.series.findMany({
      where: { id: { in: contentIds } },
      select: { id: true, genres: { select: { id: true } }, languageId: true },
    }),
  ]);

  const genreSet = new Set<string>();
  const languageSet = new Set<string>();
  for (const m of movies) {
    m.genres.forEach((g) => genreSet.add(g.id));
    if (m.languageId) languageSet.add(m.languageId);
  }
  for (const s of series) {
    s.genres.forEach((g) => genreSet.add(g.id));
    if (s.languageId) languageSet.add(s.languageId);
  }

  // Pull candidate pool: published content not yet watched
  const watchedIds = new Set(history.map((h) => h.contentId));
  const candidateMovies = await db.movie.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: [...watchedIds] },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      releaseYear: true,
      posterUrl: true,
      backdropUrl: true,
      duration: true,
      languageId: true,
      isNewRelease: true,
      isPopular: true,
      isTrending: true,
      genres: { select: { id: true } },
    },
    take: 200,
  });
  const candidateSeries = await db.series.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: [...watchedIds] },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      releaseYear: true,
      posterUrl: true,
      backdropUrl: true,
      languageId: true,
      isNewRelease: true,
      isPopular: true,
      isTrending: true,
      genres: { select: { id: true } },
    },
    take: 200,
  });

  const scored: RecoCandidate[] = [];
  const score = (g: { id: string }[], lang: string | null, flags: { isNewRelease: boolean, isPopular: boolean, isTrending: boolean }) => {
    const genreMatches = g.filter((x) => genreSet.has(x.id)).length;
    const languageMatch = lang && languageSet.has(lang) ? 1 : 0;
    const popularityRank =
      (flags.isTrending ? 1 : 0) +
      (flags.isPopular ? 1 : 0) +
      (flags.isNewRelease ? 1 : 0);
    return (
      3 * genreMatches +
      2 * languageMatch +
      2 * popularityRank +
      (flags.isNewRelease ? 1 : 0)
    );
  };

  for (const m of candidateMovies) {
    scored.push({
      id: m.id,
      title: m.title,
      slug: m.slug,
      posterUrl: m.posterUrl,
      backdropUrl: m.backdropUrl,
      releaseYear: m.releaseYear,
      description: m.description,
      score: score(m.genres, m.languageId, {
        isNewRelease: m.isNewRelease,
        isPopular: m.isPopular,
        isTrending: m.isTrending,
      }),
      contentType: "movie",
      languageId: m.languageId,
      duration: m.duration,
    });
  }
  for (const s of candidateSeries) {
    scored.push({
      id: s.id,
      title: s.title,
      slug: s.slug,
      posterUrl: s.posterUrl,
      backdropUrl: s.backdropUrl,
      releaseYear: s.releaseYear,
      description: s.description,
      score: score(s.genres, s.languageId, {
        isNewRelease: s.isNewRelease,
        isPopular: s.isPopular,
        isTrending: s.isTrending,
      }),
      contentType: "series",
      languageId: s.languageId,
      duration: null,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
