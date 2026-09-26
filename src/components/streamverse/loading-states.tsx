import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("sv-shimmer rounded-md", className)} />;
}

export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md overflow-hidden border border-border/40">
          <LoadingSkeleton className="aspect-[2/3]" />
          <div className="p-2.5">
            <LoadingSkeleton className="h-4 w-3/4 mb-2" />
            <LoadingSkeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ContentRowSkeleton() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-2">
      <LoadingSkeleton className="h-7 w-48 mb-3" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shrink-0 w-[160px] md:w-[180px]">
            <LoadingSkeleton className="aspect-[2/3]" />
            <LoadingSkeleton className="h-4 w-3/4 mt-2 mb-1" />
            <LoadingSkeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] min-h-[480px]">
      <LoadingSkeleton className="absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
        <LoadingSkeleton className="h-12 w-2/3 mb-4" />
        <LoadingSkeleton className="h-4 w-1/3 mb-4" />
        <LoadingSkeleton className="h-20 w-full max-w-xl mb-6" />
        <div className="flex gap-3">
          <LoadingSkeleton className="h-12 w-32" />
          <LoadingSkeleton className="h-12 w-32" />
        </div>
      </div>
    </div>
  );
}
