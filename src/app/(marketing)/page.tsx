import { db } from "@/lib/db";
import { getRecommendationsForProfile } from "@/lib/recommendations";
import { getCurrentUserProfile } from "@/lib/auth";
import { Hero } from "@/components/streamverse/hero";
import { ContentRow } from "@/components/streamverse/content-row";
import { HeroSkeleton } from "@/components/streamverse/loading-states";
import { Suspense } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

async function getHomeData() {
  const [
    banners,
    featured,
    trending,
    popularMovies,
    popularSeries,
    newReleases,
    recommended,
    recentlyAdded,
    genres,
    languages,
  ] = await Promise.all([
    db.banner.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" }, take: 5 }),
    db.movie.findFirst({ where: { status: "PUBLISHED", isFeatured: true }, orderBy: { publishedAt: "desc" }, include: { language: true, genres: true } }),
    db.movie.findMany({ where: { status: "PUBLISHED", isTrending: true }, take: 20, orderBy: { publishedAt: "desc" }, include: { language: true, genres: true } }),
    db.movie.findMany({ where: { status: "PUBLISHED", isPopular: true }, take: 20, orderBy: { publishedAt: "desc" }, include: { language: true, genres: true } }),
    db.series.findMany({ where: { status: "PUBLISHED", isPopular: true }, take: 20, orderBy: { publishedAt: "desc" }, include: { language: true, genres: true } }),
    db.movie.findMany({ where: { status: "PUBLISHED", isNewRelease: true }, take: 20, orderBy: { publishedAt: "desc" }, include: { language: true, genres: true } }),
    db.movie.findMany({ where: { status: "PUBLISHED", isRecommended: true }, take: 20, orderBy: { publishedAt: "desc" }, include: { language: true, genres: true } }),
    db.movie.findMany({ where: { status: "PUBLISHED" }, take: 20, orderBy: { publishedAt: "desc" }, include: { language: true, genres: true } }),
    db.genre.findMany({ orderBy: { name: "asc" } }),
    db.language.findMany({ orderBy: { name: "asc" } }),
  ]);

  let heroItem: any = null;
  if (banners.length > 0) {
    const top = banners[0];
    if (top.contentType === "movie" && top.contentId) {
      const m = await db.movie.findUnique({ where: { id: top.contentId }, include: { language: true } });
      if (m) {
        heroItem = {
          id: m.id,
          title: m.title,
          slug: m.slug,
          description: m.description,
          releaseYear: m.releaseYear,
          duration: m.duration,
          ageRating: m.ageRating,
          backdropUrl: top.imageUrl ?? m.backdropUrl,
          posterUrl: m.posterUrl,
          trailerUrl: top.videoUrl ?? m.trailerUrl,
          contentType: "movie" as const,
          languageName: m.language?.name,
        };
      }
    } else if (top.contentType === "series" && top.contentId) {
      const s = await db.series.findUnique({ where: { id: top.contentId }, include: { language: true } });
      if (s) {
        heroItem = {
          id: s.id,
          title: s.title,
          slug: s.slug,
          description: s.description,
          releaseYear: s.releaseYear,
          duration: null,
          ageRating: s.ageRating,
          backdropUrl: top.imageUrl ?? s.backdropUrl,
          posterUrl: s.posterUrl,
          trailerUrl: top.videoUrl ?? s.trailerUrl,
          contentType: "series" as const,
          languageName: s.language?.name,
        };
      }
    }
  }
  if (!heroItem && featured) {
    heroItem = {
      id: featured.id,
      title: featured.title,
      slug: featured.slug,
      description: featured.description,
      releaseYear: featured.releaseYear,
      duration: featured.duration,
      ageRating: featured.ageRating,
      backdropUrl: featured.backdropUrl,
      posterUrl: featured.posterUrl,
      trailerUrl: featured.trailerUrl,
      contentType: "movie" as const,
      languageName: featured.language?.name,
    };
  }

  return {
    hero: heroItem,
    trending: trending.map(toCard),
    popularMovies: popularMovies.map(toCard),
    popularSeries: popularSeries.map(toCardSeries),
    newReleases: newReleases.map(toCard),
    recommended: recommended.map(toCard),
    recentlyAdded: recentlyAdded.map(toCard),
    genres,
    languages,
  };
}

function toCard(m: any) {
  return {
    id: m.id,
    title: m.title,
    slug: m.slug,
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    releaseYear: m.releaseYear,
    duration: m.duration,
    description: m.description,
    contentType: "movie" as const,
    ageRating: m.ageRating,
    language: m.language,
  };
}

function toCardSeries(s: any) {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    posterUrl: s.posterUrl,
    backdropUrl: s.backdropUrl,
    releaseYear: s.releaseYear,
    duration: null,
    description: s.description,
    contentType: "series" as const,
    ageRating: s.ageRating,
    language: s.language,
  };
}

const FAQS = [
  {
    q: "What is StreamVerse?",
    a: "StreamVerse is an OTT streaming platform that lets you watch movies and series across multiple languages on any device — web, mobile, tablet, and TV. New content is added regularly.",
  },
  {
    q: "How much does StreamVerse cost?",
    a: "StreamVerse offers three plans — Free (ad-supported, limited catalog), Basic (HD streaming on 2 devices), and Premium (4K UHD on 4 devices with the full catalog). See the Plans page for current pricing.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from your account page. You'll keep access until the end of your billing period.",
  },
  {
    q: "What devices can I watch on?",
    a: "StreamVerse works in any modern browser, on phones, tablets, laptops, and desktops. A native mobile app and TV apps are on the roadmap.",
  },
  {
    q: "Is the content legally licensed?",
    a: "Yes. StreamVerse only hosts content that the platform owns, has licensed, or that is in the public domain. The development demo uses freely-redistributable test streams such as Big Buck Bunny and Sintel.",
  },
];

export default async function HomePage() {
  const data = await getHomeData();
  const profile = await getCurrentUserProfile();
  const recommendations = profile?.profile
    ? await getRecommendationsForProfile(profile.profile.id, 20)
    : [];

  return (
    <div className="-mt-16">
      <Suspense fallback={<HeroSkeleton />}>
        {data.hero ? <Hero data={data.hero} /> : <HeroSkeleton />}
      </Suspense>

      <div className="space-y-6 md:space-y-8 -mt-32 md:-mt-40 relative z-10">
        {data.trending.length > 0 && (
          <ContentRow title="Trending Now" items={data.trending} viewAllHref="/movies?filter=trending" />
        )}
        {data.popularMovies.length > 0 && (
          <ContentRow title="Popular Movies" items={data.popularMovies} viewAllHref="/movies?filter=popular" />
        )}
        {data.popularSeries.length > 0 && (
          <ContentRow
            title="Popular Series"
            items={data.popularSeries}
            viewAllHref="/series?filter=popular"
          />
        )}
        {data.newReleases.length > 0 && (
          <ContentRow title="New Releases" items={data.newReleases} viewAllHref="/movies?filter=new" />
        )}
        {recommendations.length > 0 && (
          <ContentRow title="Recommended For You" items={recommendations as any} />
        )}
        {data.recentlyAdded.length > 0 && (
          <ContentRow title="Recently Added" items={data.recentlyAdded} />
        )}

        <section className="container mx-auto px-4 lg:px-8 py-2">
          <h2 className="text-lg md:text-xl font-bold mb-3">Browse by Genre</h2>
          <div className="flex flex-wrap gap-2">
            {data.genres.map((g) => (
              <Link
                key={g.id}
                href={`/movies?genre=${g.slug}`}
                className="px-4 py-2 rounded-md bg-card border border-border text-sm hover:bg-accent hover:border-primary/40 transition-colors"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 lg:px-8 py-2">
          <h2 className="text-lg md:text-xl font-bold mb-3">Browse by Language</h2>
          <div className="flex flex-wrap gap-2">
            {data.languages.map((l) => (
              <Link
                key={l.id}
                href={`/movies?language=${l.slug}`}
                className="px-4 py-2 rounded-md bg-card border border-border text-sm hover:bg-accent hover:border-primary/40 transition-colors"
              >
                {l.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 lg:px-8 py-12">
          <div className="rounded-2xl bg-gradient-to-br from-primary/30 via-card to-card border border-border/60 p-6 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to start streaming?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join {APP_NAME} today. Pick a plan, create a profile, and start watching
              premium movies and series across multiple languages.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 rounded-md font-semibold text-sm"
              >
                Get started — it&apos;s free
              </Link>
              <Link
                href="/subscription"
                className="inline-flex items-center justify-center border border-border bg-card hover:bg-accent h-11 px-6 rounded-md font-semibold text-sm"
              >
                See plans
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="rounded-md bg-card border border-border p-4 group">
                <summary className="font-medium cursor-pointer flex items-center justify-between gap-4">
                  {faq.q}
                  <span className="text-muted-foreground text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
