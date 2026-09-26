import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  withErrorHandler,
  apiSuccess,
  apiError,
  slugify,
} from "@/lib/errors";
import { movieSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const listSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const params = listSchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  const where: { status?: string; OR?: { title?: { contains: string } }[] } = {};
  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [{ title: { contains: params.search } }];
  }

  const [items, total] = await Promise.all([
    db.movie.findMany({
      where,
      include: { genres: true, language: true },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    db.movie.count({ where }),
  ]);

  return apiSuccess({ items, total, page: params.page, limit: params.limit });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const body = await req.json();
  const parsed = movieSchema.parse(body);

  const slug = parsed.slug?.trim() || slugify(parsed.title);

  const existing = await db.movie.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    return apiError("CONFLICT", `Movie with slug "${slug}" already exists`);
  }

  const { genreIds, categoryIds, publishedAt, ...rest } = parsed;

  const movie = await db.movie.create({
    data: {
      ...rest,
      slug,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      genres:
        genreIds && genreIds.length
          ? { connect: genreIds.map((id) => ({ id })) }
          : undefined,
      categories:
        categoryIds && categoryIds.length
          ? { connect: categoryIds.map((id) => ({ id })) }
          : undefined,
    },
    include: { genres: true, categories: true, language: true },
  });

  await writeAudit(req, admin, "create", "movie", movie.id, {
    title: movie.title,
    slug: movie.slug,
    status: movie.status,
  });

  return apiSuccess({ movie }, 201);
});
