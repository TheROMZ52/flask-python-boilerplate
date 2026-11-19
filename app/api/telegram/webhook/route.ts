import { NextResponse } from "next/server";
import { cleanText, supportDb } from "@/lib/support/server";
import { escapeTelegramHtml, sendTelegramMessage } from "@/lib/support/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramMessage = {
  message_id?: number;
  text?: string;
  chat?: { id?: number };
  from?: { id?: number; is_bot?: boolean };
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

async function reply(chatId: string, text: string) {
  await sendTelegramMessage(chatId, text);
}

async function handleCommand(message: TelegramMessage) {
  const chatId = message.chat?.id;
  const senderId = message.from?.id;
  const text = (message.text || "").trim();
  if (!chatId || !senderId || message.from?.is_bot || !text.startsWith("/")) return;
  if (!process.env.TELEGRAM_ADMIN_CHAT_ID || !process.env.TELEGRAM_ADMIN_USER_ID) return;
  if (String(chatId) !== process.env.TELEGRAM_ADMIN_CHAT_ID || String(senderId) !== process.env.TELEGRAM_ADMIN_USER_ID) {
    await reply(String(chatId), "⛔ این بات فقط برای مدیر NexvorDEV قابل استفاده است.");
    return;
  }

  const [rawCommand, ...parts] = text.split(/\s+/);
  const command = rawCommand.split("@")[0].toLowerCase();
  const argument = parts.join(" ").trim();

  if (command === "/start" || command === "/help") {
    await reply(String(chatId), [
      "سلام! پنل پشتیبانی NexvorDEV فعاله.",
      "",
      "/tickets — فهرست تیکت‌های اخیر",
      "/ticket شناسه — مشاهده گفت‌وگوی تیکت",
      "/reply شناسه متن — پاسخ به مشتری",
      "/close شناسه — بستن تیکت",
      "/open شناسه — بازکردن مجدد تیکت",
    ].join("\n"));
    return;
  }

  if (command === "/tickets") {
    const tickets = await supportDb(
      "nexvor_support_tickets?select=id,first_name,last_name,subject,status,last_message_at&order=last_message_at.desc&limit=15",
    ) as Array<Record<string, unknown>>;
    if (!tickets.length) {
      await reply(String(chatId), "هنوز تیکتی ثبت نشده.");
      return;
    }
    const lines = tickets.map((ticket, index) => {
      const status = ticket.status === "waiting" ? "⏳ منتظر پاسخ" : ticket.status === "answered" ? "✅ پاسخ داده شده" : "🔒 بسته";
      return `${index + 1}. <b>${escapeTelegramHtml(ticket.subject)}</b>\n${escapeTelegramHtml(ticket.first_name)} ${escapeTelegramHtml(ticket.last_name)} · ${status}\n<code>${escapeTelegramHtml(ticket.id)}</code>`;
    });
    await reply(String(chatId), "<b>آخرین تیکت‌ها</b>\n\n" + lines.join("\n\n"));
    return;
  }

  if (command === "/ticket") {
    const id = argument;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      await reply(String(chatId), "فرمت دستور:\n/ticket شناسه-تیکت");
      return;
    }
    const tickets = await supportDb(
      `nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id,first_name,last_name,age,telegram_username,subject,status,created_at,last_message_at&limit=1`,
    ) as Array<Record<string, unknown>>;
    const ticket = tickets[0];
    if (!ticket) {
      await reply(String(chatId), "تیکت پیدا نشد.");
      return;
    }
    const messages = await supportDb(
      `nexvor_support_messages?ticket_id=eq.${encodeURIComponent(id)}&select=sender_role,body,created_at&order=created_at.asc&limit=30`,
    ) as Array<{ sender_role: string; body: string }>;
    const history = messages.map(item => `${item.sender_role === "admin" ? "🛠 مدیر" : "👤 مشتری"}: ${escapeTelegramHtml(item.body)}`).join("\n\n");
    await reply(String(chatId), [
      "<b>جزئیات تیکت</b>",
      `<code>${escapeTelegramHtml(ticket.id)}</code>`,
      `<b>مشتری:</b> ${escapeTelegramHtml(ticket.first_name)} ${escapeTelegramHtml(ticket.last_name)}`,
      `<b>تلگرام:</b> @${escapeTelegramHtml(ticket.telegram_username)}`,
      `<b>موضوع:</b> ${escapeTelegramHtml(ticket.subject)}`,
      `<b>وضعیت:</b> ${escapeTelegramHtml(ticket.status)}`,
      "",
      "<b>گفت‌وگو:</b>",
      history || "هنوز پیامی وجود ندارد.",
      "",
      "پاسخ: /reply شناسه متن پاسخ",
    ].join("\n"));
    return;
  }

  if (command === "/reply") {
    const match = argument.match(/^([0-9a-f-]{36})\s+([\s\S]+)$/i);
    if (!match) {
      await reply(String(chatId), "فرمت دستور:\n/reply شناسه-تیکت متن پاسخ");
      return;
    }
    const [, id, rawBody] = match;
    const body = cleanText(rawBody, 4000);
    const tickets = await supportDb(
      `nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id,status&limit=1`,
    ) as Array<{ id: string; status: string }>;
    if (!tickets[0]) {
      await reply(String(chatId), "تیکت پیدا نشد.");
      return;
    }
    if (tickets[0].status === "closed") {
      await reply(String(chatId), "این تیکت بسته است. ابتدا با /open شناسه آن را باز کن.");
      return;
    }
    await supportDb("nexvor_support_messages", {
      method: "POST",
      body: JSON.stringify({ ticket_id: id, sender_role: "admin", body }),
    });
    const now = new Date().toISOString();
    await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "answered", last_message_at: now, updated_at: now }),
    });
    await reply(String(chatId), "✅ پاسخ در تیکت ثبت شد و در چت سایت نمایش داده می‌شود.");
    return;
  }

  if (command === "/close" || command === "/open") {
    const id = argument;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      await reply(String(chatId), `فرمت دستور:\n${command} شناسه-تیکت`);
      return;
    }
    const tickets = await supportDb(
      `nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
    ) as Array<{ id: string }>;
    if (!tickets[0]) {
      await reply(String(chatId), "تیکت پیدا نشد.");
      return;
    }
    const status = command === "/close" ? "closed" : "waiting";
    await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    });
    await reply(String(chatId), command === "/close" ? "🔒 تیکت بسته شد." : "🔓 تیکت باز شد.");
    return;
  }

  await reply(String(chatId), "دستور شناخته نشد. /help را بزن.");
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const update = await request.json() as TelegramUpdate;
    if (update.message) await handleCommand(update.message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
