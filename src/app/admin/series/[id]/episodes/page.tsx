"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Tv,
  MoreHorizontal,
  Clock,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/lib/api/client";
import { formatDuration } from "@/lib/constants";

interface Episode {
  id: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  description?: string | null;
  duration: number;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  hlsUrl?: string | null;
  videoProvider?: string | null;
  isPreview: boolean;
  releaseDate?: string | null;
}

interface Season {
  id: string;
  seriesId: string;
  seasonNumber: number;
  title?: string | null;
  description?: string | null;
  posterUrl?: string | null;
  releaseDate?: string | null;
  episodes?: Episode[];
}

interface SeriesDetail {
  id: string;
  title: string;
  slug: string;
  status: string;
  seasons?: Season[];
}

const PROVIDERS = ["demo", "mux", "s3", "external"] as const;

function SeasonForm({
  open,
  onOpenChange,
  seriesId,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seriesId: string;
  initial?: Season | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!initial;
  const [seasonNumber, setSeasonNumber] = useState<number>(initial?.seasonNumber ?? 1);
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [description, setDescription] = useState<string>(initial?.description ?? "");
  const [posterUrl, setPosterUrl] = useState<string>(initial?.posterUrl ?? "");
  const [releaseDate, setReleaseDate] = useState<string>(
    initial?.releaseDate ? initial.releaseDate.slice(0, 10) : "",
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        seriesId,
        seasonNumber,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        posterUrl: posterUrl.trim() || undefined,
        releaseDate: releaseDate || undefined,
      };
      if (isEdit && initial) {
        return apiPut(`/api/admin/seasons/${initial.id}`, payload);
      }
      return apiPost("/api/admin/seasons", payload);
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Season updated" : "Season added",
      });
      qc.invalidateQueries({ queryKey: ["admin", "series", seriesId] });
      onOpenChange(false);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Save failed", description: e.message }),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto sv-scroll">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit season" : "Add season"}</SheetTitle>
          <SheetDescription>
            Group episodes into a season.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seasonNumber">Season number *</Label>
            <Input
              id="seasonNumber"
              type="number"
              min={1}
              value={seasonNumber}
              onChange={(e) => setSeasonNumber(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seasonTitle">Title</Label>
            <Input
              id="seasonTitle"
              placeholder="e.g. Season 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seasonDescription">Description</Label>
            <Textarea
              id="seasonDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seasonPoster">Poster URL</Label>
            <Input
              id="seasonPoster"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seasonRelease">Release date</Label>
            <Input
              id="seasonRelease"
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
            />
          </div>
        </div>
        <SheetFooter className="px-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending} onClick={() => mutate()}>
            {isPending ? "Saving..." : isEdit ? "Save" : "Add season"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EpisodeForm({
  open,
  onOpenChange,
  seasonId,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seasonId: string | null;
  initial?: Episode | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!initial;

  const [episodeNumber, setEpisodeNumber] = useState<number>(initial?.episodeNumber ?? 1);
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [description, setDescription] = useState<string>(initial?.description ?? "");
  const [duration, setDuration] = useState<number>(initial?.duration ?? 1500);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(initial?.thumbnailUrl ?? "");
  const [videoUrl, setVideoUrl] = useState<string>(initial?.videoUrl ?? "");
  const [hlsUrl, setHlsUrl] = useState<string>(initial?.hlsUrl ?? "");
  const [videoProvider, setVideoProvider] = useState<string>(initial?.videoProvider ?? "demo");
  const [releaseDate, setReleaseDate] = useState<string>(
    initial?.releaseDate ? initial.releaseDate.slice(0, 10) : "",
  );
  const [isPreview, setIsPreview] = useState<boolean>(initial?.isPreview ?? false);
  const [skipIntroStart, setSkipIntroStart] = useState<number | "">("");
  const [skipIntroEnd, setSkipIntroEnd] = useState<number | "">("");

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!seasonId) return;
      const payload = {
        seasonId,
        episodeNumber,
        title: title.trim(),
        description: description.trim() || undefined,
        duration,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        hlsUrl: hlsUrl.trim() || undefined,
        videoProvider,
        releaseDate: releaseDate || undefined,
        isPreview,
        skipIntroStart: skipIntroStart === "" ? undefined : Number(skipIntroStart),
        skipIntroEnd: skipIntroEnd === "" ? undefined : Number(skipIntroEnd),
      };
      if (isEdit && initial) {
        return apiPut(`/api/admin/episodes/${initial.id}`, payload);
      }
      return apiPost("/api/admin/episodes", payload);
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Episode updated" : "Episode added",
      });
      qc.invalidateQueries({ queryKey: ["admin", "series-episodes"] });
      onOpenChange(false);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Save failed", description: e.message }),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto sv-scroll">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit episode" : "Add episode"}</SheetTitle>
          <SheetDescription>
            Add a single episode to a season.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="epNumber">Episode number *</Label>
            <Input
              id="epNumber"
              type="number"
              min={1}
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="epDuration">Duration (seconds) *</Label>
            <Input
              id="epDuration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">≈ {formatDuration(duration)}</p>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="epTitle">Title *</Label>
            <Input
              id="epTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The First Spark"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="epDescription">Description</Label>
            <Textarea
              id="epDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="epThumb">Thumbnail URL</Label>
            <Input
              id="epThumb"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="epProvider">Video provider</Label>
            <Select value={videoProvider} onValueChange={setVideoProvider}>
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
            <Label htmlFor="epVideo">Video URL (MP4)</Label>
            <Input
              id="epVideo"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="epHls">HLS URL</Label>
            <Input
              id="epHls"
              value={hlsUrl}
              onChange={(e) => setHlsUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="epRelease">Release date</Label>
            <Input
              id="epRelease"
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Skip intro</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="start (s)"
                value={skipIntroStart}
                onChange={(e) =>
                  setSkipIntroStart(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <span className="text-muted-foreground">→</span>
              <Input
                type="number"
                min={0}
                placeholder="end (s)"
                value={skipIntroEnd}
                onChange={(e) =>
                  setSkipIntroEnd(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-2 pt-2">
            <Checkbox
              id="epPreview"
              checked={isPreview}
              onCheckedChange={(v) => setIsPreview(v === true)}
            />
            <Label htmlFor="epPreview" className="cursor-pointer">
              Free preview (available without subscription)
            </Label>
          </div>
        </div>
        <SheetFooter className="px-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending || !seasonId}
            onClick={() => mutate()}
          >
            {isPending ? "Saving..." : isEdit ? "Save" : "Add episode"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminEpisodesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const seriesId = params.id;

  const { data: series, isLoading, isError, refetch } = useQuery<SeriesDetail>({
    queryKey: ["admin", "series", seriesId],
    queryFn: () => apiFetch<SeriesDetail>(`/api/admin/series/${seriesId}`),
  });

  const { data: seasonsData } = useQuery<{ items: Season[] }>({
    queryKey: ["admin", "series-episodes", seriesId],
    queryFn: () => apiFetch<{ items: Season[] }>(`/api/admin/series/${seriesId}/seasons`),
  });

  const seasons = useMemo(() => seasonsData?.items ?? [], [seasonsData]);

  const [seasonFormOpen, setSeasonFormOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [epFormOpen, setEpFormOpen] = useState(false);
  const [epSeasonId, setEpSeasonId] = useState<string | null>(null);
  const [editingEp, setEditingEp] = useState<Episode | null>(null);
  const [deleteEp, setDeleteEp] = useState<Episode | null>(null);
  const [deleteSeason, setDeleteSeason] = useState<Season | null>(null);

  const deleteEpMut = useMutation({
    mutationFn: (ep: Episode) => apiDelete(`/api/admin/episodes/${ep.id}`),
    onSuccess: () => {
      toast({ title: "Episode deleted" });
      qc.invalidateQueries({ queryKey: ["admin", "series-episodes"] });
      setDeleteEp(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  const deleteSeasonMut = useMutation({
    mutationFn: (s: Season) => apiDelete(`/api/admin/seasons/${s.id}`),
    onSuccess: () => {
      toast({ title: "Season deleted" });
      qc.invalidateQueries({ queryKey: ["admin", "series-episodes"] });
      setDeleteSeason(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push("/admin/series")}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back to series
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              {isLoading ? "Loading..." : series?.title ?? "Series"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage seasons and episodes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingSeason(null);
                setSeasonFormOpen(true);
              }}
            >
              <Plus className="size-4" /> Add season
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seasons</CardTitle>
          <CardDescription>
            {seasons.length} season{seasons.length === 1 ? "" : "s"} ·{" "}
            {seasons.reduce((acc, s) => acc + (s.episodes?.length ?? 0), 0)} episode
            {(seasons.reduce((acc, s) => acc + (s.episodes?.length ?? 0), 0)) === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : seasons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Tv className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold">No seasons yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Add a season to start organizing episodes.
              </p>
              <Button
                onClick={() => {
                  setEditingSeason(null);
                  setSeasonFormOpen(true);
                }}
              >
                <Plus className="size-4" /> Add season
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-2">
              {seasons
                .slice()
                .sort((a, b) => a.seasonNumber - b.seasonNumber)
                .map((season) => {
                  const eps = season.episodes ?? [];
                  return (
                    <AccordionItem
                      key={season.id}
                      value={season.id}
                      className="border border-border rounded-md px-3"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 pr-3">
                          <Badge variant="secondary">S{season.seasonNumber}</Badge>
                          <span className="font-medium">
                            {season.title ?? `Season ${season.seasonNumber}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {eps.length} ep{eps.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                          <p className="text-sm text-muted-foreground max-w-2xl">
                            {season.description ?? "No description"}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSeason(season);
                                setSeasonFormOpen(true);
                              }}
                            >
                              <Pencil className="size-3" /> Edit season
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEpSeasonId(season.id);
                                setEditingEp(null);
                                setEpFormOpen(true);
                              }}
                            >
                              <Plus className="size-3" /> Add episode
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteSeason(season)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto sv-scroll rounded-md border border-border">
                          <Table>
                            <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                              <TableHead className="pl-3 w-12">#</TableHead>
                              <TableHead>Title</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Provider</TableHead>
                              <TableHead>Preview</TableHead>
                              <TableHead className="pr-3 text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                              {eps.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                                    No episodes yet. Add the first one.
                                  </TableCell>
                                </TableRow>
                              )}
                              {eps
                                .slice()
                                .sort((a, b) => a.episodeNumber - b.episodeNumber)
                                .map((ep) => (
                                  <TableRow key={ep.id}>
                                    <TableCell className="pl-3 font-mono text-muted-foreground">
                                      E{ep.episodeNumber}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <PlayCircle className="size-4 text-muted-foreground" />
                                        <div>
                                          <div className="font-medium">{ep.title}</div>
                                          {ep.description && (
                                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                                              {ep.description}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="size-3" />
                                        {formatDuration(ep.duration)}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="font-normal">
                                        {ep.videoProvider ?? "demo"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {ep.isPreview ? (
                                        <Badge className="bg-chart-2/15 text-chart-2 border-transparent">
                                          Free
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="pr-3 text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="size-7">
                                            <MoreHorizontal className="size-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Episode</DropdownMenuLabel>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEpSeasonId(season.id);
                                              setEditingEp(ep);
                                              setEpFormOpen(true);
                                            }}
                                          >
                                            <Pencil className="size-4" /> Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() => setDeleteEp(ep)}
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
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <SeasonForm
        key={editingSeason?.id ?? "new-season"}
        open={seasonFormOpen}
        onOpenChange={setSeasonFormOpen}
        seriesId={seriesId}
        initial={editingSeason}
      />
      <EpisodeForm
        key={editingEp?.id ?? "new-episode"}
        open={epFormOpen}
        onOpenChange={setEpFormOpen}
        seasonId={epSeasonId}
        initial={editingEp}
      />

      <AlertDialog
        open={!!deleteEp}
        onOpenChange={(o) => !o && setDeleteEp(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this episode?</AlertDialogTitle>
            <AlertDialogDescription>
              Episode <strong>{deleteEp?.title}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteEp && deleteEpMut.mutate(deleteEp)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteSeason}
        onOpenChange={(o) => !o && setDeleteSeason(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this season?</AlertDialogTitle>
            <AlertDialogDescription>
              Season <strong>{deleteSeason?.title ?? deleteSeason?.seasonNumber}</strong> and
              all its episodes will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteSeason && deleteSeasonMut.mutate(deleteSeason)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between text-xs text-muted-foreground">
        <Link href="/admin/series" className="hover:text-foreground">
          ← All series
        </Link>
        <span>StreamVerse Admin</span>
      </div>
    </div>
  );
}
