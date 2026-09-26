import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await requireUser();

  const [current, plans] = await Promise.all([
    db.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      include: { plan: true, payments: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    }),
    db.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    }),
  ]);

  return apiSuccess({ current, plans });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json();
  const planId = String(body?.planId ?? "").trim();
  if (!planId) {
    return apiError("BAD_REQUEST", "planId is required");
  }

  const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) {
    return apiError("NOT_FOUND", "Subscription plan not found");
  }

  const provider = process.env.PAYMENT_PROVIDER || "demo";
  if (provider !== "demo") {
    return apiError(
      "PAYMENT_REQUIRED",
      "Payment provider not configured for live mode",
    );
  }

  // Demo mode: instant success
  const now = new Date();
  const endDate = new Date(
    now.getTime() +
      (plan.billingPeriod === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000,
  );

  // Mark any prior ACTIVE sub as EXPIRED
  await db.subscription.updateMany({
    where: { userId: user.id, status: "ACTIVE" },
    data: { status: "EXPIRED", autoRenew: false },
  });

  const subscription = await db.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: "ACTIVE",
      startDate: now,
      endDate,
      autoRenew: true,
      paymentProviderReference: `demo_${Date.now()}`,
    },
    include: { plan: true },
  });

  const payment = await db.payment.create({
    data: {
      userId: user.id,
      subscriptionId: subscription.id,
      amount: plan.price,
      currency: plan.currency,
      provider: "demo",
      providerReference: subscription.paymentProviderReference!,
      status: "SUCCESS",
    },
  });

  // Notify the user
  await db.notification.create({
    data: {
      userId: user.id,
      title: "Subscription activated",
      message: `Your ${plan.name} plan is now active. Enjoy unlimited streaming!`,
      type: "subscription",
      actionUrl: "/account",
    },
  });

  return apiSuccess({ subscription, payment }, 201);
});
