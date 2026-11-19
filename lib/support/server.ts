import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const apiUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
export const ADMIN_COOKIE = "nexvor_support_admin";

export function requireSupportConfig() {
  if (!apiUrl || !secretKey) throw new Error("Support service is not configured");
}

export async function supportDb(path: string, init: RequestInit = {}) {
  requireSupportConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", secretKey!);
  headers.set("Authorization", `Bearer ${secretKey!}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? String(data.message) : "Database request failed";
    throw new Error(message);
  }
  return data;
}

export function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function newAccessToken() {
  return randomBytes(32).toString("hex");
}

function sessionSignature(payload: string) {
  requireSupportConfig();
  return createHmac("sha256", secretKey!).update(payload).digest("hex");
}

export function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  const payload = String(expiresAt);
  return `${payload}.${sessionSignature(payload)}`;
}

export function isAdminSessionValid(value?: string) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !/^\d+$/.test(payload)) return false;
  if (Number(payload) <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(signature, sessionSignature(payload));
}

export function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
