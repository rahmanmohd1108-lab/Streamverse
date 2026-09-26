"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  SkipBack,
  Subtitles,
  Loader2,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/constants";
import { apiPost } from "@/lib/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubtitleTrack {
  label: string;
  srclang: string;
  src: string;
  kind: string;
}

interface VideoPlayerProps {
  src: string;
  hlsUrl?: string | null;
  poster?: string | null;
  title?: string;
  subtitleTracks?: SubtitleTrack[];
  startSeconds?: number;
  duration?: number;
  contentId?: string;
  contentType?: "movie" | "series" | "episode";
  episodeId?: string;
  onProgress?: (current: number, duration: number) => void;
  onComplete?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  skipIntroStart?: number | null;
  skipIntroEnd?: number | null;
}

export function VideoPlayer({
  src,
  hlsUrl,
  poster,
  title,
  subtitleTracks = [],
  startSeconds = 0,
  duration,
  contentId,
  contentType,
  episodeId,
  onProgress,
  onComplete,
  onNext,
  onPrev,
  skipIntroStart,
  skipIntroEnd,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(startSeconds || 0);
  const [dur, setDur] = useState(duration ?? 0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState<"auto" | "720p" | "1080p">("auto");
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHls, setIsHls] = useState(false);
  const [hlsInstance, setHlsInstance] = useState<any>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveRef = useRef<number>(0);
  const completedRef = useRef(false);

  // Load HLS.js dynamically if needed
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;
    const video = videoRef.current;
    // Native HLS support (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      setIsHls(true);
      return;
    }
    // Use hls.js
    let cancelled = false;
    import("hls.js").then((mod) => {
      if (cancelled || !videoRef.current) return;
      const Hls = mod.default;
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        setHlsInstance(hls);
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError("Unable to load stream. Please try again later.");
          }
        });
        setIsHls(true);
      }
    });
    return () => {
      cancelled = true;
      if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
      }
    };
     
  }, [hlsUrl]);

  // Initialize src (non-HLS)
  useEffect(() => {
    if (src && !hlsUrl && videoRef.current) {
      videoRef.current.src = src;
    }
  }, [src, hlsUrl]);

  // Restore start position
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !startSeconds) return;
    const onReady = () => {
      try {
        v.currentTime = startSeconds;
      } catch {}
    };
    if (v.readyState >= 1) onReady();
    else v.addEventListener("loadedmetadata", onReady, { once: true });
    return () => v.removeEventListener("loadedmetadata", onReady);
  }, [startSeconds]);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => {
      setCurrent(v.currentTime);
      if (v.duration) setDur(v.duration);
      onProgress?.(v.currentTime, v.duration || 0);

      // Save progress every 5 seconds
      const now = Date.now();
      if (now - lastSaveRef.current > 5000 && contentId && contentType) {
        lastSaveRef.current = now;
        apiPost("/api/history", {
          contentId,
          contentType,
          episodeId,
          progressSeconds: Math.floor(v.currentTime),
          durationSeconds: Math.floor(v.duration || 0),
          completed: v.duration > 0 && v.currentTime / v.duration > 0.9,
        }).catch(() => {});
      }

      // Mark completed
      if (
        v.duration > 0 &&
        v.currentTime / v.duration >= 0.9 &&
        !completedRef.current
      ) {
        completedRef.current = true;
        onComplete?.();
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onLoaded = () => {
      if (v.duration) setDur(v.duration);
    };
    const onError = () => setError("Failed to load video. The source may be unavailable.");

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("error", onError);
    };
  }, [contentId, contentType, episodeId, onProgress, onComplete]);

  // Auto-hide controls
  const showAndScheduleHide = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    showAndScheduleHide();
  }, [showAndScheduleHide]);

  // Keyboard controls
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case "ArrowRight":
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          break;
        case "ArrowUp":
          v.volume = Math.min(1, v.volume + 0.1);
          setVolume(v.volume);
          break;
        case "ArrowDown":
          v.volume = Math.max(0, v.volume - 0.1);
          setVolume(v.volume);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    };
    const c = containerRef.current;
    if (c) c.addEventListener("keydown", onKey);
    return () => {
      if (c) c.removeEventListener("keydown", onKey);
    };
  });

  // Fullscreen tracking
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const c = containerRef.current;
    if (!c) return;
    if (!document.fullscreenElement) c.requestFullscreen();
    else document.exitFullscreen();
  };

  const seek = (val: number[]) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = val[0];
    setCurrent(val[0]);
  };

  const changeRate = (rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleSubtitles = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!v.textTracks.length) {
      setSubtitlesOn(false);
      return;
    }
    const tracks = Array.from(v.textTracks);
    if (!subtitlesOn) {
      // Add track if not present
      if (subtitleTracks.length && !v.querySelector("track")) {
        for (const t of subtitleTracks) {
          const el = document.createElement("track");
          el.kind = t.kind;
          el.label = t.label;
          el.srclang = t.srclang;
          el.src = t.src;
          v.appendChild(el);
        }
      }
      tracks.forEach((tr) => (tr.mode = "showing"));
      setSubtitlesOn(true);
      setActiveSubtitle(tracks[0]?.language ?? "en");
    } else {
      tracks.forEach((tr) => (tr.mode = "hidden"));
      setSubtitlesOn(false);
      setActiveSubtitle(null);
    }
  };

  // Skip intro button
  const showSkipIntro =
    skipIntroStart != null &&
    skipIntroEnd != null &&
    current >= skipIntroStart &&
    current < skipIntroEnd;

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video overflow-hidden group"
      onMouseMove={showAndScheduleHide}
      onMouseLeave={() => playing && setShowControls(false)}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        className="w-full h-full object-contain bg-black"
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Buffering spinner */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-10 w-10 animate-spin text-white/80" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/60">
          <p className="text-sm text-white mb-2">{error}</p>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Reload
          </Button>
        </div>
      )}

      {/* Skip Intro */}
      {showSkipIntro && (
        <button
          onClick={() => {
            const v = videoRef.current;
            if (v && skipIntroEnd != null) v.currentTime = skipIntroEnd;
          }}
          className="absolute bottom-24 right-4 md:right-8 px-4 py-2 bg-white text-black font-semibold text-sm rounded-md hover:bg-white/90 transition-colors"
        >
          Skip Intro
        </button>
      )}

      {/* Close (mobile) */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 md:hidden z-20 p-2 rounded-full bg-black/50"
        aria-label="Back"
      >
        <X className="h-5 w-5 text-white" />
      </button>

      {/* Title */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <h2 className="text-white text-sm md:text-lg font-semibold">{title}</h2>
        </div>
      )}

      {/* Center play/pause */}
      {!playing && !buffering && !error && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <span className="rounded-full bg-black/40 p-4">
            <Play className="h-10 w-10 md:h-12 md:w-12 text-white" fill="currentColor" />
          </span>
        </button>
      )}

      {/* Bottom controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Progress bar */}
        <div className="flex items-center gap-3 text-white text-xs mb-2">
          <span className="w-12 tabular-nums">{formatDuration(current)}</span>
          <Slider
            value={[current]}
            max={dur || 1}
            step={1}
            onValueChange={seek}
            className="flex-1"
            aria-label="Seek"
          />
          <span className="w-12 tabular-nums text-right">{formatDuration(dur)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
            {onPrev && (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white" onClick={onPrev} aria-label="Previous episode">
                <SkipBack className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            {onNext && (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white" onClick={onNext} aria-label="Next episode">
                <SkipForward className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-1 ml-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
                {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[muted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={(v) => {
                  const val = v[0] / 100;
                  const vid = videoRef.current;
                  if (vid) {
                    vid.volume = val;
                    if (val > 0 && vid.muted) {
                      vid.muted = false;
                      setMuted(false);
                    }
                  }
                  setVolume(val);
                }}
                className="w-16 md:w-20"
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Subtitles */}
            {subtitleTracks.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 text-white", subtitlesOn && "bg-white/20")}
                onClick={toggleSubtitles}
                aria-label="Toggle subtitles"
              >
                <Subtitles className="h-5 w-5" />
              </Button>
            )}
            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-white" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <div className="px-2 py-1 text-xs text-muted-foreground">Playback speed</div>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => changeRate(r)}
                    className={playbackRate === r ? "bg-accent" : ""}
                  >
                    {r}x
                  </DropdownMenuItem>
                ))}
                {isHls && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1">Quality</div>
                    {["auto", "720p", "1080p"].map((q) => (
                      <DropdownMenuItem
                        key={q}
                        onClick={() => setQuality(q as any)}
                        className={quality === q ? "bg-accent" : ""}
                      >
                        {q}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
