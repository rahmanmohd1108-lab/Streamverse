import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const items = await db.language.findMany({
    orderBy: { name: "asc" },
  });
  return apiSuccess({ items });
});
