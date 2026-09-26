"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { LogOut, User as UserIcon, Bell, CreditCard, KeyRound, Save } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiFetch } from "@/lib/api/client";

interface AccountSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
    status: string;
  };
}

export default function AccountPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery<AccountSession | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const r = await fetch("/api/auth/me");
        if (!r.ok) return null;
        return r.json();
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login?redirect=/account");
    }
  }, [sessionLoading, session, router]);

  const logout = async () => {
    try {
      await apiPost("/api/auth/logout", {});
    } catch {}
    qc.invalidateQueries();
    toast({ title: "Signed out" });
    router.push("/");
  };

  if (sessionLoading || !session) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 pb-20 md:pb-12">
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 pb-20 md:pb-12 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, subscription, and notifications.
        </p>
      </header>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="h-4 w-4 mr-2" /> Subscription
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound className="h-4 w-4 mr-2" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} />
        </TabsContent>
        <TabsContent value="subscription">
          <SubscriptionTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab onLogout={logout} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab({ user }: { user: AccountSession["user"] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState(user.image ?? "");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/api/account", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), image: image.trim() || undefined }),
        headers: { "Content-Type": "application/json" },
      });
      qc.invalidateQueries({ queryKey: ["session"] });
      toast({ title: "Profile updated" });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>Update your display name and avatar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="mt-1">{user.role}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support to update it.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Avatar URL (optional)</Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
              type="url"
            />
          </div>
          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4 mr-2" />
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SubscriptionTab() {
  const { data, isLoading } = useQuery<{ current?: { plan: { name: string; slug: string; price: number; billingPeriod: string; currency: string }; endDate?: string | null; status: string } | null; plans?: { id: string; name: string; slug: string; price: number }[] } | null>({
    queryKey: ["subscription"],
    queryFn: async () => {
      try {
        const r = await fetch("/api/subscriptions");
        if (!r.ok) return null;
        return r.json();
      } catch {
        return null;
      }
    },
  });

  const sub = data?.current;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Your current plan and billing information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton className="h-24" />
        ) : sub ? (
          <div className="rounded-md border border-border/60 p-4 bg-card/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <p className="text-xl font-bold">{sub.plan.name}</p>
              </div>
              <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"}>
                {sub.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {sub.plan.price === 0
                ? "Free plan"
                : `₹${sub.plan.price} / ${sub.plan.billingPeriod.toLowerCase()}`}
              {sub.endDate && ` · renews ${new Date(sub.endDate).toLocaleDateString()}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are on the Free plan.
          </p>
        )}
        <Button asChild variant="outline">
          <Link href="/subscription">Change plan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    newContent: true,
    subscription: true,
    account: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/notifications/preferences");
        if (r.ok) {
          const data = await r.json();
          const p = data?.preferences ?? data ?? {};
          setPrefs({
            email: p.email ?? true,
            push: p.push ?? true,
            newContent: p.newContent ?? true,
            subscription: p.subscription ?? true,
            account: p.account ?? true,
          });
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(prefs),
        headers: { "Content-Type": "application/json" },
      });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast({ title: "Preferences saved" });
    } catch (e) {
      toast({
        title: "Couldn't save preferences",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const items: { key: keyof typeof prefs; label: string; description: string }[] = [
    { key: "email", label: "Email notifications", description: "Receive updates via email" },
    { key: "push", label: "Push notifications", description: "On-device notifications" },
    { key: "newContent", label: "New content alerts", description: "When new movies or series land" },
    { key: "subscription", label: "Subscription updates", description: "Renewals, expirations, receipts" },
    { key: "account", label: "Account & security", description: "Sign-ins, password changes" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>
          Choose what we email and push to your devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <LoadingSkeleton className="h-40" />
        ) : (
          items.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div>
                <Label className="font-medium" htmlFor={item.key}>
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                id={item.key}
                checked={prefs[item.key]}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))
        )}
        <Button onClick={save} disabled={saving || loading}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving…" : "Save preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SecurityTab({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast({
        title: "Passwords don't match",
        description: "Please re-enter the new password.",
        variant: "destructive",
      });
      return;
    }
    if (next.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters with a letter and a number.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      await apiPost("/api/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      toast({ title: "Password changed" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      toast({
        title: "Couldn't change password",
        description: e instanceof Error ? e.message : "Check your current password",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use at least 8 characters including a letter and a number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" disabled={busy}>
              <KeyRound className="h-4 w-4 mr-2" />
              {busy ? "Changing…" : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>
            End your current session on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
