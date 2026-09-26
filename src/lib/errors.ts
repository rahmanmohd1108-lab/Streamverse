/**
 * StreamVerse API Error Handling
 *
 * Unified error response shape used across all API routes:
 *
 *   { error: { code: string, message: string, details?: any } }
 */
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "PAYMENT_REQUIRED";

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export class HttpError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = statusFor(code);
    this.details = details;
  }
}

export function statusFor(code: ErrorCode): number {
  switch (code) {
    case "BAD_REQUEST":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "VALIDATION_ERROR":
      return 422;
    case "RATE_LIMITED":
      return 429;
    case "PAYMENT_REQUIRED":
      return 402;
    case "INTERNAL_ERROR":
      return 500;
    default:
      return 500;
  }
}

export function apiError(code: ErrorCode, message: string, details?: unknown) {
  const status = statusFor(code);
  return NextResponse.json(
    { error: { code, message, details } },
    { status },
  );
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Wrap an async handler to centralise error handling and convert
 * known error shapes (HttpError, ZodError, Prisma errors, AuthError)
 * into a consistent JSON response.
 */
export function withErrorHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>,
) {
  return async (...args: TArgs): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return apiError(err.code, err.message, err.details);
      }
      if (err instanceof Error && err.name === "AuthError") {
        if (err.message === "UNAUTHORIZED") {
          return apiError("UNAUTHORIZED", "Authentication required");
        }
        return apiError("FORBIDDEN", "You do not have access to this resource");
      }
      if (err instanceof ZodError) {
        return apiError(
          "VALIDATION_ERROR",
          "Invalid request body",
          err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        );
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          const target = (err.meta?.target as string[])?.join(", ") ?? "field";
          return apiError(
            "CONFLICT",
            `A record with this ${target} already exists`,
          );
        }
        if (err.code === "P2025") {
          return apiError("NOT_FOUND", "Record not found");
        }
        return apiError("BAD_REQUEST", err.message);
      }
      console.error("[api] Unhandled error:", err);
      return apiError(
        "INTERNAL_ERROR",
        err instanceof Error ? err.message : "Unexpected server error",
      );
    }
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}
