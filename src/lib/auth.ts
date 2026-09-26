/**
 * StreamVerse Authentication Library
 *
 * Implements secure email/password auth using bcryptjs for hashing and
 * JWT (HS256) for stateless sessions stored in httpOnly cookies.
 *
 * Designed so that social (Google) OAuth can be plugged in later by
 * adding a /api/auth/google/* route that mints the same JWT.
 */
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { User, Profile } from "@prisma/client";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "streamverse-dev-secret-change-in-production";
const COOKIE_NAME = "sv_session";
const SESSION_DAYS = 7;

export interface SessionPayload {
  sub: string; // user id
  email: string;
  role: string; // USER | ADMIN | CONTENT_MANAGER
  pid?: string; // active profile id (optional, set via separate cookie)
  iat?: number;
  exp?: number;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function signToken(payload: Omit<SessionPayload, "iat" | "exp">) {
  return jwt.sign(payload, AUTH_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as JwtPayload;
    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      pid: decoded.pid,
      iat: decoded.iat,
      exp: decoded.exp,
    } as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  return signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
}

export async function setSessionCookie(token: string, remember = true) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? SESSION_DAYS * 24 * 60 * 60 : 24 * 60 * 60, // 7d or 1d
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete("sv_profile");
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setProfileCookie(profileId: string) {
  const cookieStore = await cookies();
  cookieStore.set("sv_profile", profileId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function getActiveProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("sv_profile")?.value ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.sub } });
}

export async function getCurrentUserProfile(): Promise<{
  user: User;
  profile: Profile | null;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const profileId = await getActiveProfileId();
  let profile: Profile | null = null;
  if (profileId) {
    profile = await db.profile.findFirst({
      where: { id: profileId, userId: user.id },
    });
  }
  if (!profile) {
    profile = await db.profile.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
  }
  return { user, profile };
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    err.name = "AuthError";
    throw err;
  }
  if (user.status !== "ACTIVE") {
    const err = new Error("FORBIDDEN");
    err.name = "AuthError";
    throw err;
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "CONTENT_MANAGER") {
    const err = new Error("FORBIDDEN");
    err.name = "AuthError";
    throw err;
  }
  return user;
}

export async function requireAdminOnly(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const err = new Error("FORBIDDEN");
    err.name = "AuthError";
    throw err;
  }
  return user;
}

export function isAuthError(err: unknown): err is Error {
  return err instanceof Error && err.name === "AuthError";
}

/**
 * Generate a 6-digit numeric OTP / short verification token.
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random URL-safe token for password reset.
 */
export function generateToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}
