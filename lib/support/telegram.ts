import "server-only";
import { supportDb } from "@/lib/support/server";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminChatIds = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(value => value.trim()).filter(Boolean);

export function escapeTelegramHtml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(chatId: string, text: string, options?: Record<string, unknown>) {
  if (!botToken) throw new Error("Telegram bot is not configured");
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...options }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Telegram message delivery failed");
  const result = await response.json();
  if (!result.ok) throw new Error("Telegram message delivery failed");
  return result;
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
