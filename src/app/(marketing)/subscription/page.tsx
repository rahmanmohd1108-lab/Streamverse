import type { Metadata } from "next";
import Link from "next/link";
import { Check, Star, Sparkles } from "lucide-react";
import { getPlans } from "@/lib/api/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { APP_NAME } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Subscription Plans",
  description: `Compare ${APP_NAME} plans — Free, Basic, Premium, and Premium Annual. Cancel anytime.`,
  alternates: { canonical: "/subscription" },
};

const COMPARISON_ROWS = [
  { label: "Monthly price", key: "price" },
  { label: "Annual price", key: "annual" },
  { label: "Max video quality", key: "quality" },
  { label: "Simultaneous devices", key: "devices" },
  { label: "Ad-free", key: "ads" },
  { label: "Downloads", key: "downloads" },
  { label: "Catalog", key: "catalog" },
];

const COMPARISON: Record<string, Record<string, string>> = {
  free: {
    price: "₹0",
    annual: "₹0",
    quality: "480p (SD)",
    devices: "1",
    ads: "No",
    downloads: "No",
    catalog: "Limited",
  },
  basic: {
    price: "₹199 / month",
    annual: "₹2,388 / year",
    quality: "1080p (HD)",
    devices: "2",
    ads: "Yes",
    downloads: "No",
    catalog: "Selected",
  },
  premium: {
    price: "₹649 / month",
    annual: "₹7,788 / year",
    quality: "4K UHD + HDR",
    devices: "4",
    ads: "Yes",
    downloads: "Yes (mobile)",
    catalog: "Full",
  },
  "premium-annual": {
    price: "₹542 / month (billed annually)",
    annual: "₹6,499 / year",
    quality: "4K UHD + HDR",
    devices: "4",
    ads: "Yes",
    downloads: "Yes (mobile)",
    catalog: "Full + Early access",
  },
};

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from your Account page. You'll keep access to your plan's features until the end of the current billing period.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept all major credit and debit cards, UPI, and popular digital wallets. The development version of StreamVerse uses a demo payment provider — no real money is charged.",
  },
  {
    q: "What is the difference between Premium and Premium Annual?",
    a: "Premium is billed monthly. Premium Annual is billed once a year and saves you about 17% versus paying monthly. Both include the full catalog, 4K UHD streaming, downloads, and 4 simultaneous devices.",
  },
  {
    q: "Do you offer a free plan?",
    a: "Yes — the Free plan lets you browse a limited catalog in standard definition on a single device. It is ad-supported. Upgrade anytime to remove ads and unlock the full catalog.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade, downgrade, or cancel whenever you like. Upgrades take effect immediately; downgrades take effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a kids profile option?",
    a: "Yes. Every account supports up to 5 profiles, and any profile can be marked as a Kids profile to only show content rated ALL or 7+.",
  },
];

export default async function SubscriptionPage() {
  const plans = await getPlans();

  // Resolve current subscription for the signed-in user
  const profile = await getCurrentUserProfile();
  let currentPlanSlug: string | null = null;
  if (profile?.user) {
    const sub = await db.subscription.findFirst({
      where: { userId: profile.user.id, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    if (sub?.plan?.slug) currentPlanSlug = sub.plan.slug;
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 pb-20 md:pb-12">
      <header className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
          Pick your plan
        </h1>
        <p className="text-muted-foreground mt-3">
          Watch on any device, cancel anytime. No contracts, no hidden fees.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        {plans.map((plan) => {
          const features: string[] = (() => {
            try {
              const parsed = JSON.parse(plan.features);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })();
          const isCurrent = plan.slug === currentPlanSlug;
          const isHighlight = plan.isPremium && plan.billingPeriod === "MONTHLY";
          const isAnnual = plan.billingPeriod === "YEARLY";
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                isHighlight ? "border-primary shadow-lg shadow-primary/10" : "",
              )}
            >
              {isHighlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  {plan.isPremium && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>
                  {plan.price === 0
                    ? "Free forever"
                    : `${plan.currency === "INR" ? "₹" : ""}${plan.price.toLocaleString()}${isAnnual ? "/year" : "/month"}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <Button className="w-full" variant="secondary" disabled>
                    Current plan
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full"
                    variant={isHighlight ? "default" : "outline"}
                  >
                    <Link
                      href={
                        profile?.user
                          ? "/account"
                          : `/register?redirect=/subscription`
                      }
                    >
                      {plan.price === 0 ? "Start free" : "Choose plan"}
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </section>

      {/* Compare plans */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-center">Compare plans</h2>
        <div className="overflow-x-auto sv-scroll rounded-md border border-border/40">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-card">
              <tr>
                <th className="text-left p-3 font-semibold">Feature</th>
                {["free", "basic", "premium", "premium-annual"].map((slug) => {
                  const plan = plans.find((p) => p.slug === slug);
                  return (
                    <th key={slug} className="text-left p-3 font-semibold">
                      {plan?.name ?? slug}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.key} className="border-t border-border/40">
                  <td className="p-3 text-muted-foreground">{row.label}</td>
                  {["free", "basic", "premium", "premium-annual"].map((slug) => (
                    <td key={slug} className="p-3">
                      {COMPARISON[slug]?.[row.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
