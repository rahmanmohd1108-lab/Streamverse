import type { Metadata } from "next";
import Link from "next/link";
import { getGenres } from "@/lib/api/server";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Browse by Genre",
  description: `Explore the ${APP_NAME} catalog by genre — Action, Comedy, Drama, Sci-Fi and more.`,
};

export default async function GenresPage() {
  const genres = await getGenres();

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 pb-20 md:pb-12">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Browse by Genre</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {genres.length} genres to explore
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {genres.map((g) => (
          <Link
            key={g.id}
            href={`/movies?genre=${g.slug}`}
            className="sv-card-lift relative aspect-[4/3] rounded-lg overflow-hidden border border-border/40 bg-gradient-to-br from-primary/30 via-card to-card p-5 flex flex-col justify-end hover:border-primary/60"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary to-transparent" />
            <div className="relative">
              <h2 className="text-lg font-bold">{g.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">Browse →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
