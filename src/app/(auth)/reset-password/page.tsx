"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, KeyRound, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api/client";
import { cn } from "@/lib/utils";

function ResetPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const pwCheck = useMemo(
    () => ({
      length: password.length >= 8,
      letter: /[A-Za-z]/.test(password),
      number: /[0-9]/.test(password),
    }),
    [password],
  );
  const matchOk = password.length > 0 && password === confirm;
  const canSubmit =
    token.length > 0 &&
    pwCheck.length &&
    pwCheck.letter &&
    pwCheck.number &&
    matchOk;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await apiPost("/api/auth/reset-password", {
        token,
        password,
        confirmPassword: confirm,
      });
      setDone(true);
      toast({ title: "Password reset", description: "You can now sign in with your new password." });
      setTimeout(() => router.push("/login"), 1500);
    } catch (e) {
      toast({
        title: "Reset failed",
        description: e instanceof Error ? e.message : "The link may be invalid or expired",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
        <CardDescription>
          Choose a new password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <Alert className="border-green-500/40 bg-green-500/10 text-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Your password has been reset. Redirecting you to sign in…
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {!token && (
              <Alert variant="destructive">
                <AlertDescription>
                  No reset token was provided in the URL. Please open the link from your email or request a new one.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="pl-10"
                />
              </div>
              {password.length > 0 && (
                <ul className="grid grid-cols-1 gap-1 text-xs mt-1">
                  <PwItem ok={pwCheck.length} label="At least 8 characters" />
                  <PwItem ok={pwCheck.letter} label="Contains a letter" />
                  <PwItem ok={pwCheck.number} label="Contains a number" />
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="pl-10"
                />
                {confirm.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {matchOk ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </span>
                )}
              </div>
            </div>
            <Button type="submit" disabled={busy || !canSubmit} className="w-full" size="lg">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {busy ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center gap-2 text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
          Request a new reset link
        </Link>
      </CardFooter>
    </Card>
  );
}

function PwItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn("flex items-center gap-1.5", ok ? "text-green-500" : "text-muted-foreground")}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </li>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
