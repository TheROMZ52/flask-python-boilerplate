import { NextResponse } from "next/server";
import { cleanText, supportDb } from "@/lib/support/server";
import { escapeTelegramHtml, sendTelegramMessage } from "@/lib/support/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramMessage = {
  message_id?: number;
  text?: string;
  chat?: { id?: number; type?: string };
  from?: { id?: number; is_bot?: boolean };
};

type TelegramCallbackQuery = {
  id: string;
  data?: string;
  from?: { id?: number; is_bot?: boolean };
  message?: TelegramMessage;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type Ticket = Record<string, unknown> & {
  id: string;
  first_name: string;
  last_name: string;
  subject: string;
  status: string;
};

const adminIds = () => (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(value => value.trim()).filter(Boolean);

async function reply(chatId: string, text: string, replyMarkup?: Record<string, unknown>) {
  await sendTelegramMessage(chatId, text, replyMarkup ? { reply_markup: replyMarkup } : undefined);
}

async function telegramMethod(method: string, payload: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram bot is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error("Telegram API request failed");
  return result;
}

async function answerCallback(id: string, text?: string) {
  try {
    await telegramMethod("answerCallbackQuery", { callback_query_id: id, text, show_alert: false });
  } catch {}
}

async function editCallbackMessage(callback: TelegramCallbackQuery, text: string, replyMarkup?: Record<string, unknown>) {
  const chatId = callback.message?.chat?.id;
  const messageId = callback.message?.message_id;
  if (!chatId || !messageId) return;
  await telegramMethod("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

function statusLabel(status: unknown) {
  return status === "waiting" ? "⏳ منتظر پاسخ" : status === "answered" ? "✅ پاسخ داده شده" : "🔒 بسته";
}

function ticketKeyboard(ticket: Ticket) {
  const statusAction = ticket.status === "closed" ? "open" : "close";
  const statusText = statusAction === "open" ? "🔓 بازکردن" : "🔒 بستن";
  return {
    inline_keyboard: [
      [
        { text: "✍️ پاسخ سریع", callback_data: `reply:${ticket.id}` },
        { text: statusText, callback_data: `${statusAction}:${ticket.id}` },
      ],
      [
        { text: "🔄 بروزرسانی", callback_data: `ticket:${ticket.id}` },
        { text: "📋 فهرست تیکت‌ها", callback_data: "tickets:0" },
      ],
    ],
  };
}

async function getTicket(id: string) {
  const rows = await supportDb(
    `nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id,first_name,last_name,age,telegram_username,subject,status,created_at,last_message_at&limit=1`,
  ) as Ticket[];
  return rows[0] || null;
}

async function ticketDetails(id: string) {
  const ticket = await getTicket(id);
  if (!ticket) return null;
  const messages = await supportDb(
    `nexvor_support_messages?ticket_id=eq.${encodeURIComponent(id)}&select=sender_role,body,created_at&order=created_at.asc&limit=30`,
  ) as Array<{ sender_role: string; body: string; created_at?: string }>;
  const history = messages.map(item => {
    const role = item.sender_role === "admin" ? "🛠 مدیر" : "👤 مشتری";
    const body = escapeTelegramHtml(item.body).slice(0, 1800);
    return `${role}: ${body}`;
  }).join("\n\n");
  const text = [
    "🧾 <b>جزئیات تیکت</b>",
    `<code>${escapeTelegramHtml(ticket.id)}</code>`,
    `<b>مشتری:</b> ${escapeTelegramHtml(ticket.first_name)} ${escapeTelegramHtml(ticket.last_name)}`,
    `<b>سن:</b> ${escapeTelegramHtml(ticket.age)}`,
    `<b>تلگرام:</b> @${escapeTelegramHtml(ticket.telegram_username)}`,
    `<b>موضوع:</b> ${escapeTelegramHtml(ticket.subject)}`,
    `<b>وضعیت:</b> ${statusLabel(ticket.status)}`,
    "",
    "<b>گفت‌وگو:</b>",
    history || "هنوز پیامی وجود ندارد.",
  ].join("\n");
  return { ticket, text };
}

async function showTickets(chatId: string, page = 0, edit?: TelegramCallbackQuery) {
  const safePage = Math.max(0, Math.min(page, 100));
  const from = safePage * 8;
  const tickets = await supportDb(
    `nexvor_support_tickets?select=id,first_name,last_name,subject,status,last_message_at&order=last_message_at.desc&limit=9&offset=${from}`,
  ) as Ticket[];
  const hasNext = tickets.length > 8;
  const visible = tickets.slice(0, 8);
  const lines = visible.map((ticket, index) => {
    const title = escapeTelegramHtml(String(ticket.subject || "بدون موضوع")).slice(0, 90);
    const customer = escapeTelegramHtml(`${ticket.first_name || ""} ${ticket.last_name || ""}`.trim());
    return `${from + index + 1}. <b>${title}</b>\n${customer} · ${statusLabel(ticket.status)}`;
  });
  const keyboardRows = visible.map(ticket => [{
    text: `🎫 ${String(ticket.subject || "تیکت").slice(0, 24)} · ${ticket.status === "closed" ? "بسته" : ticket.status === "waiting" ? "منتظر" : "پاسخ"}`,
    callback_data: `ticket:${ticket.id}`,
  }]);
  const nav = [];
  if (safePage > 0) nav.push({ text: "⬅️ قبلی", callback_data: `tickets:${safePage - 1}` });
  if (hasNext) nav.push({ text: "بعدی ➡️", callback_data: `tickets:${safePage + 1}` });
  if (nav.length) keyboardRows.push(nav);
  keyboardRows.push([{ text: "📊 داشبورد", callback_data: "dashboard" }, { text: "🔄 بروزرسانی", callback_data: `tickets:${safePage}` }]);
  const output = visible.length
    ? `<b>📬 تیکت‌های پشتیبانی</b> · صفحه ${safePage + 1}\n\n${lines.join("\n\n")}`
    : "📭 در این صفحه تیکتی وجود ندارد.";
  const markup = { inline_keyboard: keyboardRows };
  if (edit) await editCallbackMessage(edit, output, markup);
  else await reply(chatId, output, markup);
}

async function showDashboard(chatId: string, edit?: TelegramCallbackQuery) {
  const rows = await supportDb(
    "nexvor_support_tickets?select=status",
  ) as Array<{ status: string }>;
  const total = rows.length;
  const waiting = rows.filter(item => item.status === "waiting").length;
  const answered = rows.filter(item => item.status === "answered").length;
  const closed = rows.filter(item => item.status === "closed").length;
  const text = [
    "⚡ <b>NexvorDEV · داشبورد مدیریت</b>",
    "",
    `🎫 کل تیکت‌ها: <b>${total}</b>`,
    `⏳ منتظر پاسخ: <b>${waiting}</b>`,
    `✅ پاسخ داده‌شده: <b>${answered}</b>`,
    `🔒 بسته‌شده: <b>${closed}</b>`,
    "",
    "از منوی زیر برای مدیریت استفاده کن.",
  ].join("\n");
  const markup = {
    inline_keyboard: [
      [{ text: "📬 مشاهده تیکت‌ها", callback_data: "tickets:0" }],
      [{ text: "🔎 جست‌وجوی تیکت", callback_data: "search_help" }, { text: "🔄 بروزرسانی آمار", callback_data: "dashboard" }],
      [{ text: "📖 راهنمای دستورات", callback_data: "help" }],
    ],
  };
  if (edit) await editCallbackMessage(edit, text, markup);
  else await reply(chatId, text, markup);
}

async function setTicketStatus(id: string, status: "waiting" | "closed") {
  const ticket = await getTicket(id);
  if (!ticket) return null;
  await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
  return getTicket(id);
}

async function handleCallback(callback: TelegramCallbackQuery) {
  const senderId = callback.from?.id;
  const chatId = callback.message?.chat?.id;
  if (!senderId || !chatId || String(senderId) !== String(chatId) || !adminIds().includes(String(senderId))) {
    await answerCallback(callback.id, "⛔ دسترسی غیرمجاز");
    return;
  }
  const data = callback.data || "";
  try {
    if (data === "dashboard") {
      await showDashboard(String(chatId), callback);
    } else if (data === "help") {
      await editCallbackMessage(callback, helpText(), { inline_keyboard: [[{ text: "⬅️ داشبورد", callback_data: "dashboard" }]] });
    } else if (data === "search_help") {
      await editCallbackMessage(callback, "🔎 برای جست‌وجو از دستور زیر استفاده کن:\n\n<code>/search عبارت</code>\n\nمی‌تونی نام مشتری، آیدی تلگرام، موضوع یا بخشی از شناسه رو وارد کنی.", { inline_keyboard: [[{ text: "⬅️ داشبورد", callback_data: "dashboard" }]] });
    } else if (data.startsWith("tickets:")) {
      const page = Number(data.split(":")[1]);
      await showTickets(String(chatId), Number.isFinite(page) ? page : 0, callback);
    } else if (data.startsWith("ticket:")) {
      const id = data.slice(7);
      const detail = await ticketDetails(id);
      if (!detail) await editCallbackMessage(callback, "تیکت پیدا نشد.");
      else await editCallbackMessage(callback, detail.text, ticketKeyboard(detail.ticket));
    } else if (data.startsWith("close:") || data.startsWith("open:")) {
      const [action, id] = data.split(":");
      const ticket = await setTicketStatus(id, action === "close" ? "closed" : "waiting");
      if (!ticket) await editCallbackMessage(callback, "تیکت پیدا نشد.");
      else {
        const detail = await ticketDetails(id);
        await editCallbackMessage(callback, detail?.text || "وضعیت بروزرسانی شد.", ticketKeyboard(ticket));
        await answerCallback(callback.id, action === "close" ? "تیکت بسته شد" : "تیکت دوباره باز شد");
        return;
      }
    } else if (data.startsWith("reply:")) {
      const id = data.slice(6);
      await editCallbackMessage(callback, `✍️ برای پاسخ به این تیکت، دستور زیر را در همین گفت‌وگو ارسال کن:\n\n<code>/reply ${escapeTelegramHtml(id)} متن پاسخ</code>\n\nبرای لغو، این پیام را نادیده بگیر.`, { inline_keyboard: [[{ text: "⬅️ بازگشت به تیکت", callback_data: `ticket:${id}` }]] });
    }
    await answerCallback(callback.id);
  } catch {
    await answerCallback(callback.id, "خطا در اجرای عملیات؛ دوباره تلاش کن.");
  }
}

function helpText() {
  return [
    "⚡ <b>راهنمای پنل NexvorDEV</b>",
    "",
    "/panel — داشبورد مدیریتی",
    "/tickets — فهرست تیکت‌ها",
    "/ticket شناسه — جزئیات تیکت",
    "/reply شناسه متن — پاسخ به مشتری",
    "/close شناسه — بستن تیکت",
    "/open شناسه — بازکردن تیکت",
    "/search عبارت — جست‌وجوی تیکت",
    "/stats — آمار پشتیبانی",
    "/whoami — شناسه تلگرام شما",
    "/help — راهنما",
  ].join("\n");
}

async function handleCommand(message: TelegramMessage) {
  const chatId = message.chat?.id;
  const senderId = message.from?.id;
  const text = (message.text || "").trim();
  if (!chatId || !senderId || message.from?.is_bot || !text.startsWith("/")) return;
  if (!adminIds().length) return;
  if (message.chat?.type !== "private" || String(chatId) !== String(senderId) || !adminIds().includes(String(senderId))) {
    await reply(String(chatId), "⛔ این بات فقط در گفت‌وگوی خصوصی و برای مدیران مجاز NexvorDEV فعال است.");
    return;
  }

  const [rawCommand, ...parts] = text.split(/\s+/);
  const command = rawCommand.split("@")[0].toLowerCase();
  const argument = parts.join(" ").trim();

  if (command === "/start" || command === "/panel") {
    await showDashboard(String(chatId));
    return;
  }
  if (command === "/help") {
    await reply(String(chatId), helpText(), { inline_keyboard: [[{ text: "⚡ داشبورد مدیریت", callback_data: "dashboard" }]] });
    return;
  }
  if (command === "/whoami") {
    await reply(String(chatId), `🪪 شناسه تلگرام شما:\n<code>${senderId}</code>\n\nدسترسی مدیر: ✅ مجاز`);
    return;
  }
  if (command === "/stats") {
    await showDashboard(String(chatId));
    return;
  }
  if (command === "/tickets") {
    await showTickets(String(chatId), 0);
    return;
  }
  if (command === "/search") {
    if (!argument) {
      await reply(String(chatId), "فرمت دستور:\n<code>/search عبارت</code>");
      return;
    }
    const term = argument.replace(/[,%()]/g, " ").trim().slice(0, 80);
    const pattern = encodeURIComponent(`*${term}*`);
    const rows = await supportDb(
      `nexvor_support_tickets?or=(first_name.ilike.${pattern},last_name.ilike.${pattern},subject.ilike.${pattern},telegram_username.ilike.${pattern})&select=id,first_name,last_name,subject,status&order=last_message_at.desc&limit=10`,
    ) as Ticket[];
    if (!rows.length) {
      await reply(String(chatId), "🔍 نتیجه‌ای پیدا نشد.");
      return;
    }
    const keyboard = rows.map(ticket => [{ text: `🎫 ${String(ticket.subject || "تیکت").slice(0, 28)} · ${ticket.status}`, callback_data: `ticket:${ticket.id}` }]);
    await reply(String(chatId), `🔎 <b>نتایج جست‌وجو</b> برای «${escapeTelegramHtml(term)}»\n\n${rows.map((ticket, index) => `${index + 1}. ${escapeTelegramHtml(ticket.first_name)} ${escapeTelegramHtml(ticket.last_name)} · ${statusLabel(ticket.status)}`).join("\n")}`, { inline_keyboard: keyboard });
    return;
  }
  if (command === "/ticket") {
    const id = argument;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      await reply(String(chatId), "فرمت دستور:\n<code>/ticket شناسه-تیکت</code>");
      return;
    }
    const detail = await ticketDetails(id);
    if (!detail) await reply(String(chatId), "تیکت پیدا نشد.");
    else await reply(String(chatId), detail.text, ticketKeyboard(detail.ticket));
    return;
  }
  if (command === "/reply") {
    const match = argument.match(/^([0-9a-f-]{36})\s+([\s\S]+)$/i);
    if (!match) {
      await reply(String(chatId), "فرمت دستور:\n<code>/reply شناسه-تیکت متن پاسخ</code>");
      return;
    }
    const [, id, rawBody] = match;
    const body = cleanText(rawBody, 4000);
    if (!body) {
      await reply(String(chatId), "متن پاسخ خالی است.");
      return;
    }
    const ticket = await getTicket(id);
    if (!ticket) {
      await reply(String(chatId), "تیکت پیدا نشد.");
      return;
    }
    if (ticket.status === "closed") {
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
    await reply(String(chatId), "✅ پاسخ با موفقیت ثبت شد و در چت سایت نمایش داده می‌شود.", { inline_keyboard: [[{ text: "👁 مشاهده تیکت", callback_data: `ticket:${id}` }, { text: "📬 فهرست", callback_data: "tickets:0" }]] });
    return;
  }
  if (command === "/close" || command === "/open") {
    const id = argument;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      await reply(String(chatId), `فرمت دستور:\n<code>${command} شناسه-تیکت</code>`);
      return;
    }
    const ticket = await setTicketStatus(id, command === "/close" ? "closed" : "waiting");
    if (!ticket) {
      await reply(String(chatId), "تیکت پیدا نشد.");
      return;
    }
    await reply(String(chatId), command === "/close" ? "🔒 تیکت بسته شد." : "🔓 تیکت دوباره باز شد.", { inline_keyboard: [[{ text: "👁 مشاهده تیکت", callback_data: `ticket:${id}` }]] });
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
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message) await handleCommand(update.message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
