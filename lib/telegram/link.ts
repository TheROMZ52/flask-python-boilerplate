import "server-only";
import { randomBytes } from "node:crypto";
import { hashAccessToken, supportDb } from "@/lib/support/server";

const expiry = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

export async function createSiteLinkToken(userId: string) {
  const token = randomBytes(24).toString("hex");
  await supportDb("nexvor_link_codes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ code_hash: hashAccessToken(token), kind: "site", user_id: userId, expires_at: expiry(10) }) });
  return token;
}

export async function createBotLinkCode(chatId: string, username?: string) {
  const code = randomBytes(6).toString("hex").toUpperCase();
  await supportDb("nexvor_link_codes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ code_hash: hashAccessToken(code), kind: "bot", chat_id: chatId, username: username || null, expires_at: expiry(10) }) });
  return code;
}

async function attachExistingRecords(userId: string, chatId: string, username?: string) {
  const options = { method: "PATCH", headers: { Prefer: "return=minimal" } };
  const profiles = await supportDb(`nexvor_profiles?user_id=eq.${encodeURIComponent(userId)}&select=telegram_chat_id&limit=1`) as Array<{ telegram_chat_id: string | null }>;
  const previousChatId = profiles[0]?.telegram_chat_id;
  if (previousChatId && previousChatId !== chatId) {
    await Promise.all([
      supportDb(`nexvor_service_requests?user_id=eq.${encodeURIComponent(userId)}&telegram_chat_id=eq.${encodeURIComponent(previousChatId)}`, { ...options, body: JSON.stringify({ telegram_chat_id: null }) }),
      supportDb(`nexvor_support_tickets?user_id=eq.${encodeURIComponent(userId)}&telegram_chat_id=eq.${encodeURIComponent(previousChatId)}`, { ...options, body: JSON.stringify({ telegram_chat_id: null }) }),
    ]);
  }
  await Promise.all([
    supportDb(`nexvor_service_requests?telegram_chat_id=eq.${encodeURIComponent(chatId)}&user_id=is.null`, { ...options, body: JSON.stringify({ user_id: userId }) }),
    supportDb(`nexvor_support_tickets?telegram_chat_id=eq.${encodeURIComponent(chatId)}&user_id=is.null`, { ...options, body: JSON.stringify({ user_id: userId }) }),
    supportDb(`nexvor_service_requests?user_id=eq.${encodeURIComponent(userId)}&telegram_chat_id=is.null`, { ...options, body: JSON.stringify({ telegram_chat_id: chatId }) }),
    supportDb(`nexvor_support_tickets?user_id=eq.${encodeURIComponent(userId)}&telegram_chat_id=is.null`, { ...options, body: JSON.stringify({ telegram_chat_id: chatId }) }),
    supportDb(`nexvor_profiles?user_id=eq.${encodeURIComponent(userId)}`, { ...options, body: JSON.stringify({ telegram_chat_id: chatId, telegram_username: username || null, telegram_linked_at: new Date().toISOString() }) }),
  ]);
}

export async function completeSiteLink(token: string, chatId: string, username?: string) {
  if (!/^[a-f0-9]{48}$/i.test(token)) return false;
  const now = new Date().toISOString();
  const hash = hashAccessToken(token);
  const candidates = await supportDb(`nexvor_link_codes?code_hash=eq.${hash}&kind=eq.site&used_at=is.null&expires_at=gt.${encodeURIComponent(now)}&select=user_id&limit=1`) as Array<{ user_id: string }>;
  const userId = candidates[0]?.user_id;
  if (!userId) return false;
  const existing = await supportDb(`nexvor_profiles?telegram_chat_id=eq.${encodeURIComponent(chatId)}&select=user_id&limit=1`) as Array<{ user_id: string }>;
  if (existing[0] && existing[0].user_id !== userId) return false;
  const consumed = await supportDb(`nexvor_link_codes?code_hash=eq.${hash}&kind=eq.site&used_at=is.null&expires_at=gt.${encodeURIComponent(now)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ used_at: now, chat_id: chatId, username: username || null }) }) as Array<{ user_id: string }>;
  if (!consumed[0]?.user_id) return false;
  await attachExistingRecords(userId, chatId, username);
  return true;
}

export async function completeBotLink(userId: string, code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-F0-9]{12}$/.test(normalized)) return false;
  const now = new Date().toISOString();
  const hash = hashAccessToken(normalized);
  const candidates = await supportDb(`nexvor_link_codes?code_hash=eq.${hash}&kind=eq.bot&used_at=is.null&expires_at=gt.${encodeURIComponent(now)}&select=chat_id,username&limit=1`) as Array<{ chat_id: string; username: string | null }>;
  const link = candidates[0];
  if (!link?.chat_id) return false;
  const existing = await supportDb(`nexvor_profiles?telegram_chat_id=eq.${encodeURIComponent(link.chat_id)}&select=user_id&limit=1`) as Array<{ user_id: string }>;
  if (existing[0] && existing[0].user_id !== userId) return false;
  const consumed = await supportDb(`nexvor_link_codes?code_hash=eq.${hash}&kind=eq.bot&used_at=is.null&expires_at=gt.${encodeURIComponent(now)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ used_at: now, user_id: userId }) }) as Array<{ chat_id: string }>;
  if (!consumed[0]?.chat_id) return false;
  await attachExistingRecords(userId, link.chat_id, link.username || undefined);
  return true;
}

export async function unlinkTelegram(userId: string) {
  const profiles = await supportDb(`nexvor_profiles?user_id=eq.${encodeURIComponent(userId)}&select=telegram_chat_id&limit=1`) as Array<{ telegram_chat_id: string | null }>;
  const chatId = profiles[0]?.telegram_chat_id;
  if (chatId) {
    const patch = { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ telegram_chat_id: null }) };
    await Promise.all([
      supportDb(`nexvor_service_requests?user_id=eq.${encodeURIComponent(userId)}&telegram_chat_id=eq.${encodeURIComponent(chatId)}`, patch),
      supportDb(`nexvor_support_tickets?user_id=eq.${encodeURIComponent(userId)}&telegram_chat_id=eq.${encodeURIComponent(chatId)}`, patch),
    ]);
  }
  await supportDb(`nexvor_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ telegram_chat_id: null, telegram_username: null, telegram_linked_at: null }) });
}
