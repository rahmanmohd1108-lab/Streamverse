"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users as UsersIcon,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserCog,
  UserX,
  UserCheck,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { apiFetch, apiPut, qs } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/constants";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  image?: string | null;
}

interface UsersResponse {
  items: UserRow[];
  total: number;
}

const ROLES = ["USER", "ADMIN", "CONTENT_MANAGER"] as const;
const ROLE_LABELS: Record<string, string> = {
  USER: "User",
  ADMIN: "Admin",
  CONTENT_MANAGER: "Content Manager",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-transparent">
        Active
      </Badge>
    );
  if (status === "SUSPENDED")
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-transparent">
        Suspended
      </Badge>
    );
  if (status === "DELETED")
    return <Badge variant="secondary">Deleted</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMIN")
    return (
      <Badge className="bg-primary/15 text-primary border-transparent gap-1">
        <ShieldCheck className="size-3" /> Admin
      </Badge>
    );
  if (role === "CONTENT_MANAGER")
    return (
      <Badge className="bg-chart-4/15 text-chart-4 border-transparent gap-1">
        <Shield className="size-3" /> Content Mgr
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      <UserCog className="size-3" /> User
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

export default function AdminUsersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [actionTarget, setActionTarget] = useState<{
    user: UserRow;
    kind: "suspend" | "activate" | "delete" | "role";
    newRole?: string;
  } | null>(null);

  const query = qs({ search, role, page, limit });

  const { data, isLoading, isError, refetch } = useQuery<UsersResponse>({
    queryKey: ["admin", "users", search, role, page],
    queryFn: () => apiFetch<UsersResponse>(`/api/admin/users${query}`),
  });

  const updateMut = useMutation({
    mutationFn: async ({
      user,
      body,
    }: {
      user: UserRow;
      body: Record<string, unknown>;
    }) => apiPut(`/api/admin/users/${user.id}`, body),
    onSuccess: (_data, variables) => {
      const { body } = variables;
      toast({
        title: "User updated",
        description: body.status
          ? `Status set to ${body.status}`
          : body.role
            ? `Role set to ${body.role}`
            : "User profile updated",
      });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setActionTarget(null);
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Update failed", description: e.message }),
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and access.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={role || "ALL"}
              onValueChange={(v) => {
                setRole(v === "ALL" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
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
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UsersIcon className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold">No users found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {search || role
                  ? "No users match your filters."
                  : "No users have signed up yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-[65vh] overflow-y-auto sv-scroll">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="pl-6 min-w-[220px]">User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                                {initials(u.name || u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate max-w-[200px]">
                                {u.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={u.role} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={u.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelativeTime(u.createdAt)}
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
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Change role</DropdownMenuLabel>
                              {ROLES.map((r) => (
                                <DropdownMenuItem
                                  key={r}
                                  disabled={r === u.role}
                                  onClick={() =>
                                    setActionTarget({
                                      user: u,
                                      kind: "role",
                                      newRole: r,
                                    })
                                  }
                                >
                                  <Shield className="size-4" /> {ROLE_LABELS[r]}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Account</DropdownMenuLabel>
                              {u.status === "ACTIVE" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionTarget({ user: u, kind: "suspend" })
                                  }
                                >
                                  <UserX className="size-4" /> Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionTarget({ user: u, kind: "activate" })
                                  }
                                >
                                  <UserCheck className="size-4" /> Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setActionTarget({ user: u, kind: "delete" })
                                }
                              >
                                <UserX className="size-4" /> Mark deleted
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {users.length} of {total} user{total === 1 ? "" : "s"}
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
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
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
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
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

      <AlertDialog
        open={!!actionTarget}
        onOpenChange={(o) => !o && setActionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget?.kind === "role" && "Change user role?"}
              {actionTarget?.kind === "suspend" && "Suspend this user?"}
              {actionTarget?.kind === "activate" && "Activate this user?"}
              {actionTarget?.kind === "delete" && "Mark this user as deleted?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.kind === "role" && (
                <>
                  Set <strong>{actionTarget?.user.name}</strong>&apos;s role to{" "}
                  <strong>{ROLE_LABELS[actionTarget?.newRole ?? ""]}</strong>.
                  {actionTarget?.newRole === "ADMIN" && (
                    <span className="block mt-1">
                      Admins can manage all content and users.
                    </span>
                  )}
                </>
              )}
              {actionTarget?.kind === "suspend" && (
                <>
                  <strong>{actionTarget?.user.name}</strong> will lose access to
                  the platform until reactivated.
                </>
              )}
              {actionTarget?.kind === "activate" && (
                <>
                  <strong>{actionTarget?.user.name}</strong> will regain full
                  access to the platform.
                </>
              )}
              {actionTarget?.kind === "delete" && (
                <>
                  <strong>{actionTarget?.user.name}</strong>&apos;s account will
                  be marked deleted. This soft-deletes the record (data is
                  preserved).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                actionTarget?.kind === "delete" || actionTarget?.kind === "suspend"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : ""
              }
              onClick={() => {
                if (!actionTarget) return;
                const body: Record<string, unknown> = {};
                if (actionTarget.kind === "role") {
                  body.role = actionTarget.newRole;
                } else if (actionTarget.kind === "suspend") {
                  body.status = "SUSPENDED";
                } else if (actionTarget.kind === "activate") {
                  body.status = "ACTIVE";
                } else if (actionTarget.kind === "delete") {
                  body.status = "DELETED";
                }
                updateMut.mutate({ user: actionTarget.user, body });
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
