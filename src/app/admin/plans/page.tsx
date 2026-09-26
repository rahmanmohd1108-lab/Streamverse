"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Crown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { slugify } from "@/lib/errors";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string;
  isPremium: boolean;
  active: boolean;
  createdAt?: string;
}

interface PlanFormState {
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingPeriod: "MONTHLY" | "YEARLY";
  features: string;
  isPremium: boolean;
  active: boolean;
}

const EMPTY: PlanFormState = {
  name: "",
  slug: "",
  price: 0,
  currency: "INR",
  billingPeriod: "MONTHLY",
  features: '["Feature one","Feature two"]',
  isPremium: false,
  active: true,
};

function toFormState(p: Plan): PlanFormState {
  return {
    name: p.name,
    slug: p.slug,
    price: p.price,
    currency: p.currency,
    billingPeriod: p.billingPeriod as "MONTHLY" | "YEARLY",
    features: p.features,
    isPremium: p.isPremium,
    active: p.active,
  };
}

function parseFeatures(input: string): string[] {
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fallthrough
  }
  return input
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: PlanFormState;
  isEdit: boolean;
  onSubmit: (values: PlanFormState) => void;
  pending: boolean;
}

function PlanFormDialog({
  open,
  onOpenChange,
  initial,
  isEdit,
  onSubmit,
  pending,
}: PlanFormDialogProps) {
  const [form, setForm] = useState<PlanFormState>(initial);

  const submit = () => {
    if (!form.name.trim()) return;
    let features = form.features;
    try {
      JSON.parse(features);
    } catch {
      features = JSON.stringify(parseFeatures(features));
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim() ? slugify(form.slug) : slugify(form.name),
      features,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit plan" : "Create plan"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the subscription plan."
              : "Configure a new plan for users."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Premium"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={slugify(form.name || "auto-slug")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm({ ...form, currency: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing">Billing period</Label>
              <Select
                value={form.billingPeriod}
                onValueChange={(v) =>
                  setForm({ ...form, billingPeriod: v as "MONTHLY" | "YEARLY" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="featuresHelp">Features (JSON array)</Label>
              <Textarea
                id="featuresHelp"
                rows={4}
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder='["HD streaming","2 devices"]'
              />
              <p className="text-xs text-muted-foreground">
                JSON array of strings. Use newline-separated values as fallback.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 rounded-md border border-border p-3">
            <label className="flex items-center justify-between gap-3 text-sm cursor-pointer">
              <span className="flex items-center gap-2">
                <Crown className="size-4 text-amber-400" />
                Premium plan
              </span>
              <Switch
                checked={form.isPremium}
                onCheckedChange={(v) => setForm({ ...form, isPremium: v })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm cursor-pointer">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400" />
                Active
              </span>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!form.name.trim() || pending} onClick={submit}>
            {pending
              ? "Saving..."
              : isEdit
                ? "Save"
                : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPlansPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Plan | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ items: Plan[] }>({
    queryKey: ["admin", "plans"],
    queryFn: () => apiFetch<{ items: Plan[] }>("/api/admin/plans"),
  });

  const saveMut = useMutation({
    mutationFn: (vars: { isEdit: boolean; id?: string; values: PlanFormState }) => {
      if (vars.isEdit && vars.id) {
        return apiPut(`/api/admin/plans/${vars.id}`, vars.values);
      }
      return apiPost("/api/admin/plans", vars.values);
    },
    onSuccess: (_data, vars) => {
      toast({ title: vars.isEdit ? "Plan updated" : "Plan created" });
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      setCreateOpen(false);
      setEditOpen(false);
      setEditItem(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Save failed", description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (p: Plan) => apiDelete(`/api/admin/plans/${p.id}`),
    onSuccess: () => {
      toast({ title: "Plan deleted" });
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  const toggleActiveMut = useMutation({
    mutationFn: (p: Plan) =>
      apiPut(`/api/admin/plans/${p.id}`, { active: !p.active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });

  const plans = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Plans</h1>
          <p className="text-sm text-muted-foreground">
            Subscription plans offered to users.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New plan
        </Button>
      </div>

      <Card>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Crown className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold">No plans yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Create subscription plans for users to upgrade to.
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> New plan
              </Button>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto sv-scroll">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="pl-6 min-w-[180px]">Plan</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p) => {
                    const feats = parseFeatures(p.features);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            {p.isPremium && (
                              <Crown className="size-4 text-amber-400" />
                            )}
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground">
                                /{p.slug}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {p.currency === "INR" ? "₹" : "$"}
                          {p.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {p.billingPeriod.toLowerCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {feats.slice(0, 3).map((f, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="font-normal"
                              >
                                {f}
                              </Badge>
                            ))}
                            {feats.length > 3 && (
                              <Badge variant="secondary">
                                +{feats.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={p.active}
                            onCheckedChange={() => toggleActiveMut.mutate(p)}
                          />
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
                                  setEditItem(p);
                                  setEditOpen(true);
                                }}
                              >
                                <Pencil className="size-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteTarget(p)}
                              >
                                <Trash2 className="size-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {createOpen && (
        <PlanFormDialog
          key="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          initial={EMPTY}
          isEdit={false}
          pending={saveMut.isPending}
          onSubmit={(values) =>
            saveMut.mutate({ isEdit: false, values })
          }
        />
      )}

      {editOpen && editItem && (
        <PlanFormDialog
          key={editItem.id}
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditItem(null);
          }}
          initial={toFormState(editItem)}
          isEdit
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
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be removed. Existing
              subscriptions referencing this plan will be orphaned.
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
