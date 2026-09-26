"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Film,
  Plus,
  Search,
  Pencil,
  Trash2,
  Globe,
  Star,
  Flame,
  TrendingUp,
  Sparkles,
  Eye,
  MoreHorizontal,
  Send,
  Archive,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { apiFetch, apiPost, apiPut, apiDelete, qs } from "@/lib/api/client";
import { slugify } from "@/lib/errors";
import { movieSchema } from "@/lib/validations";
import { AGE_RATINGS, formatDuration, formatViews } from "@/lib/constants";

interface Genre { id: string; name: string; }
interface Category { id: string; name: string; }
interface Language { id: string; name: string; }
interface MovieRow {
  id: string;
  title: string;
  slug: string;
  releaseYear: number;
  duration: number;
  ageRating: string;
  posterUrl?: string;
  status: string;
  isFeatured: boolean;
  isTrending: boolean;
  isPopular: boolean;
  isNewRelease: boolean;
  isRecommended: boolean;
  language?: { id: string; name: string } | null;
  videoProvider?: string | null;
  views?: number;
  createdAt: string;
}

interface MoviesResponse { items: MovieRow[]; total?: number }

type MovieFormValues = {
  title: string;
  slug?: string;
  description: string;
  releaseYear: number;
  duration: number;
  ageRating: string;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  videoUrl?: string;
  hlsUrl?: string;
  videoProvider: string;
  languageId?: string;
  country?: string;
  cast?: string;
  director?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  isTrending: boolean;
  isPopular: boolean;
  isNewRelease: boolean;
  isRecommended: boolean;
  genreIds: string[];
  categoryIds: string[];
};

const PROVIDERS = ["demo", "mux", "s3", "external"] as const;
const STATUSES: Array<"DRAFT" | "PUBLISHED" | "ARCHIVED"> = ["DRAFT", "PUBLISHED", "ARCHIVED"];

function StatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED") {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-transparent">Published</Badge>;
  }
  if (status === "ARCHIVED") {
    return <Badge variant="secondary" className="bg-muted text-muted-foreground">Archived</Badge>;
  }
  return <Badge variant="secondary">Draft</Badge>;
}

function FlagBadges({ row }: { row: MovieRow }) {
  return (
    <div className="flex flex-wrap gap-1">
      {row.isFeatured && (
        <Badge variant="outline" className="gap-1 text-amber-400 border-amber-500/30">
          <Star className="size-3" /> Featured
        </Badge>
      )}
      {row.isTrending && (
        <Badge variant="outline" className="gap-1 text-chart-3 border-chart-3/30">
          <Flame className="size-3" /> Trending
        </Badge>
      )}
      {row.isPopular && (
        <Badge variant="outline" className="gap-1 text-chart-2 border-chart-2/30">
          <TrendingUp className="size-3" /> Popular
        </Badge>
      )}
      {row.isNewRelease && (
        <Badge variant="outline" className="gap-1 text-chart-5 border-chart-5/30">
          <Sparkles className="size-3" /> New
        </Badge>
      )}
    </div>
  );
}

interface MovieFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MovieRow | null;
  genres: Genre[];
  categories: Category[];
  languages: Language[];
}

function MovieForm({ open, onOpenChange, initial, genres, categories, languages }: MovieFormProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!initial;

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      releaseYear: new Date().getFullYear(),
      duration: 600,
      ageRating: "ALL",
      posterUrl: "",
      backdropUrl: "",
      trailerUrl: "",
      videoUrl: "",
      hlsUrl: "",
      videoProvider: "demo",
      languageId: "",
      country: "",
      cast: "",
      director: "",
      status: "DRAFT",
      isFeatured: false,
      isTrending: false,
      isPopular: false,
      isNewRelease: false,
      isRecommended: false,
      genreIds: [],
      categoryIds: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      form.reset({
        title: initial.title,
        slug: initial.slug,
        description: "",
        releaseYear: initial.releaseYear,
        duration: initial.duration,
        ageRating: initial.ageRating,
        posterUrl: initial.posterUrl ?? "",
        backdropUrl: "",
        trailerUrl: "",
        videoUrl: "",
        hlsUrl: "",
        videoProvider: initial.videoProvider ?? "demo",
        languageId: initial.language?.id ?? "",
        country: "",
        cast: "",
        director: "",
        status: (initial.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") ?? "DRAFT",
        isFeatured: initial.isFeatured,
        isTrending: initial.isTrending,
        isPopular: initial.isPopular,
        isNewRelease: initial.isNewRelease,
        isRecommended: initial.isRecommended,
        genreIds: [],
        categoryIds: [],
      });
    } else {
      form.reset({
        title: "",
        slug: "",
        description: "",
        releaseYear: new Date().getFullYear(),
        duration: 600,
        ageRating: "ALL",
        posterUrl: "",
        backdropUrl: "",
        trailerUrl: "",
        videoUrl: "",
        hlsUrl: "",
        videoProvider: "demo",
        languageId: "",
        country: "",
        cast: "",
        director: "",
        status: "DRAFT",
        isFeatured: false,
        isTrending: false,
        isPopular: false,
        isNewRelease: false,
        isRecommended: false,
        genreIds: [],
        categoryIds: [],
      });
    }
  }, [open, initial, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: MovieFormValues) => {
      const payload = {
        ...values,
        slug: values.slug?.trim() ? slugify(values.slug) : slugify(values.title),
        genreIds: values.genreIds,
        categoryIds: values.categoryIds,
      };
      if (isEdit && initial) {
        return apiPut(`/api/admin/movies/${initial.id}`, payload);
      }
      return apiPost("/api/admin/movies", payload);
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Movie updated" : "Movie created",
        description: isEdit
          ? "Your changes have been saved."
          : "The movie was added to the catalog.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "movies"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Could not save movie",
        description: err.message,
      });
    },
  });

  const onSubmit = (values: MovieFormValues) => mutate(values);

  const titleValue = form.watch("title");
  const slugValue = form.watch("slug");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto sv-scroll">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit movie" : "Create movie"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update the movie catalog entry."
              : "Fill in the details to add a new movie."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 px-4 pb-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Crimson Frontier"
                {...form.register("title", { required: true })}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder={slugify(titleValue || "auto-slug")}
                {...form.register("slug")}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate from title.
              </p>
              {slugValue && (
                <p className="text-xs text-muted-foreground">
                  → /movie/{slugify(slugValue)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as MovieFormValues["status"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Synopsis..."
                {...form.register("description", { required: true })}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseYear">Release Year *</Label>
              <Input
                id="releaseYear"
                type="number"
                min={1888}
                max={new Date().getFullYear() + 5}
                {...form.register("releaseYear", { valueAsNumber: true, required: true })}
              />
              {form.formState.errors.releaseYear && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.releaseYear.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds) *</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                {...form.register("duration", { valueAsNumber: true, required: true })}
              />
              <p className="text-xs text-muted-foreground">
                ≈ {formatDuration(form.watch("duration") || 0)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageRating">Age Rating</Label>
              <Select
                value={form.watch("ageRating")}
                onValueChange={(v) => form.setValue("ageRating", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RATINGS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={form.watch("languageId") || ""}
                onValueChange={(v) => form.setValue("languageId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="e.g. India" {...form.register("country")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="director">Director</Label>
              <Input id="director" placeholder="Director name" {...form.register("director")} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="cast">Cast</Label>
              <Input
                id="cast"
                placeholder="Comma-separated cast list"
                {...form.register("cast")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posterUrl">Poster URL</Label>
              <Input id="posterUrl" placeholder="/posters/..." {...form.register("posterUrl")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backdropUrl">Backdrop URL</Label>
              <Input id="backdropUrl" placeholder="/posters/..." {...form.register("backdropUrl")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trailerUrl">Trailer URL</Label>
              <Input id="trailerUrl" placeholder="https://..." {...form.register("trailerUrl")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoProvider">Video Provider</Label>
              <Select
                value={form.watch("videoProvider")}
                onValueChange={(v) => form.setValue("videoProvider", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (MP4)</Label>
              <Input id="videoUrl" placeholder="https://..." {...form.register("videoUrl")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hlsUrl">HLS URL</Label>
              <Input id="hlsUrl" placeholder="https://...m3u8" {...form.register("hlsUrl")} />
            </div>
          </div>

          {/* Genres + categories */}
          <div className="space-y-3">
            <div>
              <Label className="mb-2 block">Genres</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto sv-scroll rounded-md border border-border p-3">
                {genres.map((g) => {
                  const checked = form.watch("genreIds")?.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const cur = form.getValues("genreIds") ?? [];
                          if (v) form.setValue("genreIds", [...cur, g.id]);
                          else
                            form.setValue(
                              "genreIds",
                              cur.filter((x) => x !== g.id),
                            );
                        }}
                      />
                      <span>{g.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Categories</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto sv-scroll rounded-md border border-border p-3">
                {categories.map((c) => {
                  const checked = form.watch("categoryIds")?.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const cur = form.getValues("categoryIds") ?? [];
                          if (v) form.setValue("categoryIds", [...cur, c.id]);
                          else
                            form.setValue(
                              "categoryIds",
                              cur.filter((x) => x !== c.id),
                            );
                        }}
                      />
                      <span>{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-md border border-border p-3">
            {([
              ["isFeatured", "Featured", Star],
              ["isTrending", "Trending", Flame],
              ["isPopular", "Popular", TrendingUp],
              ["isNewRelease", "New Release", Sparkles],
              ["isRecommended", "Recommended", Eye],
            ] as const).map(([key, label, Icon]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-2 text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </span>
                <Switch
                  checked={form.watch(key) as boolean}
                  onCheckedChange={(v) => form.setValue(key, v)}
                />
              </label>
            ))}
          </div>

          <SheetFooter className="mt-auto flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create movie"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminMoviesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MovieRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MovieRow | null>(null);

  const query = qs({ search, status });

  const { data, isLoading, isError, refetch } = useQuery<MoviesResponse>({
    queryKey: ["admin", "movies", search, status],
    queryFn: () => apiFetch<MoviesResponse>(`/api/admin/movies${query}`),
  });

  const { data: genresData } = useQuery<{ items: Genre[] }>({
    queryKey: ["genres"],
    queryFn: () => apiFetch<{ items: Genre[] }>("/api/genres"),
  });
  const { data: categoriesData } = useQuery<{ items: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ items: Category[] }>("/api/categories"),
  });
  const { data: languagesData } = useQuery<{ items: Language[] }>({
    queryKey: ["languages"],
    queryFn: () => apiFetch<{ items: Language[] }>("/api/languages"),
  });

  const genres = useMemo(() => genresData?.items ?? [], [genresData]);
  const categories = useMemo(() => categoriesData?.items ?? [], [categoriesData]);
  const languages = useMemo(() => languagesData?.items ?? [], [languagesData]);

  const publishMut = useMutation({
    mutationFn: (m: MovieRow) =>
      apiPost(`/api/admin/movies/${m.id}/publish`),
    onSuccess: () => {
      toast({ title: "Movie published" });
      qc.invalidateQueries({ queryKey: ["admin", "movies"] });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Publish failed", description: e.message }),
  });
  const unpublishMut = useMutation({
    mutationFn: (m: MovieRow) =>
      apiPost(`/api/admin/movies/${m.id}/unpublish`),
    onSuccess: () => {
      toast({ title: "Movie unpublished" });
      qc.invalidateQueries({ queryKey: ["admin", "movies"] });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Unpublish failed", description: e.message }),
  });
  const deleteMut = useMutation({
    mutationFn: (m: MovieRow) => apiDelete(`/api/admin/movies/${m.id}`),
    onSuccess: () => {
      toast({ title: "Movie deleted" });
      qc.invalidateQueries({ queryKey: ["admin", "movies"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  const rows = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Movies</h1>
          <p className="text-sm text-muted-foreground">
            Manage the film catalog.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Create movie
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status || "ALL"} onValueChange={(v) => setStatus(v === "ALL" ? "" : v)}>
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Film className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold">No movies yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                {search || status
                  ? "No movies match your filters."
                  : "Get started by creating your first movie."}
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> Create movie
              </Button>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto sv-scroll">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="pl-6 min-w-[200px]">Title</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-md overflow-hidden bg-muted shrink-0">
                            {m.posterUrl ? (
                               
                              <img
                                src={m.posterUrl}
                                alt={m.title}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="size-full grid place-items-center">
                                <Film className="size-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[260px]">
                              {m.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              /movie/{m.slug}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{m.releaseYear}</TableCell>
                      <TableCell>
                        {m.language ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Globe className="size-3 text-muted-foreground" />
                            {m.language.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(m.duration)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} />
                      </TableCell>
                      <TableCell>
                        <FlagBadges row={m} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.views ? formatViews(m.views) : "—"}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Row actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(m);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/movie/${m.slug}`} target="_blank" rel="noreferrer">
                                <ExternalLink className="size-4" /> View on site
                              </a>
                            </DropdownMenuItem>
                            {m.status === "PUBLISHED" ? (
                              <DropdownMenuItem
                                onClick={() => unpublishMut.mutate(m)}
                              >
                                <Archive className="size-4" /> Unpublish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => publishMut.mutate(m)}
                              >
                                <Send className="size-4" /> Publish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(m)}
                            >
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MovieForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        genres={genres}
        categories={categories}
        languages={languages}
      />
      <MovieForm
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editing}
        genres={genres}
        categories={categories}
        languages={languages}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this movie?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
