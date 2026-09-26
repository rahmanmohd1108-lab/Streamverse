import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const PUT = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Plan not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name;
    if (typeof body?.price === "number") data.price = body.price;
    if (typeof body?.currency === "string" && body.currency.trim())
      data.currency = body.currency;
    if (body?.billingPeriod === "MONTHLY" || body?.billingPeriod === "YEARLY")
      data.billingPeriod = body.billingPeriod;
    if (typeof body?.features === "string") data.features = body.features;
    if (typeof body?.isPremium === "boolean") data.isPremium = body.isPremium;
    if (typeof body?.active === "boolean") data.active = body.active;

    const plan = await db.subscriptionPlan.update({ where: { id }, data });
    await writeAudit(req, admin, "update", "plan", plan.id, {
      name: plan.name,
    });
    return apiSuccess({ plan });
  },
);

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = await db.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!existing) return apiError("NOT_FOUND", "Plan not found");

    // Soft delete — set active=false instead of hard delete.
    const plan = await db.subscriptionPlan.update({
      where: { id },
      data: { active: false },
    });

    await writeAudit(req, admin, "delete", "plan", plan.id, {
      name: plan.name,
      hadSubs: existing._count.subscriptions,
    });
    return apiSuccess({ ok: true, plan });
  },
);
