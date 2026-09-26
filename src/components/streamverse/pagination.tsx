import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** current page (1-based) */
  page: number;
  /** total items count */
  total: number;
  /** page size */
  pageSize: number;
  /** base path, e.g. "/movies" */
  basePath: string;
  /** current query string (without leading ?), preserved when navigating */
  searchParams: Record<string, string | string[] | undefined>;
  className?: string;
}

function buildHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      for (const x of v) sp.append(k, x);
    } else {
      sp.set(k, v);
    }
  }
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const qsStr = sp.toString();
  return qsStr ? `${basePath}?${qsStr}` : basePath;
}

function getPageRange(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | "...")[] = [];
  out.push(1);
  if (page > 4) out.push("...");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) out.push(i);
  if (page < totalPages - 3) out.push("...");
  out.push(totalPages);
  return out;
}

/**
 * Server-rendered URL-driven pagination for browse pages.
 * Each page link is an <a> with the appropriate ?page=N query string,
 * so it works with Server Components without any client-side state.
 */
export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  searchParams,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const pages = getPageRange(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1 py-8", className)}
    >
      {hasPrev ? (
        <Link
          href={buildHref(basePath, searchParams, page - 1)}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm hover:bg-accent"
          aria-label="Previous page"
        >
          ← Prev
        </Link>
      ) : (
        <span className="inline-flex h-9 items-center justify-center rounded-md border border-border/40 px-3 text-sm text-muted-foreground/60">
          ← Prev
        </span>
      )}

      <ul className="flex items-center gap-1 mx-2">
        {pages.map((p, i) =>
          p === "..." ? (
            <li key={`e-${i}`} className="px-2 text-muted-foreground text-sm">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={buildHref(basePath, searchParams, p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors",
                  p === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent",
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>

      {hasNext ? (
        <Link
          href={buildHref(basePath, searchParams, page + 1)}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm hover:bg-accent"
          aria-label="Next page"
        >
          Next →
        </Link>
      ) : (
        <span className="inline-flex h-9 items-center justify-center rounded-md border border-border/40 px-3 text-sm text-muted-foreground/60">
          Next →
        </span>
      )}
    </nav>
  );
}
