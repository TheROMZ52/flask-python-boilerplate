import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { supportDb } from "@/lib/support/server";

export const ACCOUNT_COOKIE = "nexvor_account";
const MAX_AGE = 60 * 60 * 24 * 30;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sign(payload: string) {
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY || "").update(`account:${payload}`).digest("hex");
}

export function createSession(id: string, remember: boolean) {
  const expires = Math.floor(Date.now() / 1000) + (remember ? MAX_AGE : 60 * 60 * 12);
  const payload = `${id}.${expires}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: remember ? MAX_AGE : undefined };
}

export function readSession(value?: string) {
  if (!value) return null;
  const [id, expires, signature] = value.split(".");
  if (!id || !expires || !signature || !/^\d+$/.test(expires) || Number(expires) <= Date.now() / 1000) return null;
  const expected = Buffer.from(sign(`${id}.${expires}`));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}

export type Account = { id: string; username: string; email: string | null; password_hash: string; created_at: string };

export async function findAccount(filter: string) {
  const rows = (await supportDb(`nexvor_accounts?${filter}&select=*&limit=1`)) as Account[];
  return rows[0] || null;
}
