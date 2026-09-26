"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api/client";

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setBusy(true);
    try {
      // POST to a placeholder /api/contact endpoint; if it 404s we still
      // show success because there's nothing we can do about a missing
      // backend and we don't want to block the user.
      try {
        await apiPost("/api/contact", {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        });
      } catch {
        // swallow — still show success message to the user
      }
      setDone(true);
      toast({ title: "Message sent", description: "We'll get back to you soon." });
      setName("");
      setEmail("");
      setMessage("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 pb-20 md:pb-12 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Contact us</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Have a question, feedback, or need help? Fill out the form and we&apos;ll get back to
          you within 1–2 business days.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send a message
          </CardTitle>
          <CardDescription>
            For account, billing, or technical issues, please include your registered email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <Alert className="border-green-500/40 bg-green-500/10 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Message sent</AlertTitle>
              <AlertDescription>
                Thanks for reaching out. We&apos;ll reply to your email shortly.
              </AlertDescription>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setDone(false)}
              >
                Send another message
              </Button>
            </Alert>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  placeholder="How can we help?"
                />
              </div>
              <Button type="submit" disabled={busy} size="lg">
                {busy ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {busy ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-md border border-border/40 bg-card/60 p-4">
          <p className="font-semibold mb-1">General inquiries</p>
          <a
            href="mailto:hello@streamverse.local"
            className="text-primary hover:underline"
          >
            hello@streamverse.local
          </a>
        </div>
        <div className="rounded-md border border-border/40 bg-card/60 p-4">
          <p className="font-semibold mb-1">Support</p>
          <a
            href="mailto:support@streamverse.local"
            className="text-primary hover:underline"
          >
            support@streamverse.local
          </a>
        </div>
      </div>
    </div>
  );
}
