import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { supportDb } from "@/lib/support/server";
import { sessionUser } from "@/lib/supabase/server";

export type Profile = { user_id: string; first_name: string; last_name: string; email: string | null; email_verified_at: string | null; telegram_chat_id?: string | null; telegram_username?: string | null; telegram_linked_at?: string | null };

export const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();
export const validEmail = (value: string) => value.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export async function getProfile(userId: string) {
  const rows = (await supportDb(`nexvor_profiles?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`)) as Profile[];
  return rows?.[0] ?? null;
}

export async function getProfileByEmail(email: string) {
  const rows = (await supportDb(`nexvor_profiles?email=eq.${encodeURIComponent(email)}&select=*&limit=1`)) as Profile[];
  return rows?.[0] ?? null;
}

export async function upsertProfile(profile: Partial<Profile> & { user_id: string }) {
  await supportDb("nexvor_profiles?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ ...profile, updated_at: new Date().toISOString() }),
  });
}

function oauthProvider(user: User) {
  const providers = Array.isArray(user.app_metadata?.providers) ? (user.app_metadata.providers as string[]) : [];
  return providers.some(provider => provider !== "email");
}

export function displayName(profile: Profile | null, user?: User | null) {
  const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  const meta = user?.user_metadata || {};
  return String(meta.full_name || meta.name || meta.user_name || user?.email?.split("@")[0] || "کاربر");
}

export async function currentAccount() {
  const user = await sessionUser();
  if (!user) return null;
  let profile = await getProfile(user.id);
  let verified = !!profile?.email_verified_at;
  if (!verified && oauthProvider(user) && user.email_confirmed_at && user.email) {
    const meta = user.user_metadata || {};
    const parts = String(meta.full_name || meta.name || "").trim().split(/\s+/);
    await upsertProfile({ user_id: user.id, email: normalizeEmail(user.email), first_name: profile?.first_name || String(meta.first_name || parts[0] || ""), last_name: profile?.last_name || String(meta.last_name || parts.slice(1).join(" ") || ""), email_verified_at: new Date().toISOString() });
    profile = await getProfile(user.id);
    verified = true;
  }
  return { user, profile, verified, email: normalizeEmail(user.email), name: displayName(profile, user) };
}

export async function verifiedAccount() {
  const account = await currentAccount();
  return account?.verified ? account : null;
}

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createEmailToken(userId: string, purpose: "verify" | "reset", ttlMs: number) {
  const token = randomBytes(32).toString("hex");
  await supportDb(`nexvor_email_tokens?user_id=eq.${encodeURIComponent(userId)}&purpose=eq.${purpose}&used_at=is.null`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ used_at: new Date().toISOString() }) });
  await supportDb("nexvor_email_tokens", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ token_hash: hash(token), user_id: userId, purpose, expires_at: new Date(Date.now() + ttlMs).toISOString() }) });
  return token;
}

export async function consumeEmailToken(token: string, purpose: "verify" | "reset") {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const rows = (await supportDb(`nexvor_email_tokens?token_hash=eq.${hash(token)}&purpose=eq.${purpose}&used_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`, {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ used_at: new Date().toISOString() }),
  })) as Array<{ user_id: string }>;
  return rows?.[0]?.user_id ?? null;
}

export async function createNotification(userId: string, kind: string, title: string, body = "", href?: string) {
  await supportDb("nexvor_notifications", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ user_id: userId, kind, title, body, href: href ?? null }) }).catch(() => null);
}
