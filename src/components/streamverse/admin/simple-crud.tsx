"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/lib/api/client";
import { slugify } from "@/lib/errors";

export interface SimpleItem {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
}

export interface SimpleCrudProps {
  resource: "genres" | "categories" | "languages";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  apiBase: string; // e.g. /api/admin/genres
}

interface FormValues {
  name: string;
  slug: string;
}

function CrudFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
  pending,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial: SimpleItem | null;
  onSubmit: (values: FormValues) => void;
  pending: boolean;
  mode: "create" | "edit";
}) {
  // Initialize state from `initial` once per mount. We rely on the parent
  // passing a `key` (initial.id or "new") so the form re-mounts and resets
  // when switching between create/edit targets.
  const [name, setName] = useState<string>(initial?.name ?? "");
  const [slug, setSlug] = useState<string>(initial?.slug ?? "");

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name, slug });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit" : "Create"}{" "}
            {title.replace(/s$/, "").toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the name or slug."
              : `Add a new ${title.replace(/s$/, "").toLowerCase()} to the catalog.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Documentary"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={slugify(name || "auto-slug")}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate from name.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || pending} onClick={submit}>
            {pending
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save"
                : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SimpleCrud({
  resource,
  title,
  description,
  icon: Icon,
  apiBase,
}: SimpleCrudProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<SimpleItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SimpleItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ items: SimpleItem[] }>({
    queryKey: ["admin", resource],
    queryFn: () => apiFetch<{ items: SimpleItem[] }>(apiBase),
  });

  const createMut = useMutation({
    mutationFn: (vars: FormValues) =>
      apiPost(apiBase, {
        name: vars.name.trim(),
        slug: vars.slug.trim() ? slugify(vars.slug) : slugify(vars.name),
      }),
    onSuccess: () => {
      toast({ title: `${title.replace(/s$/, "")} created` });
      qc.invalidateQueries({ queryKey: ["admin", resource] });
      setCreateOpen(false);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Create failed", description: e.message }),
  });

  const updateMut = useMutation({
    mutationFn: (vars: FormValues) =>
      apiPut(`${apiBase}/${editItem?.id}`, {
        name: vars.name.trim(),
        slug: vars.slug.trim() ? slugify(vars.slug) : slugify(vars.name),
      }),
    onSuccess: () => {
      toast({ title: "Updated" });
      qc.invalidateQueries({ queryKey: ["admin", resource] });
      setEditOpen(false);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Update failed", description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (item: SimpleItem) => apiDelete(`${apiBase}/${item.id}`),
    onSuccess: () => {
      toast({ title: "Deleted" });
      qc.invalidateQueries({ queryKey: ["admin", resource] });
      setDeleteTarget(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  const items = data?.items ?? [];
  const filtered = search.trim()
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.slug.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New {title.replace(/s$/, "").toLowerCase()}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icon className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold">Nothing here yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                {search
                  ? `No ${title.toLowerCase()} match your search.`
                  : `Create your first ${title.replace(/s$/, "").toLowerCase()}.`}
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> New {title.replace(/s$/, "").toLowerCase()}
              </Button>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto sv-scroll">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="pl-6 min-w-[240px]">Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {item.slug}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditItem(item);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(item)}
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

      {/* Create dialog */}
      {createOpen && (
        <CrudFormDialog
          key="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          title={title}
          initial={null}
          mode="create"
          pending={createMut.isPending}
          onSubmit={(vals) => createMut.mutate(vals)}
        />
      )}

      {/* Edit dialog */}
      {editOpen && editItem && (
        <CrudFormDialog
          key={editItem.id}
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditItem(null);
          }}
          title={title}
          initial={editItem}
          mode="edit"
          pending={updateMut.isPending}
          onSubmit={(vals) => updateMut.mutate(vals)}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {title.replace(/s$/, "").toLowerCase()}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently removed.
              Content using it will lose the reference.
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
