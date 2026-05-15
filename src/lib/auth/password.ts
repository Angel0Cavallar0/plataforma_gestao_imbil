import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import {
  PASSWORD_TOKEN_TTL_MINUTES,
  PASSWORD_CHANGE_INTERVAL_DAYS,
} from "@/lib/constants";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function getTokenExpiry(): Date {
  return new Date(Date.now() + PASSWORD_TOKEN_TTL_MINUTES * 60 * 1000);
}

export function isPasswordExpired(passwordChangedAt: string | null): boolean {
  if (!passwordChangedAt) return true;
  const changed = new Date(passwordChangedAt);
  const limit = new Date();
  limit.setDate(limit.getDate() - PASSWORD_CHANGE_INTERVAL_DAYS);
  return changed < limit;
}

export function buildPasswordLink(token: string, type: "cadastrar" | "trocar"): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const path = type === "cadastrar" ? "cadastrar-senha" : "trocar-senha";
  return `${base}/${path}/${token}`;
}
