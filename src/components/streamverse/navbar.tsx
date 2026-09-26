"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, Bell, Menu, X, ChevronDown, User, LogOut, Settings, Film, Tv, Bookmark, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Movies", href: "/movies" },
  { label: "Series", href: "/series" },
  { label: "My List", href: "/my-list" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const { data: session } = useQuery<{ user: { id: string; name: string; email: string; role: string } } | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const { data: notifications = [] } = useQuery<{ id: string; title: string; read: boolean }[]>({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      if (!session) return [];
      const res = await fetch("/api/notifications?unread=true");
      if (!res.ok) return [];
      const data = await res.json();
      return data.items ?? [];
    },
    enabled: !!session,
  });

  // Don't render navbar on admin or watch routes
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/watch") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return null;
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchValue.trim())}`;
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    qc.invalidateQueries();
    toast({ title: "Signed out" });
    window.location.href = "/";
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50"
          : "bg-gradient-to-b from-black/70 to-transparent",
      )}
    >
      <nav className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2 group" aria-label={`${APP_NAME} home`}>
            <span className="text-primary font-black text-xl tracking-tight">
              {APP_NAME.toUpperCase()}
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-6 text-sm">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "font-medium transition-colors hover:text-foreground",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={submitSearch} className="hidden sm:flex items-center gap-2 bg-background/95 border border-border rounded-md px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              <Input
                ref={searchRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search movies, series…"
                className="h-7 border-0 focus-visible:ring-0 bg-transparent w-44 lg:w-64 p-0 text-sm"
                aria-label="Search"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="hidden sm:inline-flex"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Notifications */}
          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {notifications.length === 0 ? (
                  <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start py-2">
                      <span className="text-sm font-medium">{n.title}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Profile / Auth */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer flex w-full">
                    <Settings className="mr-2 h-4 w-4" /> Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profiles" className="cursor-pointer flex w-full">
                    <User className="mr-2 h-4 w-4" /> Profiles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-list" className="cursor-pointer flex w-full">
                    <Bookmark className="mr-2 h-4 w-4" /> My List
                  </Link>
                </DropdownMenuItem>
                {session.user.role === "ADMIN" || session.user.role === "CONTENT_MANAGER" ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer flex w-full">
                      <Film className="mr-2 h-4 w-4" /> Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background">
              <SheetTitle className="sr-only">Main menu</SheetTitle>
              <div className="flex flex-col gap-4 mt-6">
                <Link href="/" className="text-2xl font-black text-primary">
                  {APP_NAME.toUpperCase()}
                </Link>
                <nav className="flex flex-col gap-1">
                  <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm">
                    <HomeIcon className="h-4 w-4" /> Home
                  </Link>
                  <Link href="/movies" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm">
                    <Film className="h-4 w-4" /> Movies
                  </Link>
                  <Link href="/series" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm">
                    <Tv className="h-4 w-4" /> Series
                  </Link>
                  <Link href="/my-list" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm">
                    <Bookmark className="h-4 w-4" /> My List
                  </Link>
                  <Link href="/search" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm">
                    <Search className="h-4 w-4" /> Search
                  </Link>
                </nav>
                <div className="border-t border-border pt-4 mt-2 flex flex-col gap-2">
                  {session ? (
                    <>
                      <Link href="/account" className="px-3 py-2 text-sm rounded-md hover:bg-accent">
                        Account
                      </Link>
                      <Link href="/profiles" className="px-3 py-2 text-sm rounded-md hover:bg-accent">
                        Profiles
                      </Link>
                      {session.user.role === "ADMIN" || session.user.role === "CONTENT_MANAGER" ? (
                        <Link href="/admin" className="px-3 py-2 text-sm rounded-md hover:bg-accent">
                          Admin Dashboard
                        </Link>
                      ) : null}
                      <Button variant="outline" onClick={logout} className="mt-2">
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline">
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/register">Sign up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      {session && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border">
          <nav className="grid grid-cols-4 h-14">
            {[
              { href: "/", icon: HomeIcon, label: "Home" },
              { href: "/search", icon: Search, label: "Search" },
              { href: "/my-list", icon: Bookmark, label: "My List" },
              { href: "/account", icon: User, label: "Account" },
            ].map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 text-xs",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
