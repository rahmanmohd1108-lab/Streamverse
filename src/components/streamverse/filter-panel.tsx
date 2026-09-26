"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export interface FilterState {
  genre?: string;
  language?: string;
  year?: string;
  sort?: string;
  filter?: string;
}

interface FilterPanelProps {
  genres: { id: string; name: string; slug: string }[];
  languages: { id: string; name: string; slug: string }[];
  current: FilterState;
  /** base path for browse links, e.g. "/movies" or "/series" */
  basePath: string;
  className?: string;
}

const YEARS = (() => {
  const now = new Date().getFullYear();
  const arr: number[] = [];
  for (let y = now; y >= 1990; y--) arr.push(y);
  return arr;
})();

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "title", label: "A → Z" },
];

const QUICK_FILTERS = [
  { value: "trending", label: "Trending" },
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
  { value: "featured", label: "Featured" },
];

/**
 * Reusable filter panel for movies / series browse pages.
 *
 * Filters are expressed entirely as URL query params — clicking a
 * pill changes the URL via router.push, which re-runs the Server
 * Component fetcher on the parent page.
 */
export function FilterPanel({
  genres,
  languages,
  current,
  basePath,
  className,
}: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = useCallback(
    (updates: FilterState) => {
      const next = new URLSearchParams(sp?.toString() || "");
      // Reset page when any filter changes
      next.delete("page");
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "" || v === null) {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      }
      const qsStr = next.toString();
      router.push(qsStr ? `${pathname}?${qsStr}` : pathname, { scroll: false });
    },
    [router, pathname, sp],
  );

  const clearAll = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilter = Boolean(
    current.genre || current.language || current.year || current.filter || current.sort,
  );

  // The big genre pill grid (also rendered inside the mobile sheet)
  const genreGrid = (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => update({ genre: undefined })}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
          !current.genre
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent",
        )}
      >
        All
      </button>
      {genres.map((g) => {
        const active = current.genre === g.slug;
        return (
          <button
            key={g.id}
            onClick={() => update({ genre: active ? undefined : g.slug })}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent",
            )}
          >
            {g.name}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className={cn("space-y-4", className)}>
      {/* Quick filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Quick:</span>
        {QUICK_FILTERS.map((f) => {
          const active = current.filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => update({ filter: active ? undefined : f.value })}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Genre pills — visible on md+ */}
      <div className="hidden md:block">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Genre
        </h3>
        {genreGrid}
      </div>

      {/* Language / year / sort — visible on md+ */}
      <div className="hidden md:grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
            Language
          </label>
          <Select
            value={current.language ?? "all"}
            onValueChange={(v) => update({ language: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any language</SelectItem>
              {languages.map((l) => (
                <SelectItem key={l.id} value={l.slug}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
            Year
          </label>
          <Select
            value={current.year ?? "all"}
            onValueChange={(v) => update({ year: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any year" />
            </SelectTrigger>
            <SelectContent className="max-h-72 sv-scroll">
              <SelectItem value="all">Any year</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
            Sort
          </label>
          <Select
            value={current.sort ?? "newest"}
            onValueChange={(v) => update({ sort: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile: Sheet trigger */}
      <div className="md:hidden flex items-center justify-between">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilter && (
                <span className="ml-1 inline-flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1">
                  {[
                    current.genre,
                    current.language,
                    current.year,
                    current.filter,
                    current.sort && current.sort !== "newest" ? current.sort : null,
                  ].filter(Boolean).length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] bg-background">
            <SheetTitle className="sr-only">Filters</SheetTitle>
            <div className="space-y-5 mt-2 max-h-full overflow-y-auto sv-scroll pb-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Genre
                </h3>
                {genreGrid}
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                    Language
                  </label>
                  <Select
                    value={current.language ?? "all"}
                    onValueChange={(v) => update({ language: v === "all" ? undefined : v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any language</SelectItem>
                      {languages.map((l) => (
                        <SelectItem key={l.id} value={l.slug}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                    Year
                  </label>
                  <Select
                    value={current.year ?? "all"}
                    onValueChange={(v) => update({ year: v === "all" ? undefined : v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 sv-scroll">
                      <SelectItem value="all">Any year</SelectItem>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                    Sort
                  </label>
                  <Select
                    value={current.sort ?? "newest"}
                    onValueChange={(v) => update({ sort: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasActiveFilter && (
                <Button variant="outline" className="w-full" onClick={clearAll}>
                  <X className="h-4 w-4 mr-2" /> Clear all filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
        {hasActiveFilter && (
          <Button asChild variant="ghost" size="sm" onClick={clearAll}>
            <span><X className="h-4 w-4 mr-1" /> Clear</span>
          </Button>
        )}
      </div>

      {/* Desktop clear */}
      {hasActiveFilter && (
        <div className="hidden md:block">
          <Link
            href={basePath}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear all filters
          </Link>
        </div>
      )}
    </aside>
  );
}
