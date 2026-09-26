"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiPost<{ ok: boolean; devToken?: string }>(
        "/api/auth/forgot-password",
        { email: email.trim() },
      );
      setDone(true);
      if (res?.devToken) setDevToken(res.devToken);
      toast({ title: "Reset link generated", description: "Check your email for instructions." });
    } catch (e) {
      toast({
        title: "Couldn't send reset link",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
        <CardDescription>
          Enter your account email and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <Alert className="border-green-500/40 bg-green-500/10 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Check your inbox</AlertTitle>
            <AlertDescription>
              If the email exists in our system, a reset link has been sent to{" "}
              <span className="font-semibold">{email}</span>. The link expires in 1 hour.
            </AlertDescription>
            {devToken && (
              <div className="mt-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
                <p className="font-semibold mb-1">Dev mode</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Use this token to reset the password:
                </p>
                <code className="block bg-black/40 px-2 py-1 rounded text-xs break-all">
                  {devToken}
                </code>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                  className="inline-flex items-center gap-1 mt-2 text-primary font-semibold hover:underline text-xs"
                >
                  <KeyRound className="h-3 w-3" /> Open reset page →
                </Link>
              </div>
            )}
          </Alert>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full" size="lg">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center gap-2 text-sm">
        <p className="text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
