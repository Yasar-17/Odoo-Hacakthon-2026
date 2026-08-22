import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dayflow-hackathon-super-secret-key-2026";

export interface JWTPayload {
  userId: string;
  employeeId: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: "Password must be at least 8 characters" };
  if (!/[A-Z]/.test(password)) return { valid: false, error: "Password must contain an uppercase letter" };
  if (!/[a-z]/.test(password)) return { valid: false, error: "Password must contain a lowercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, error: "Password must contain a number" };
  if (!/[!@#$%^&*]/.test(password)) return { valid: false, error: "Password must contain a special character" };
  return { valid: true };
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) return cookieToken;
  
  return null;
}

export type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getUserFromRequest>>>;

export async function getUserFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { userId: BigInt(payload.userId) },
    include: { employee: true },
  });

  if (!user) return null;

  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.userId },
    include: { role: true },
  });
  const role: "EMPLOYEE" | "ADMIN" =
    userRoles.some((ur) => ur.role.roleName?.toUpperCase() === "ADMIN")
      ? "ADMIN"
      : "EMPLOYEE";

  return { ...user, role };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
