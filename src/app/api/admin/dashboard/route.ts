import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const admin = await requireAdmin();
  void admin;

  const now = new Date();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    users,
    activeUsers,
    moviesCount,
    seriesCount,
    episodesCount,
    watchTimeAgg,
    subscriptionsCount,
    revenueAgg,
    viewsCount,
    recentUsers,
    recentViews,
    topContentView,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: last7d } } }),
    db.movie.count(),
    db.series.count(),
    db.episode.count(),
    db.watchHistory.aggregate({
      where: { lastWatchedAt: { gte: last30d } },
      _sum: { progressSeconds: true },
    }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    db.contentView.count({ where: { startedAt: { gte: last30d } } }),
    db.user.findMany({
      where: { createdAt: { gte: last14d } },
      select: { createdAt: true },
    }),
    db.contentView.findMany({
      where: { startedAt: { gte: last14d } },
      select: { startedAt: true },
    }),
    db.contentView.groupBy({
      by: ["contentId", "contentType"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Build usersByDay and viewsByDay
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    days.push(
      dayKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)),
    );
  }

  const usersByDay = days.map((date) => ({
    date,
    count: recentUsers.filter((u) => dayKey(u.createdAt) === date).length,
  }));
  const viewsByDay = days.map((date) => ({
    date,
    count: recentViews.filter((v) => dayKey(v.startedAt) === date).length,
  }));

  // Hydrate topContent with titles
  const topContent = await Promise.all(
    topContentView.map(async (row) => {
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
      return {
        contentId: row.contentId,
        contentType: row.contentType,
        title,
        slug,
        views: row._count.id,
      };
    }),
  );

  return apiSuccess({
    counts: {
      users,
      activeUsers,
      totalContent: moviesCount + seriesCount,
      movies: moviesCount,
      series: seriesCount,
      episodes: episodesCount,
      watchTime: watchTimeAgg._sum.progressSeconds ?? 0,
      subscriptions: subscriptionsCount,
      revenue: revenueAgg._sum.amount ?? 0,
      views: viewsCount,
    },
    charts: {
      viewsByDay,
      topContent,
      usersByDay,
    },
  });
});
