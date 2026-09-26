"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  CreditCard,
  MoreHorizontal,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { apiFetch, qs } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/constants";

interface UserRef { id: string; name: string; email: string; }
interface PlanRef { id: string; name: string; price: number; currency: string; billingPeriod: string; }

interface SubscriptionRow {
  id: string;
  user: UserRef;
  plan: PlanRef;
  status: string;
  startDate: string;
  endDate?: string | null;
  autoRenew: boolean;
  createdAt: string;
}

interface SubscriptionsResponse {
  items: SubscriptionRow[];
  total: number;
}

const STATUSES = ["ACTIVE", "CANCELLED", "EXPIRED", "PENDING"] as const;

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-transparent gap-1">
        <CheckCircle2 className="size-3" /> Active
      </Badge>
    );
  if (status === "CANCELLED")
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-transparent gap-1">
        <XCircle className="size-3" /> Cancelled
      </Badge>
    );
  if (status === "EXPIRED")
    return <Badge variant="secondary">Expired</Badge>;
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="size-3" /> Pending
    </Badge>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const query = qs({ search, status, page, limit });

  const { data, isLoading, isError, refetch } = useQuery<SubscriptionsResponse>({
    queryKey: ["admin", "subscriptions", search, status, page],
    queryFn: () =>
      apiFetch<SubscriptionsResponse>(`/api/admin/subscriptions${query}`),
  });

  const subs = data?.items ?? [];
  const total = data?.total ?? 0;

  const totalActive = subs.filter((s) => s.status === "ACTIVE").length;
  const mrr = subs
    .filter((s) => s.status === "ACTIVE" && s.plan.billingPeriod === "MONTHLY")
    .reduce((acc, s) => acc + s.plan.price, 0);
  const arr = subs
    .filter((s) => s.status === "ACTIVE" && s.plan.billingPeriod === "YEARLY")
    .reduce((acc, s) => acc + s.plan.price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          All user subscription records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-emerald-500/15 text-emerald-400">
              <CreditCard className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total subs
              </div>
              <div className="text-lg font-semibold tabular-nums">{total}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-chart-2/15 text-chart-2">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Active
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {totalActive}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-primary/15 text-primary">
              <IndianRupee className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                MRR
              </div>
              <div className="text-lg font-semibold tabular-nums">
                ₹{mrr.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-chart-3/15 text-chart-3">
              <IndianRupee className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                ARR (yearly)
              </div>
              <div className="text-lg font-semibold tabular-nums">
                ₹{arr.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All subscriptions</CardTitle>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={status || "ALL"}
              onValueChange={(v) => {
                setStatus(v === "ALL" ? "" : v);
                setPage(1);
              }}
            >
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
          ) : subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCard className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold">No subscriptions yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {search || status
                  ? "No subscriptions match your filters."
                  : "No users have subscribed to a plan yet."}
              </p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto sv-scroll">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="pl-6 min-w-[200px]">User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Ends</TableHead>
                    <TableHead>Auto-renew</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                              {initials(s.user.name || s.user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[180px]">
                              {s.user.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {s.user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {s.plan.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {s.plan.currency === "INR" ? "₹" : "$"}
                        {s.plan.price.toLocaleString()}
                        <span className="text-xs text-muted-foreground">
                          /{s.plan.billingPeriod === "MONTHLY" ? "mo" : "yr"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(s.startDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.endDate ? formatRelativeTime(s.endDate) : "—"}
                      </TableCell>
                      <TableCell>
                        {s.autoRenew ? (
                          <Badge variant="secondary" className="gap-1">
                            <RefreshCw className="size-3" /> On
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Off</span>
                        )}
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
                              onClick={() =>
                                toast({
                                  title: "Coming soon",
                                  description: "Subscription edit is not yet available.",
                                })
                              }
                            >
                              View details
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
    </div>
  );
}
