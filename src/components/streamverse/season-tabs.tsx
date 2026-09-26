"use client";

import { cn } from "@/lib/utils";

interface Season {
  id: string;
  seasonNumber: number;
  title?: string | null;
}

interface SeasonTabsProps {
  seasons: Season[];
  activeSeasonId: string;
  onChange: (seasonId: string) => void;
  className?: string;
}

/**
 * Controlled season selector — renders as horizontal pill tabs on
 * desktop, horizontal scroll on mobile. Parent owns state.
 */
export function SeasonTabs({ seasons, activeSeasonId, onChange, className }: SeasonTabsProps) {
  if (!seasons || seasons.length === 0) return null;
  if (seasons.length === 1) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm font-semibold">
          {seasons[0].title || `Season ${seasons[0].seasonNumber}`}
        </span>
      </div>
    );
  }
  return (
    <div
      role="tablist"
      aria-label="Seasons"
      className={cn(
        "flex gap-2 overflow-x-auto no-scrollbar pb-1",
        className,
      )}
    >
      {seasons.map((s) => {
        const active = s.id === activeSeasonId;
        const label = s.title || `Season ${s.seasonNumber}`;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
