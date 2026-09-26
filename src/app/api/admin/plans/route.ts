import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError, slugify } from "@/lib/errors";
import { subscriptionPlanSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  await requireAdmin();
  const items = await db.subscriptionPlan.findMany({
    orderBy: [{ price: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });
  return apiSuccess({ items });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const body = await req.json();
  const parsed = subscriptionPlanSchema.parse(body);

  const slug = parsed.slug?.trim() || slugify(parsed.name);
  const dup = await db.subscriptionPlan.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (dup)
    return apiError("CONFLICT", `Plan with slug "${slug}" already exists`);

  const plan = await db.subscriptionPlan.create({
    data: {
      name: parsed.name,
      slug,
      price: parsed.price,
      currency: parsed.currency,
      billingPeriod: parsed.billingPeriod,
      features: parsed.features,
      isPremium: parsed.isPremium,
      active: parsed.active,
    },
  });

  await writeAudit(req, admin, "create", "plan", plan.id, {
    name: plan.name,
    slug: plan.slug,
    price: plan.price,
  });

  return apiSuccess({ plan }, 201);
});
