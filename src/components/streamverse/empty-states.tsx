import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Film, RefreshCw, SearchX } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: "film" | "search" | "default";
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon = "default",
  className,
}: EmptyStateProps) {
  const Icon = icon === "film" ? Film : icon === "search" ? SearchX : Film;
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
      <Icon className="h-12 w-12 text-muted-foreground mb-4" aria-hidden />
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      )}
      {actionHref && actionLabel && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content right now.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
      <RefreshCw className="h-10 w-10 text-destructive mb-4" aria-hidden />
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Try again
        </Button>
      )}
    </div>
  );
}
