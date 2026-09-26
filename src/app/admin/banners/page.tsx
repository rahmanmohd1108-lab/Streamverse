"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/lib/api/client";

interface Banner {
  id: string;
  title: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  contentId?: string | null;
  contentType?: string | null;
  active: boolean;
  displayOrder: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
}

interface MovieRef { id: string; title: string; }
interface SeriesRef { id: string; title: string; }

interface BannerFormState {
  title: string;
  imageUrl: string;
  videoUrl: string;
  contentId: string;
  contentType: "movie" | "series" | "";
  active: boolean;
  displayOrder: number;
  startDate: string;
  endDate: string;
}

const EMPTY: BannerFormState = {
  title: "",
  imageUrl: "",
  videoUrl: "",
  contentId: "",
  contentType: "",
  active: true,
  displayOrder: 0,
  startDate: "",
  endDate: "",
};

function toFormState(b: Banner): BannerFormState {
  return {
    title: b.title,
    imageUrl: b.imageUrl ?? "",
    videoUrl: b.videoUrl ?? "",
    contentId: b.contentId ?? "",
    contentType: (b.contentType as "" | "movie" | "series") ?? "",
    active: b.active,
    displayOrder: b.displayOrder,
    startDate: b.startDate ? b.startDate.slice(0, 10) : "",
    endDate: b.endDate ? b.endDate.slice(0, 10) : "",
  };
}

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: BannerFormState;
  isEdit: boolean;
  movies: MovieRef[];
  series: SeriesRef[];
  onSubmit: (values: BannerFormState) => void;
  pending: boolean;
}

function BannerFormDialog({
  open,
  onOpenChange,
  initial,
  isEdit,
  movies,
  series,
  onSubmit,
  pending,
}: BannerFormDialogProps) {
  const [form, setForm] = useState<BannerFormState>(initial);

  const submit = () => {
    if (!form.title.trim()) return;
    onSubmit({
      ...form,
      title: form.title.trim(),
      imageUrl: form.imageUrl.trim(),
      videoUrl: form.videoUrl.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit banner" : "Create banner"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the banner settings."
              : "Configure a new homepage banner."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Spotlight: Crimson Frontier"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="/posters/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Link to content</Label>
              <Select
                value={form.contentType || "none"}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    contentType: v === "none" ? "" : (v as "movie" | "series"),
                    contentId: "",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link</SelectItem>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select title</Label>
              <Select
                value={form.contentId}
                onValueChange={(v) => setForm({ ...form, contentId: v })}
                disabled={!form.contentType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {form.contentType === "movie" &&
                    movies.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}
                      </SelectItem>
                    ))}
                  {form.contentType === "series" &&
                    series.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="order">Display order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({ ...form, displayOrder: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 cursor-pointer">
            <span className="text-sm">Active</span>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!form.title.trim() || pending} onClick={submit}>
            {pending ? "Saving..." : isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminBannersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Banner | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ items: Banner[] }>({
    queryKey: ["admin", "banners"],
    queryFn: () => apiFetch<{ items: Banner[] }>("/api/admin/banners"),
  });

  const { data: moviesData } = useQuery<{ items: MovieRef[] }>({
    queryKey: ["admin", "banners", "movies"],
    queryFn: () => apiFetch<{ items: MovieRef[] }>("/api/admin/movies?status=PUBLISHED"),
  });
  const { data: seriesData } = useQuery<{ items: SeriesRef[] }>({
    queryKey: ["admin", "banners", "series"],
    queryFn: () => apiFetch<{ items: SeriesRef[] }>("/api/admin/series?status=PUBLISHED"),
  });

  const movies = moviesData?.items ?? [];
  const series = seriesData?.items ?? [];

  const saveMut = useMutation({
    mutationFn: (vars: { isEdit: boolean; id?: string; values: BannerFormState }) => {
      const payload = {
        title: vars.values.title,
        imageUrl: vars.values.imageUrl || undefined,
        videoUrl: vars.values.videoUrl || undefined,
        contentId: vars.values.contentId || undefined,
        contentType: vars.values.contentType || undefined,
        active: vars.values.active,
        displayOrder: vars.values.displayOrder,
        startDate: vars.values.startDate || undefined,
        endDate: vars.values.endDate || undefined,
      };
      if (vars.isEdit && vars.id) {
        return apiPut(`/api/admin/banners/${vars.id}`, payload);
      }
      return apiPost("/api/admin/banners", payload);
    },
    onSuccess: (_data, vars) => {
      toast({ title: vars.isEdit ? "Banner updated" : "Banner created" });
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      setCreateOpen(false);
      setEditOpen(false);
      setEditItem(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Save failed", description: e.message }),
  });

  const toggleActiveMut = useMutation({
    mutationFn: (b: Banner) =>
      apiPut(`/api/admin/banners/${b.id}`, { active: !b.active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Toggle failed", description: e.message }),
  });

  const reorderMut = useMutation({
    mutationFn: ({ b, dir }: { b: Banner; dir: "up" | "down" }) => {
      const next = dir === "up" ? b.displayOrder - 1 : b.displayOrder + 1;
      return apiPut(`/api/admin/banners/${b.id}`, { displayOrder: next });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Reorder failed", description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (b: Banner) => apiDelete(`/api/admin/banners/${b.id}`),
    onSuccess: () => {
      toast({ title: "Banner deleted" });
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  const banners = (data?.items ?? []).slice().sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Banners</h1>
          <p className="text-sm text-muted-foreground">
            Spotlight titles on the homepage hero.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Create banner
        </Button>
      </div>

      <Card>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ImageIcon className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold">No banners yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Create a banner to spotlight a title on the homepage.
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> Create banner
              </Button>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto sv-scroll">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="pl-6 w-12">Order</TableHead>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((b, i) => (
                    <TableRow key={b.id}>
                      <TableCell className="pl-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            #{b.displayOrder}
                          </span>
                          <div className="flex gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-6"
                              disabled={i === 0}
                              onClick={() => reorderMut.mutate({ b, dir: "up" })}
                              aria-label="Move up"
                            >
                              <ArrowUp className="size-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-6"
                              disabled={i === banners.length - 1}
                              onClick={() => reorderMut.mutate({ b, dir: "down" })}
                              aria-label="Move down"
                            >
                              <ArrowDown className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{b.title}</div>
                        {b.videoUrl && (
                          <div className="text-xs text-muted-foreground">
                            Has video
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {b.contentType ? (
                          <Badge variant="outline" className="capitalize">
                            {b.contentType}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {b.imageUrl ? (
                          <img
                            src={b.imageUrl}
                            alt={b.title}
                            className="h-10 w-16 rounded object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => toggleActiveMut.mutate(b)}
                        >
                          {b.active ? (
                            <>
                              <Eye className="size-4 text-emerald-400" />
                              <span className="text-emerald-400">Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="size-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Hidden</span>
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.startDate || b.endDate ? (
                          <div>
                            {b.startDate && <div>From {b.startDate.slice(0, 10)}</div>}
                            {b.endDate && <div>Until {b.endDate.slice(0, 10)}</div>}
                          </div>
                        ) : (
                          "Always"
                        )}
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
                                setEditItem(b);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActiveMut.mutate(b)}>
                              {b.active ? (
                                <>
                                  <EyeOff className="size-4" /> Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="size-4" /> Show
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(b)}
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

      {createOpen && (
        <BannerFormDialog
          key="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          initial={EMPTY}
          isEdit={false}
          movies={movies}
          series={series}
          pending={saveMut.isPending}
          onSubmit={(values) => saveMut.mutate({ isEdit: false, values })}
        />
      )}

      {editOpen && editItem && (
        <BannerFormDialog
          key={editItem.id}
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditItem(null);
          }}
          initial={toFormState(editItem)}
          isEdit
          movies={movies}
          series={series}
          pending={saveMut.isPending}
          onSubmit={(values) =>
            saveMut.mutate({ isEdit: true, id: editItem.id, values })
          }
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.title}</strong> will be removed from the homepage.
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
