import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const items = await db.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });
  return apiSuccess({ items });
});
