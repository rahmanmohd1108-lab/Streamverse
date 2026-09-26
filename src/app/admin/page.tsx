"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  Clapperboard,
  CreditCard,
  Clock,
  IndianRupee,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { apiFetch } from "@/lib/api/client";
import { formatViews, formatRelativeTime } from "@/lib/constants";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

interface DashboardData {
  counts: {
    users: number;
    activeUsers: number;
    totalContent: number;
    movies: number;
    series: number;
    episodes: number;
    watchTime: number;
    subscriptions: number;
    revenue: number;
    views: number;
  };
  charts: {
    viewsByDay: { date: string; count: number }[];
    topContent: {
      contentId: string;
      contentType: "movie" | "series";
      title: string | null;
      slug: string | null;
      views: number;
    }[];
    usersByDay: { date: string; count: number }[];
  };
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs uppercase tracking-wider">
            {label}
          </CardDescription>
          <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl md:text-3xl font-semibold tabular-nums">
          {value}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta && (
            <Badge
              variant="secondary"
              className="bg-emerald-500/15 text-emerald-400 border-transparent"
            >
              <ArrowUpRight className="size-3" />
              {delta}
            </Badge>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery<DashboardData>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiFetch<DashboardData>("/api/admin/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Platform overview at a glance.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LoadingSkeleton className="h-[360px] rounded-xl" />
          <LoadingSkeleton className="h-[360px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load dashboard"
        description="Failed to fetch platform metrics. Please retry."
        onRetry={() => refetch()}
      />
    );
  }

  const viewsData = (data.charts?.viewsByDay ?? []).map((d) => ({
    date: d.date.slice(5),
    views: d.count,
  }));
  const usersData = (data.charts?.usersByDay ?? []).map((d) => ({
    date: d.date.slice(5),
    users: d.count,
  }));
  const topContent = data.charts?.topContent ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Users"
          value={formatViews(data.counts.users)}
          delta="+12%"
          icon={Users}
          hint="vs last week"
        />
        <KpiCard
          label="Active Users"
          value={formatViews(data.counts.activeUsers)}
          delta="+8%"
          icon={UserCheck}
          hint="last 7d"
        />
        <KpiCard
          label="Total Content"
          value={formatViews(data.counts.totalContent)}
          hint={`${data.counts.movies} movies · ${data.counts.series} series · ${data.counts.episodes} eps`}
          icon={Clapperboard}
        />
        <KpiCard
          label="Subscriptions"
          value={formatViews(data.counts.subscriptions)}
          delta="+5%"
          icon={CreditCard}
          hint="active paid"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-chart-2/15 text-chart-2">
              <Clock className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Watch Time
              </div>
              <div className="text-lg font-semibold">
                {formatViews(data.counts.watchTime)}s
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
                Revenue
              </div>
              <div className="text-lg font-semibold">
                ₹{data.counts.revenue.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-chart-5/15 text-chart-5">
              <Eye className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Views
              </div>
              <div className="text-lg font-semibold">
                {formatViews(data.counts.views)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-primary/15 text-primary">
              <Clapperboard className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Movies / Series
              </div>
              <div className="text-lg font-semibold">
                {data.counts.movies} / {data.counts.series}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Views — last 14 days"
          description="Daily content views across all profiles."
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={viewsData}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "oklch(0.70 0.012 280)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.70 0.012 280)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.014 280)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  borderRadius: "8px",
                  color: "oklch(0.98 0.005 280)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "oklch(0.70 0.012 280)" }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#viewsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="New users — by day"
          description="Signups over the last 14 days."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={usersData}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "oklch(0.70 0.012 280)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.70 0.012 280)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.014 280)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  borderRadius: "8px",
                  color: "oklch(0.98 0.005 280)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "oklch(0.70 0.012 280)" }}
              />
              <Bar
                dataKey="users"
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Content</CardTitle>
          <CardDescription>Most viewed titles across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="max-h-96 overflow-y-auto sv-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="pl-6 w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="pr-6 text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topContent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No views recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {topContent.map((c, i) => (
                  <TableRow key={`${c.contentType}-${c.contentId}`}>
                    <TableCell className="pl-6 font-mono text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {c.title ?? "Untitled"}
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">
                      {formatViews(c.views)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-4">
        Last refreshed {formatRelativeTime(new Date())} · StreamVerse Admin
      </p>
    </div>
  );
}
