import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { bannerSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const listSchema = z.object({
  active: z.enum(["true", "false"]).optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const params = listSchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  const items = await db.banner.findMany({
    where:
      params.active === "true"
        ? { active: true }
        : params.active === "false"
          ? { active: false }
          : undefined,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
  return apiSuccess({ items });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const body = await req.json();
  const parsed = bannerSchema.parse(body);

  const banner = await db.banner.create({
    data: {
      title: parsed.title,
      imageUrl: parsed.imageUrl,
      videoUrl: parsed.videoUrl,
      contentId: parsed.contentId,
      contentType: parsed.contentType,
      active: parsed.active,
      displayOrder: parsed.displayOrder,
      startDate: parsed.startDate ? new Date(parsed.startDate) : null,
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
    },
  });

  await writeAudit(req, admin, "create", "banner", banner.id, {
    title: banner.title,
  });

  return apiSuccess({ banner }, 201);
});
