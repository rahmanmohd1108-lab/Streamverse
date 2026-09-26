"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trash2, Film } from "lucide-react";
import { MovieCard } from "@/components/streamverse/movie-card";
import { EmptyState } from "@/components/streamverse/empty-states";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiDelete } from "@/lib/api/client";

interface WatchlistEntry {
  id: string;
  contentId: string;
  contentType: "movie" | "series";
  createdAt: string;
  content: {
    id: string;
    title: string;
    slug: string;
    posterUrl: string | null;
    backdropUrl: string | null;
    releaseYear: number;
    duration?: number | null;
    description: string;
    ageRating?: string;
    language?: { name: string } | null;
    kind?: "movie" | "series";
  } | null;
}

interface WatchlistResponse {
  items: WatchlistEntry[];
}

export default function MyListPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery<{ user: { id: string } } | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const r = await fetch("/api/auth/me");
        if (!r.ok) return null;
        return r.json();
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login?redirect=/my-list");
    }
  }, [sessionLoading, session, router]);

  const { data, isLoading, isError } = useQuery<WatchlistResponse>({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const r = await fetch("/api/watchlist", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load watchlist");
      return r.json();
    },
    enabled: !!session,
  });

  const items = data?.items ?? [];
  const movies = items.filter((i) => i.contentType === "movie");
  const series = items.filter((i) => i.contentType === "series");

  const remove = async (entry: WatchlistEntry) => {
    if (!entry.content) return;
    try {
      await apiDelete(
        `/api/watchlist?contentId=${entry.content.id}&contentType=${entry.contentType}`,
      );
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      qc.invalidateQueries({
        queryKey: ["watchlist-status", entry.contentType, entry.content.id],
      });
      toast({ title: "Removed from My List" });
    } catch (e) {
      toast({
        title: "Couldn't remove",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  if (sessionLoading || !session) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 pb-20 md:pb-12">
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 pb-20 md:pb-12">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-2">
          <Bookmark className="h-7 w-7 text-primary" />
          My List
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items.length === 0
            ? "Your watchlist is empty."
            : `${items.length} title${items.length === 1 ? "" : "s"} saved`}
        </p>
      </header>

      {isError ? (
        <EmptyState
          title="Couldn't load your list"
          description="Please try again in a moment."
          actionHref="/my-list"
          actionLabel="Reload"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="film"
          title="Your list is empty"
          description="Add movies and series to your list to watch them later."
          actionHref="/movies"
          actionLabel="Browse movies"
        />
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              All <span className="ml-1 text-xs text-muted-foreground">{items.length}</span>
            </TabsTrigger>
            <TabsTrigger value="movies">
              Movies <span className="ml-1 text-xs text-muted-foreground">{movies.length}</span>
            </TabsTrigger>
            <TabsTrigger value="series">
              Series <span className="ml-1 text-xs text-muted-foreground">{series.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Grid items={items} onRemove={remove} />
          </TabsContent>
          <TabsContent value="movies" className="mt-6">
            <Grid items={movies} onRemove={remove} />
          </TabsContent>
          <TabsContent value="series" className="mt-6">
            <Grid items={series} onRemove={remove} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Grid({
  items,
  onRemove,
}: {
  items: WatchlistEntry[];
  onRemove: (entry: WatchlistEntry) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="film"
        title="Nothing here yet"
        description="Browse the catalog and add titles to your list."
        actionHref="/movies"
        actionLabel="Browse movies"
      />
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {items.map((entry) => {
        if (!entry.content) {
          // Content was deleted; render a placeholder card with a remove button.
          return (
            <div
              key={entry.id}
              className="relative rounded-md overflow-hidden border border-border/40 bg-card/60 aspect-[2/3] flex flex-col items-center justify-center p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">Content no longer available</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-destructive"
                onClick={() => onRemove(entry)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </div>
          );
        }
        return (
          <div key={entry.id} className="relative">
            <MovieCard
              item={{
                id: entry.content!.id,
                title: entry.content!.title,
                slug: entry.content!.slug,
                posterUrl: entry.content!.posterUrl,
                backdropUrl: entry.content!.backdropUrl,
                releaseYear: entry.content!.releaseYear,
                duration: entry.content!.duration ?? null,
                description: entry.content!.description,
                contentType: entry.contentType,
                ageRating: entry.content!.ageRating,
                language: entry.content!.language ?? undefined,
              }}
              showActions={false}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 z-10 bg-black/70 hover:bg-red-600"
              onClick={() => onRemove(entry)}
              aria-label="Remove from My List"
              title="Remove from My List"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
