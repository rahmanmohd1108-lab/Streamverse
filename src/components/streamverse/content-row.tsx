"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard, type ContentCardData } from "./movie-card";
import { cn } from "@/lib/utils";

interface ContentRowProps {
  title: string;
  items: ContentCardData[];
  viewAllHref?: string;
  className?: string;
}

export function ContentRow({ title, items, viewAllHref, className }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(items.length > 0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setCanLeft(el.scrollLeft > 8);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = dir === "left" ? -el.clientWidth * 0.85 : el.clientWidth * 0.85;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className={cn("relative py-2", className)}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-2">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all →
              </Link>
            )}
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => scroll("left")}
                disabled={!canLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => scroll("right")}
                disabled={!canRight}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-2 -mx-1 px-1"
        >
          {items.map((item) => (
            <div
              key={`${item.contentType}-${item.id}`}
              className="shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
            >
              <MovieCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
