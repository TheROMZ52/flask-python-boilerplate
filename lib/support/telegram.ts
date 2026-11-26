import "server-only";
import { supportDb } from "@/lib/support/server";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminChatIds = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(value => value.trim()).filter(Boolean);

export function escapeTelegramHtml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitizeTelegramString(value: string) {
  let output = "";
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    const nonCharacter =
      code === 0xfffd ||
      code === 0xfffe ||
      code === 0xffff ||
      (code >= 0xfdd0 && code <= 0xfdef) ||
      (code <= 0x10ffff && (code & 0xffff) >= 0xfffe);
    const invalidControl =
      (code >= 0x00 && code <= 0x08) ||
      (code >= 0x0b && code <= 0x1f) ||
      (code >= 0x7f && code <= 0x9f);
    const loneSurrogate = code >= 0xd800 && code <= 0xdfff;
    if (nonCharacter || invalidControl || loneSurrogate) continue;
    output += character;
  }
  return output;
}

function normalizeTelegramPayload(value: unknown): unknown {
  if (typeof value === "string") return sanitizeTelegramString(value);
  if (Array.isArray(value)) return value.map(normalizeTelegramPayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeTelegramPayload(item)]),
    );
  }
  return value;
}

function findInvalidUnicode(value: unknown, path = "$", found: string[] = []): string[] {
  if (typeof value === "string") {
    for (const character of value) {
      const code = character.codePointAt(0) ?? 0;
      const nonCharacter =
        code === 0xfffd ||
        code === 0xfffe ||
        code === 0xffff ||
        (code >= 0xfdd0 && code <= 0xfdef) ||
        (code <= 0x10ffff && (code & 0xffff) >= 0xfffe);
      const invalidControl =
        (code >= 0x00 && code <= 0x08) ||
        (code >= 0x0b && code <= 0x1f) ||
        (code >= 0x7f && code <= 0x9f);
      const loneSurrogate = code >= 0xd800 && code <= 0xdfff;
      if (nonCharacter || invalidControl || loneSurrogate) {
        found.push(path + ":U+" + code.toString(16).toUpperCase());
        if (found.length >= 20) return found;
      }
    }
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findInvalidUnicode(item, path + "[" + index + "]", found));
  } else if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) =>
      findInvalidUnicode(item, path + "." + key, found),
    );
  }
  return found;
}

function keyboardStats(payload: Record<string, unknown>) {
  const markup = payload.reply_markup as {
    inline_keyboard?: Array<Array<{ text?: unknown }>>;
    keyboard?: Array<Array<{ text?: unknown }>>;
  } | undefined;
  const inlineRows = Array.isArray(markup?.inline_keyboard) ? markup.inline_keyboard : [];
  const replyRows = Array.isArray(markup?.keyboard) ? markup.keyboard : [];
  return {
    inlineButtons: inlineRows.reduce((sum, row) => sum + row.length, 0),
    replyButtons: replyRows.reduce((sum, row) => sum + row.length, 0),
    inlineTextBytes: inlineRows.flat().reduce((sum, button) =>
      sum + (typeof button.text === "string" ? new TextEncoder().encode(button.text).length : 0), 0),
  };
}

export async function telegramApiRequest(method: string, payload: Record<string, unknown>) {
  if (!botToken) throw new Error("Telegram bot is not configured");
  const invalidUnicode = findInvalidUnicode(payload);
  const safePayload = normalizeTelegramPayload(payload) as Record<string, unknown>;
  const serialized = JSON.stringify(safePayload);
  const encoded = new TextEncoder().encode(serialized);
  new TextDecoder("utf-8", { fatal: true }).decode(encoded);

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: encoded,
    cache: "no-store",
  });
  const result = await response.json().catch(() => null) as {
    ok?: boolean;
    error_code?: number;
    description?: string;
    result?: { message_id?: number };
  } | null;
  const keyboard = keyboardStats(safePayload);

  if (!response.ok || !result?.ok) {
    const code = result?.error_code ?? response.status;
    const description = typeof result?.description === "string"
      ? result.description.replace(/[\\r\\n\\t]+/g, " ").slice(0, 180)
      : "No error description";
    console.error("[telegram-api] request failed", {
      method,
      status: response.status,
      errorCode: code,
      description,
      invalidUnicode,
      ...keyboard,
    });
    throw new Error(`Telegram API ${code}: ${description}`);
  }

  console.info("[telegram-api] request succeeded", {
    method,
    messageId: result.result?.message_id ?? null,
    invalidUnicodeCount: invalidUnicode.length,
    ...keyboard,
  });
  return result;
}

export async function sendTelegramMessage(chatId: string, text: string, options?: Record<string, unknown>) {
  return telegramApiRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...options,
  });
}

export async function notifyAdminAboutNewTicket(ticketId: string) {
  if (!botToken || !adminChatIds.length) return;
  const rows = await supportDb(
    `nexvor_support_tickets?id=eq.${encodeURIComponent(ticketId)}&select=id,first_name,last_name,age,telegram_username,subject,created_at&limit=1`,
  ) as Array<Record<string, unknown>>;
  const ticket = rows?.[0];
  if (!ticket) return;
  const messages = await supportDb(
    `nexvor_support_messages?ticket_id=eq.${encodeURIComponent(ticketId)}&select=body&order=created_at.asc&limit=1`,
  ) as Array<{ body: string }>;
  const text = [
    "🚨 <b>تیکت جدید NexvorDEV</b>",
    "",
    `<b>شناسه:</b> <code>${escapeTelegramHtml(ticket.id)}</code>`,
    `<b>نام مشتری:</b> ${escapeTelegramHtml(ticket.first_name)} ${escapeTelegramHtml(ticket.last_name)}`,
    `<b>سن:</b> ${escapeTelegramHtml(ticket.age)}`,
    `<b>تلگرام:</b> @${escapeTelegramHtml(ticket.telegram_username)}`,
    `<b>موضوع:</b> ${escapeTelegramHtml(ticket.subject)}`,
    "",
    `<b>پیام اولیه:</b>\n${escapeTelegramHtml(messages?.[0]?.body || "—").slice(0, 2500)}`,
    "",
    "برای مشاهده و مدیریت، دکمه زیر را بزن.",
  ].join("\n");
  await Promise.allSettled(adminChatIds.map(chatId => sendTelegramMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [[
        { text: "🎫 مشاهده و مدیریت تیکت", callback_data: `ticket:${ticketId}` },
        { text: "📬 همه تیکت‌ها", callback_data: "tickets:0" },
      ]],
    },
  })));
}

export async function notifyAdminAboutNewServiceRequest(requestId: string) {
  if (!botToken || !adminChatIds.length) return;
  const rows=await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(requestId)}&select=*&limit=1`) as Array<Record<string,unknown>>;
  const item=rows?.[0]; if(!item) return;
  const priority=String(item.priority)==="critical"?"🚨 اضطراری":String(item.priority)==="urgent"?"⚡ فوری":"عادی";
  const text=[
    "🆕 <b>درخواست خدمات جدید NexvorDEV</b>",
    "",
    `<b>شناسه:</b> <code>${escapeTelegramHtml(item.id)}</code>`,
    `<b>مشتری:</b> ${escapeTelegramHtml(item.customer_name)}`,
    `<b>راه ارتباطی:</b> ${escapeTelegramHtml(item.telegram_contact)}`,
    `<b>خدمت:</b> ${escapeTelegramHtml(item.service_type)}`,
    `<b>اولویت:</b> ${priority}`,
    "",
    "<b>توضیحات:</b>",
    escapeTelegramHtml(item.details).slice(0,2300)
  ].join("\n");
  await Promise.allSettled(adminChatIds.map(chatId=>sendTelegramMessage(chatId,text,{
    reply_markup:{inline_keyboard:[[
      {text:"📦 مشاهده و مدیریت",callback_data:`srview:${requestId}`},
      {text:"📋 همه درخواست‌ها",callback_data:"requests:0"}
    ]]}
  })));
}

export async function notifyAdminAboutCustomerMessage(ticketId: string) {
  if (!botToken || !adminChatIds.length) return;
  const rows = await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(ticketId)}&select=id,first_name,last_name,subject&limit=1`) as Array<Record<string, unknown>>;
  const ticket = rows?.[0];
  if (!ticket) return;
  const messages = await supportDb(`nexvor_support_messages?ticket_id=eq.${encodeURIComponent(ticketId)}&sender_role=eq.customer&select=body&order=created_at.desc&limit=1`) as Array<{ body: string }>;
  const text = [
    "💬 <b>پیام جدید از مشتری</b>",
    `<b>مشتری:</b> ${escapeTelegramHtml(ticket.first_name)} ${escapeTelegramHtml(ticket.last_name)}`,
    `<b>موضوع:</b> ${escapeTelegramHtml(ticket.subject)}`,
    "",
    escapeTelegramHtml(messages?.[0]?.body || "").slice(0, 2500),
  ].join("\n");
  await Promise.allSettled(adminChatIds.map(chatId => sendTelegramMessage(chatId, text, {
    reply_markup: { inline_keyboard: [[{ text: "🎫 مشاهده و پاسخ", callback_data: `ticket:${ticketId}` }]] },
  })));
}

export async function notifyAdminAboutOrderMessage(requestId: string) {
  if (!botToken || !adminChatIds.length) return;
  const rows = await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(requestId)}&select=id,customer_name,service_type,priority,telegram_contact&limit=1`) as Array<Record<string, unknown>>;
  const item = rows[0];
  if (!item) return;
  const messages = await supportDb(`nexvor_order_messages?request_id=eq.${encodeURIComponent(requestId)}&sender_role=eq.customer&select=body&order=created_at.desc&limit=1`) as Array<{ body: string }>;
  const text = ["💬 <b>پیام جدید درباره سفارش</b>", "", `<b>شناسه:</b> <code>${escapeTelegramHtml(item.id)}</code>`, `<b>مشتری:</b> ${escapeTelegramHtml(item.customer_name)}`, `<b>خدمت:</b> ${escapeTelegramHtml(item.service_type)}`, `<b>راه ارتباطی:</b> ${escapeTelegramHtml(item.telegram_contact)}`, "", escapeTelegramHtml(messages[0]?.body || "").slice(0, 2500)].join("\n");
  await Promise.allSettled(adminChatIds.map(chatId => sendTelegramMessage(chatId, text, { reply_markup: { inline_keyboard: [[{ text: "📦 مشاهده و پاسخ", callback_data: `srview:${requestId}` }]] } })));
}
