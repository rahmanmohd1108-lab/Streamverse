"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  LayoutDashboard,
  Film,
  Tv,
  Tag,
  Folder,
  Languages,
  Image as ImageIcon,
  Users,
  CreditCard,
  Crown,
  ScrollText,
  BarChart3,
  LogOut,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_NAME } from "@/lib/constants";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Movies", href: "/admin/movies", icon: Film },
  { label: "Series", href: "/admin/series", icon: Tv },
  { label: "Genres", href: "/admin/genres", icon: Tag },
  { label: "Categories", href: "/admin/categories", icon: Folder },
  { label: "Languages", href: "/admin/languages", icon: Languages },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Plans", href: "/admin/plans", icon: Crown },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Admin navigation">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Radix Dialog (Sheet) and DropdownMenu generate IDs via React's useId().
  // In App Router + Turbopack the IDs assigned during SSR differ from those
  // generated during client hydration (the radix-_R_x_ values land on different
  // tree paths because of the SSR'd Radix Toast / Sonner portals living at
  // different React tree positions on server vs client). The resulting
  // hydration mismatch is unrecoverable in React 19 and bails to global-error.
  // Deferring the Radix-wrapped interactive pieces until after the client has
  // mounted keeps them out of the SSR HTML entirely so there is nothing to
  // mismatch. We render visual placeholders (same buttons, no Radix) during
  // SSR / first client paint so the layout is stable.
  //
  // `useSyncExternalStore` is the canonical way to detect "client-only"
  // without tripping react-hooks/set-state-in-effect. The server snapshot
  // returns false (matches SSR HTML), the client snapshot returns true after
  // hydration, so the placeholder buttons are swapped for the Radix-wrapped
  // versions in a normal post-hydration render.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
        aria-label="Admin sidebar"
      >
        <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
              S
            </span>
            <span className="font-semibold tracking-tight">
              {APP_NAME}
              <span className="ml-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Admin
              </span>
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto sv-scroll">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden />
              Back to site
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 md:px-6">
          {/* Mobile menu trigger */}
          {mounted ? (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
                  <span className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
                    S
                  </span>
                  <span className="font-semibold tracking-tight">
                    {APP_NAME}
                  </span>
                </div>
                <NavLinks pathname={pathname} />
                <div className="border-t border-sidebar-border p-3">
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/" onClick={() => setMobileOpen(false)}>
                      <ArrowLeft className="size-4" aria-hidden />
                      Back to site
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
              tabIndex={-1}
            >
              <Menu className="size-5" />
            </Button>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-sm md:text-base font-medium truncate text-muted-foreground">
              Admin Console
            </h1>
          </div>

          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2 md:px-3"
                  aria-label="User menu"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {initials(user.name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">
                    {user.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {user.email}
                  </span>
                  <span className="mt-1 inline-flex w-fit rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {user.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <ArrowLeft className="size-4" aria-hidden />
                    Back to site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout">
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className="gap-2 px-2 md:px-3"
              aria-label="User menu"
              tabIndex={-1}
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                  {initials(user.name || user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">
                {user.name}
              </span>
            </Button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
