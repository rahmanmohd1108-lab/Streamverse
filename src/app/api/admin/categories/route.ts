import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError, slugify } from "@/lib/errors";
import { categorySchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  await requireAdmin();
  const items = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { movies: true, series: true } } },
  });
  return apiSuccess({ items });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const body = await req.json();
  const parsed = categorySchema.parse(body);

  const slug = parsed.slug?.trim() || slugify(parsed.name);
  const dup = await db.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (dup)
    return apiError("CONFLICT", `Category with slug "${slug}" already exists`);

  const category = await db.category.create({
    data: { name: parsed.name, slug },
  });

  await writeAudit(req, admin, "create", "category", category.id, {
    name: category.name,
    slug: category.slug,
  });

  return apiSuccess({ category }, 201);
});
