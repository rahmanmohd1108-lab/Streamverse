"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Check, X, User as UserIcon, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { EmptyState } from "@/components/streamverse/empty-states";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiDelete, apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const MAX_PROFILES = 5;

interface Profile {
  id: string;
  name: string;
  avatar?: string | null;
  isKids: boolean;
  language: string;
  maturityLevel: string;
}

interface ProfilesResponse {
  items: Profile[];
}

export default function ProfilesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery<{ user: { id: string } } | null>({
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
      router.replace("/login?redirect=/profiles");
    }
  }, [sessionLoading, session, router]);

  const { data, isLoading, isError } = useQuery<ProfilesResponse>({
    queryKey: ["profiles"],
    queryFn: async () => apiFetch<ProfilesResponse>("/api/profiles"),
    enabled: !!session,
  });

  const [manageMode, setManageMode] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const profiles = data?.items ?? [];

  const switchProfile = async (profile: Profile) => {
    try {
      await apiPost("/api/profiles/switch", { profileId: profile.id });
      qc.invalidateQueries({ queryKey: ["session"] });
      toast({ title: `Switched to ${profile.name}` });
      router.push("/");
    } catch (e) {
      toast({
        title: "Couldn't switch profile",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const deleteProfile = async () => {
    if (!deletingId) return;
    try {
      await apiDelete(`/api/profiles/${deletingId}`);
      qc.invalidateQueries({ queryKey: ["profiles"] });
      toast({ title: "Profile deleted" });
      setDeletingId(null);
    } catch (e) {
      toast({
        title: "Couldn't delete profile",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  if (sessionLoading || !session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <LoadingSkeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <LoadingSkeleton className="h-32 w-32 rounded-full" />
              <LoadingSkeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] container mx-auto px-4 lg:px-8 py-10 pb-20 md:pb-12 flex flex-col items-center">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          {manageMode ? "Manage Profiles" : "Who's watching?"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {manageMode
            ? "Edit, rename, or remove profiles."
            : "Select a profile to continue."}
        </p>
      </header>

      {isError ? (
        <EmptyState
          title="Couldn't load profiles"
          description="Please try again in a moment."
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <LoadingSkeleton className="h-32 w-32 rounded-full" />
              <LoadingSkeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "group flex flex-col items-center gap-3 cursor-pointer",
                  manageMode && "cursor-default",
                )}
              >
                <div className="relative">
                  <button
                    type="button"
                    className="rounded-full overflow-hidden border-4 border-transparent group-hover:border-primary/60 transition-colors block"
                    onClick={() => (manageMode ? setEditing(p) : switchProfile(p))}
                    aria-label={`Switch to ${p.name}`}
                  >
                    <Avatar className="h-28 w-28 md:h-32 md:w-32">
                      <AvatarFallback className="text-3xl font-black bg-primary text-primary-foreground">
                        {p.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  {manageMode && (
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full"
                      onClick={() => setEditing(p)}
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil className="h-8 w-8 text-white" />
                    </button>
                  )}
                  {p.isKids && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                      KIDS
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">{p.name}</p>
                  {manageMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-7 mt-1 text-xs"
                      onClick={() => setDeletingId(p.id)}
                      disabled={profiles.length === 1}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {profiles.length < MAX_PROFILES && (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="rounded-full h-28 w-28 md:h-32 md:w-32 border-4 border-dashed border-border hover:border-primary/60 flex items-center justify-center transition-colors group"
                  aria-label="Add profile"
                >
                  <Plus className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                <p className="text-sm font-semibold">Add Profile</p>
              </div>
            )}
          </div>

          <div className="mt-10">
            {!manageMode ? (
              <Button variant="outline" onClick={() => setManageMode(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Manage Profiles
              </Button>
            ) : (
              <Button onClick={() => setManageMode(false)}>
                <Check className="h-4 w-4 mr-2" /> Done
              </Button>
            )}
          </div>
        </>
      )}

      {/* Create / Edit dialog */}
      <ProfileDialog
        key={editing?.id ?? "new"}
        open={creating || !!editing}
        profile={editing ?? undefined}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["profiles"] });
          setCreating(false);
          setEditing(null);
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              The profile and all its watchlist, history, and ratings will be removed.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProfile}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProfileDialog({
  open,
  profile,
  onClose,
  onSaved,
}: {
  open: boolean;
  profile?: Profile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState(profile?.name ?? "");
  const [isKids, setIsKids] = useState(profile?.isKids ?? false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (profile) {
        await apiFetch(`/api/profiles/${profile.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: name.trim(), isKids }),
          headers: { "Content-Type": "application/json" },
        });
        toast({ title: "Profile updated" });
      } else {
        await apiPost("/api/profiles", { name: name.trim(), isKids });
        toast({ title: "Profile created" });
      }
      qc.invalidateQueries({ queryKey: ["profiles"] });
      onSaved();
    } catch (e) {
      toast({
        title: "Couldn't save profile",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{profile ? "Edit profile" : "Add a profile"}</DialogTitle>
          <DialogDescription>
            {profile
              ? "Update this profile's name and kid-safe setting."
              : `You can create up to ${MAX_PROFILES} profiles per account.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Main, Kids, Family"
              required
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="kids-switch" className="flex items-center gap-2 cursor-pointer">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Kids profile
              </Label>
              <p className="text-xs text-muted-foreground">
                Only shows content rated ALL / 7+
              </p>
            </div>
            <Switch
              id="kids-switch"
              checked={isKids}
              onCheckedChange={setIsKids}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button type="submit">
              <Check className="h-4 w-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
