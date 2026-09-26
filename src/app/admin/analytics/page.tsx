"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Eye,
  Search as SearchIcon,
  Plus,
  Clock,
  TrendingUp,
} from "lucide-react";
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
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ErrorState } from "@/components/streamverse/empty-states";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";
import { formatViews, formatDuration } from "@/lib/constants";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface DayDatum {
  date: string;
  count: number;
}
interface TopDatum {
  id: string;
  title: string;
  views: number;
}
interface GenreDatum {
  genre: string;
  seconds: number;
}

interface AnalyticsData {
  viewsByDay: DayDatum[];
  topContent: TopDatum[];
  watchTimeByGenre: GenreDatum[];
  searchesByDay: DayDatum[];
  watchlistAddsByDay: DayDatum[];
}

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.65 0.18 160)",
  "oklch(0.65 0.20 90)",
];

function ChartCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "oklch(0.18 0.014 280)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  borderRadius: "8px",
  color: "oklch(0.98 0.005 280)",
  fontSize: "12px",
};
const labelStyle = { color: "oklch(0.70 0.012 280)" };

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery<AnalyticsData>({
    queryKey: ["admin", "analytics"],
    queryFn: () => apiFetch<AnalyticsData>("/api/admin/analytics"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Deep-dive into user engagement and content performance.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[340px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load analytics"
        description="Failed to fetch analytics data. Please retry."
        onRetry={() => refetch()}
      />
    );
  }

  const viewsData = data.viewsByDay.map((d) => ({
    date: d.date.slice(5),
    views: d.count,
  }));
  const searchData = data.searchesByDay.map((d) => ({
    date: d.date.slice(5),
    searches: d.count,
  }));
  const watchlistData = data.watchlistAddsByDay.map((d) => ({
    date: d.date.slice(5),
    adds: d.count,
  }));
  const genreData = data.watchTimeByGenre.map((d) => ({
    name: d.genre,
    value: d.seconds,
  }));

  const totalViews = data.viewsByDay.reduce((a, d) => a + d.count, 0);
  const totalSearches = data.searchesByDay.reduce((a, d) => a + d.count, 0);
  const totalAdds = data.watchlistAddsByDay.reduce((a, d) => a + d.count, 0);
  const totalWatchTime = data.watchTimeByGenre.reduce((a, d) => a + d.seconds, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Deep-dive into user engagement and content performance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-chart-5/15 text-chart-5">
              <Eye className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Views (30d)
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {formatViews(totalViews)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-chart-4/15 text-chart-4">
              <SearchIcon className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Searches (30d)
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {formatViews(totalSearches)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-chart-2/15 text-chart-2">
              <Plus className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Watchlist adds (30d)
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {formatViews(totalAdds)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-chart-3/15 text-chart-3">
              <Clock className="size-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Watch time (30d)
              </div>
              <div className="text-lg font-semibold">
                {formatDuration(totalWatchTime)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Views — last 30 days"
          description="Daily content views."
          icon={Eye}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={viewsData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-5)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-chart-5)" stopOpacity={0} />
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
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="var(--color-chart-5)"
                strokeWidth={2}
                fill="url(#vGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Searches — last 30 days"
          description="Daily search queries."
          icon={SearchIcon}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={searchData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
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
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Line
                type="monotone"
                dataKey="searches"
                stroke="var(--color-chart-4)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Watchlist adds — last 30 days"
          description="Daily watchlist additions."
          icon={Plus}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={watchlistData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
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
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Bar
                dataKey="adds"
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Watch time by genre"
          description="Total seconds watched per genre."
          icon={Clock}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genreData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {genreData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                    stroke="oklch(0.16 0.014 280)"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                formatter={(value: number) => formatDuration(value)}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "oklch(0.70 0.012 280)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" />
            Top content
          </CardTitle>
          <CardDescription>
            Most-viewed titles over the last 30 days.
          </CardDescription>
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
                {data.topContent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No top content yet.
                    </TableCell>
                  </TableRow>
                )}
                {data.topContent.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 font-mono text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          #{i + 1}
                        </Badge>
                        <span className="font-medium">{c.title}</span>
                      </div>
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

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 pb-4">
        <BarChart3 className="size-3" />
        Analytics refresh daily · StreamVerse Admin
      </p>
    </div>
  );
}
