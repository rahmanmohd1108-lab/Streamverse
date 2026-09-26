"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { qs } from "@/lib/api/client";

interface SearchBarProps {
  basePath?: string; // default "/search"
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** debounced update URL on type */
  liveUpdate?: boolean;
  /** extra params to preserve (e.g. type, genre) */
  extraParams?: Record<string, string | undefined>;
}

/**
 * Search input that updates the URL query on submit (or
 * debounced when liveUpdate is true).
 */
export function SearchBar({
  basePath = "/search",
  placeholder = "Search movies, series…",
  className,
  autoFocus = false,
  liveUpdate = true,
  extraParams,
}: SearchBarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp?.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [submitHover, setSubmitHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Debounced live update — pushes input → URL. We deliberately do NOT
  // sync URL → input back; doing so via an effect triggers the React
  // Compiler's set-state-in-effect rule and would also fight the user
  // while typing. The SearchBar re-mounts with the URL `q` as the
  // initial value when the user navigates (Next.js keyed navigation).
  useEffect(() => {
    if (!liveUpdate) return;
    const t = setTimeout(() => {
      const trimmed = value.trim();
      const urlQ = sp?.get("q") ?? "";
      if (trimmed === urlQ) return;
      const query = qs({ ...(extraParams || {}), q: trimmed || undefined });
      router.replace(`${basePath}${query}`, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [value, liveUpdate, sp, extraParams, basePath, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const query = qs({ ...(extraParams || {}), q: trimmed });
    router.push(`${basePath}${query}`);
  };

  return (
    <form onSubmit={onSubmit} className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className="pl-10 pr-10 h-12 text-base bg-card border-border"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-3 p-1 rounded-full hover:bg-accent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        className="sr-only"
        onMouseEnter={() => setSubmitHover(true)}
        onMouseLeave={() => setSubmitHover(false)}
      >
        {submitHover ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
      </Button>
    </form>
  );
}
