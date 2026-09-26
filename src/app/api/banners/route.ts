import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const now = new Date();
  const items = await db.banner.findMany({
    where: {
      active: true,
      AND: [
        {
          OR: [{ startDate: null }, { startDate: { lte: now } }],
        },
        {
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
      ],
    },
    orderBy: { displayOrder: "asc" },
  });
  return apiSuccess({ items });
});
