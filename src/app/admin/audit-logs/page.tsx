"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ScrollText,
  Filter,
  User,
  FileClock,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { apiFetch, qs } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/constants";

interface AuditLogRow {
  id: string;
  adminId: string;
  admin?: { id: string; name: string; email: string };
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  items: AuditLogRow[];
  total: number;
}

const RESOURCES = [
  "movie",
  "series",
  "season",
  "episode",
  "user",
  "banner",
  "plan",
  "genre",
  "category",
  "language",
  "subscription",
] as const;

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, string> = {
    create: "bg-emerald-500/15 text-emerald-400 border-transparent",
    update: "bg-chart-5/15 text-chart-5 border-transparent",
    delete: "bg-destructive/15 text-destructive border-transparent",
    publish: "bg-chart-2/15 text-chart-2 border-transparent",
    archive: "bg-amber-500/15 text-amber-400 border-transparent",
  };
  return (
    <Badge className={map[action] ?? "bg-muted text-muted-foreground border-transparent"}>
      {action}
    </Badge>
  );
}

export default function AdminAuditLogsPage() {
  const [adminId, setAdminId] = useState("");
  const [resource, setResource] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const query = qs({ adminId, resource, page, limit });

  const { data, isLoading, isError, refetch } = useQuery<AuditLogResponse>({
    queryKey: ["admin", "audit-logs", adminId, resource, page],
    queryFn: () => apiFetch<AuditLogResponse>(`/api/admin/audit-logs${query}`),
  });

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filtered = fromDate || toDate
    ? logs.filter((l) => {
        const d = new Date(l.createdAt).getTime();
        if (fromDate) {
          const from = new Date(fromDate).getTime();
          if (d < from) return false;
        }
        if (toDate) {
          const to = new Date(toDate).getTime() + 86_400_000;
          if (d > to) return false;
        }
        return true;
      })
    : logs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Track every admin action across the platform.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="size-4" /> Filters
          </CardTitle>
          <CardDescription>Refine by admin, resource, or date range.</CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="adminId">Admin ID</Label>
              <Input
                id="adminId"
                value={adminId}
                onChange={(e) => {
                  setAdminId(e.target.value);
                  setPage(1);
                }}
                placeholder="user id..."
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource">Resource</Label>
              <Select
                value={resource || "ALL"}
                onValueChange={(v) => {
                  setResource(v === "ALL" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All resources</SelectItem>
                  {RESOURCES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromDate">From date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold">No audit logs</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {adminId || resource || fromDate || toDate
                  ? "No logs match your filters."
                  : "No admin actions have been logged yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-[65vh] overflow-y-auto sv-scroll">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="pl-6">Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Resource ID</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="pl-6">
                          {log.admin ? (
                            <div className="flex items-center gap-2">
                              <span className="grid size-6 place-items-center rounded-md bg-primary/15 text-primary text-[10px]">
                                <User className="size-3" />
                              </span>
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate max-w-[180px]">
                                  {log.admin.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {log.admin.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-muted-foreground">
                              {log.adminId.slice(0, 8)}…
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ActionBadge action={log.action} />
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {log.resource}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.resourceId ? log.resourceId.slice(0, 12) + "…" : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {log.ipAddress ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelativeTime(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileClock className="size-3" />
                    {filtered.length} of {total} entr{filtered.length === 1 ? "y" : "ies"}
                  </p>
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          aria-disabled={page === 1}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({
                        length: Math.min(5, totalPages),
                      }).map((_, i) => {
                        const p = i + 1;
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === page}
                              onClick={() => setPage(p)}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          aria-disabled={page === totalPages}
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Calendar className="size-3" />
        Audit logs are retained indefinitely. StreamVerse Admin
      </p>
    </div>
  );
}
