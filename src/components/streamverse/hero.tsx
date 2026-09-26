"use client";

import Link from "next/link";
import { Play, Info, Star, Plus, Check, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "@/lib/api/client";

interface HeroData {
  id: string;
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  duration?: number | null;
  ageRating?: string;
  backdropUrl?: string | null;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  contentType: "movie" | "series";
  rating?: number;
  languageName?: string;
}

interface HeroProps {
  data: HeroData;
  className?: string;
}

export function Hero({ data, className }: HeroProps) {
  const [muted, setMuted] = useState(true);
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const href = data.contentType === "movie" ? `/movie/${data.slug}` : `/series/${data.slug}`;

  useEffect(() => {
    const t = setTimeout(() => {
      if (data.trailerUrl) setTrailerPlaying(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [data.trailerUrl]);

  const { data: inWatchlist } = useQuery<boolean>({
    queryKey: ["watchlist-status", data.contentType, data.id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/watchlist/check?contentId=${data.id}&contentType=${data.contentType}`);
        if (!res.ok) return false;
        const j = await res.json();
        return j.inWatchlist === true;
      } catch {
        return false;
      }
    },
  });

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await apiDelete(`/api/watchlist?contentId=${data.id}&contentType=${data.contentType}`);
        toast({ title: "Removed from My List" });
      } else {
        await apiPost("/api/watchlist", { contentId: data.id, contentType: data.contentType });
        toast({ title: "Added to My List" });
      }
      qc.invalidateQueries({ queryKey: ["watchlist-status", data.contentType, data.id] });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Please sign in",
        variant: "destructive",
      });
    }
  };

  const toggleMute = () => {
    setMuted((m) => {
      const v = videoRef.current;
      if (v) v.muted = !m;
      return !m;
    });
  };

  return (
    <section className={cn("relative w-full h-[70vh] md:h-[85vh] min-h-[480px] overflow-hidden", className)}>
      {/* Background */}
      <div className="absolute inset-0">
        {data.backdropUrl && (
           
          <img
            src={data.backdropUrl}
            alt=""
            className="w-full h-full object-cover"
            priority
          />
        )}
        {trailerPlaying && data.trailerUrl && (
          <video
            ref={videoRef}
            src={data.trailerUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted={muted}
            loop
            playsInline
            poster={data.backdropUrl ?? undefined}
          />
        )}
        <div className="absolute inset-0 sv-hero-gradient" />
        <div className="absolute inset-0 sv-hero-bottom" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 lg:px-8 h-full flex flex-col justify-end pb-12 md:pb-20">
        <div className="max-w-2xl sv-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary/90 text-primary-foreground">
              {data.contentType === "movie" ? "Movie" : "Series"}
            </Badge>
            {data.ageRating && (
              <Badge variant="secondary" className="bg-black/40">{data.ageRating}</Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3">
            {data.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
            {data.rating ? (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {data.rating.toFixed(1)}
              </span>
            ) : null}
            <span>{data.releaseYear}</span>
            {data.duration ? <span>{formatDuration(data.duration)}</span> : null}
            {data.languageName ? <span>{data.languageName}</span> : null}
          </div>
          <p className="text-sm md:text-base text-muted-foreground line-clamp-3 mb-6 max-w-xl">
            {data.description}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href={href}>
                <Play className="h-5 w-5 mr-2" /> Play
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="bg-white/10 backdrop-blur">
              <Link href={href}>
                <Info className="h-5 w-5 mr-2" /> More Info
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="bg-white/10 backdrop-blur"
              onClick={toggleWatchlist}
            >
              {inWatchlist ? <Check className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              {inWatchlist ? "In My List" : "Add to List"}
            </Button>
            {data.trailerUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="rounded-full border border-border bg-black/30 backdrop-blur ml-auto"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
