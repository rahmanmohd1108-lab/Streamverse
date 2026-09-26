import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  await requireAdmin();
  const now = new Date();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Try AnalyticsEvent table for richer signals, fall back to ContentView/WatchHistory.
  const [
    analyticsEvents,
    contentViews,
    watchHistory,
    watchCompleteEvents,
    searchEvents,
    watchlistAddEvents,
    genresAgg,
  ] = await Promise.all([
    db.analyticsEvent.findMany({
      where: { createdAt: { gte: last30d } },
      select: {
        eventType: true,
        createdAt: true,
        contentId: true,
        contentType: true,
        metadata: true,
      },
    }),
    db.contentView.findMany({
      where: { startedAt: { gte: last30d } },
      select: { startedAt: true, contentId: true, contentType: true },
    }),
    db.watchHistory.findMany({
      where: { lastWatchedAt: { gte: last30d } },
      select: {
        lastWatchedAt: true,
        progressSeconds: true,
        contentId: true,
        contentType: true,
      },
    }),
    db.analyticsEvent.findMany({
      where: { eventType: "watch_complete", createdAt: { gte: last30d } },
    }),
    db.analyticsEvent.findMany({
      where: { eventType: "search", createdAt: { gte: last30d } },
    }),
    db.analyticsEvent.findMany({
      where: { eventType: "watchlist_add", createdAt: { gte: last30d } },
    }),
    db.movie.findMany({
      select: {
        id: true,
        genres: { select: { id: true, name: true } },
      },
    }),
  ]);

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const last30Days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    last30Days.push(dayKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)));
  }
  const last14Days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    last14Days.push(dayKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)));
  }

  // viewsByDay: prefer ContentView.startedAt
  const viewsByDay = last30Days.map((date) => ({
    date,
    count: contentViews.filter((v) => dayKey(v.startedAt) === date).length,
  }));

  // topContent (top 10 by ContentView count)
  const topMap = new Map<string, { contentId: string; contentType: string; count: number }>();
  for (const v of contentViews) {
    const key = `${v.contentType}:${v.contentId}`;
    const row = topMap.get(key);
    if (row) row.count += 1;
    else topMap.set(key, { contentId: v.contentId, contentType: v.contentType!, count: 1 });
  }
  const topRaw = [...topMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  // hydrate titles
  const topContent = await Promise.all(
    topRaw.map(async (row) => {
      let title: string | null = null;
      let slug: string | null = null;
      if (row.contentType === "movie") {
        const m = await db.movie.findUnique({
          where: { id: row.contentId },
          select: { title: true, slug: true },
        });
        title = m?.title ?? null;
        slug = m?.slug ?? null;
      } else if (row.contentType === "series") {
        const s = await db.series.findUnique({
          where: { id: row.contentId },
          select: { title: true, slug: true },
        });
        title = s?.title ?? null;
        slug = s?.slug ?? null;
      }
      return { ...row, title, slug };
    }),
  );

  // watchTimeByGenre: sum of progressSeconds bucketed by movie genre
  const genreMap = new Map<string, { genre: string; seconds: number }>();
  for (const wh of watchHistory) {
    const movie = genresAgg.find((m) => m.id === wh.contentId);
    const genres = movie?.genres ?? [];
    if (genres.length === 0) {
      const row = genreMap.get("Unknown") ?? { genre: "Unknown", seconds: 0 };
      row.seconds += wh.progressSeconds;
      genreMap.set("Unknown", row);
    } else {
      for (const g of genres) {
        const row = genreMap.get(g.name) ?? { genre: g.name, seconds: 0 };
        row.seconds += wh.progressSeconds;
        genreMap.set(g.name, row);
      }
    }
  }
  const watchTimeByGenre = [...genreMap.values()].sort(
    (a, b) => b.seconds - a.seconds,
  );

  // searchesByDay
  const searchSource = searchEvents.length > 0 ? searchEvents : [];
  const searchesByDay = last14Days.map((date) => ({
    date,
    count: searchSource.filter((e) => dayKey(e.createdAt) === date).length,
  }));

  // watchlistAddsByDay
  const watchlistSource = watchlistAddEvents;
  const watchlistAddsByDay = last14Days.map((date) => ({
    date,
    count: watchlistSource.filter((e) => dayKey(e.createdAt) === date).length,
  }));

  // Also derive watchlist adds from db.watchlist (last 14d) if no events:
  if (watchlistSource.length === 0) {
    const recentAdditions = await db.watchlist.findMany({
      where: { createdAt: { gte: last14d } },
      select: { createdAt: true },
    });
    watchlistAddsByDay.forEach((row, idx) => {
      row.count = recentAdditions.filter((w) => dayKey(w.createdAt) === row.date).length;
      void idx;
    });
  }

  // also pull searches from Notification (none) — leave as is.

  void analyticsEvents;
  void watchCompleteEvents;
  void last14Days;

  return apiSuccess({
    viewsByDay,
    topContent,
    watchTimeByGenre,
    searchesByDay,
    watchlistAddsByDay,
  });
});
