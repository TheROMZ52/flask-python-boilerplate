import { cleanText, hashAccessToken, newAccessToken, supportDb } from "@/lib/support/server";
import { escapeTelegramHtml, notifyAdminAboutCustomerMessage, notifyAdminAboutNewServiceRequest, notifyAdminAboutNewTicket, sendTelegramMessage } from "@/lib/support/telegram";
import { serviceGroups } from "@/lib/services";
import { limited, MINUTES, HOURS } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site";
import { createNotification, displayName, getProfile } from "@/lib/auth/account";
import { sendMail, ticketReplyMessage } from "@/lib/mail";

export type BotMessage = { message_id?: number; text?: string; chat?: { id?: number; type?: string }; from?: { id?: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string } };
export type BotCallback = { id: string; data?: string; from?: BotMessage["from"]; message?: BotMessage };

type Markup = Record<string, unknown>;
type Session = { state: string; data: Record<string, unknown> };
type Row = Record<string, unknown> & { id: string };

const token = () => process.env.TELEGRAM_BOT_TOKEN;
const priorityLabels: Record<string, string> = { normal: "عادی", urgent: "⚡ فوری", critical: "🚨 اضطراری" };
const requestLabels: Record<string, string> = { new: "🆕 ثبت شد", reviewing: "🔍 در حال بررسی", in_progress: "🛠 در حال انجام", completed: "✅ تکمیل شد", rejected: "⛔ رد شد" };
const requestSteps = ["new", "reviewing", "in_progress", "completed"];
const ticketLabels: Record<string, string> = { waiting: "⏳ منتظر پاسخ", answered: "✅ پاسخ داده شد", closed: "🔒 بسته" };

async function tg(method: string, payload: Record<string, unknown>) {
  const key = token();
  if (!key) throw new Error("not configured");
  const response = await fetch(`https://api.telegram.org/bot${key}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error("telegram failed");
  return result;
}

const send = (chatId: string, text: string, markup?: Markup) => sendTelegramMessage(chatId, text, markup ? { reply_markup: markup } : undefined);
async function show(cb: BotCallback | null, chatId: string, text: string, markup?: Markup) {
  const messageId = cb?.message?.message_id;
  if (cb && messageId) {
    try {
      await tg("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", disable_web_page_preview: true, ...(markup ? { reply_markup: markup } : {}) });
      return;
    } catch {}
  }
  await send(chatId, text, markup);
}

async function getSession(chatId: string): Promise<Session | null> {
  const rows = (await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(chatId)}&select=state,data&limit=1`)) as Array<{ state: string; data: Record<string, unknown> }>;
  const row = rows?.[0];
  return row ? { state: row.state, data: row.data || {} } : null;
}
const setSession = (chatId: string, state: string, data: Record<string, unknown> = {}) =>
  supportDb("nexvor_bot_sessions?on_conflict=chat_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ chat_id: chatId, state, data, updated_at: new Date().toISOString() }) });
const clearSession = (chatId: string) => supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(chatId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });

const button = (text: string, data: string) => ({ text, callback_data: data });
const cancelRow = [button("✖️ لغو", "p:cancel")];

function mainMenu(): Markup {
  return { inline_keyboard: [
    [button("📦 ثبت سفارش", "p:order"), button("🎫 تیکت پشتیبانی", "p:ticket")],
    [button("📋 پیگیری من", "p:my"), button("💰 تعرفه", "p:prices")],
    [button("🛠 خدمات", "p:services"), { text: "🌐 وب‌سایت", url: siteUrl }],
    [button("❓ راهنما", "p:help")],
  ] };
}
const backRow = [button("⬅️ منوی اصلی", "p:menu")];

const welcome = (name: string) => [`سلام ${escapeTelegramHtml(name)} 👋`, "به بات <b>NexvorDEV</b> خوش اومدی.", "", "اینجا می‌تونی سفارش بدی، تیکت پشتیبانی باز کنی، وضعیت کارهات رو ببینی و تعرفه رو بدونی؛ همه‌چیز بدون نیاز به سایت.", "", "از منوی زیر شروع کن 👇"].join("\n");

const helpText = () => ["❓ <b>راهنمای بات</b>", "", "/menu — منوی اصلی", "/order — ثبت سفارش جدید", "/newticket — باز کردن تیکت پشتیبانی", "/my — سفارش‌ها و تیکت‌های من", "/prices — تعرفه", "/services — فهرست خدمات", "/cancel — لغو مرحله فعلی", "", `🌐 ${siteUrl}`].join("\n");

async function linkRecords(chatId: string, username?: string) {
  if (!username) return;
  const name = username.toLowerCase();
  const pattern = encodeURIComponent(username);
  const [tickets, requests] = await Promise.all([
    supportDb(`nexvor_support_tickets?telegram_username=ilike.${pattern}&telegram_chat_id=is.null&select=id,telegram_username&limit=30`) as Promise<Array<{ id: string; telegram_username: string }>>,
    supportDb(`nexvor_service_requests?telegram_contact=ilike.*${pattern}*&telegram_chat_id=is.null&select=id,telegram_contact&limit=30`) as Promise<Array<{ id: string; telegram_contact: string }>>,
  ]);
  const ticketIds = (tickets || []).filter(item => item.telegram_username.replace(/^@/, "").toLowerCase() === name).map(item => item.id);
  const requestIds = (requests || []).filter(item => item.telegram_contact.trim().replace(/^@/, "").toLowerCase() === name).map(item => item.id);
  const patch = { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ telegram_chat_id: chatId }) };
  await Promise.all([
    ticketIds.length ? supportDb(`nexvor_support_tickets?id=in.(${ticketIds.join(",")})`, patch) : null,
    requestIds.length ? supportDb(`nexvor_service_requests?id=in.(${requestIds.join(",")})`, patch) : null,
  ]);
}

const fullName = (from?: BotMessage["from"]) => cleanText([from?.first_name, from?.last_name].filter(Boolean).join(" ") || from?.username || "کاربر تلگرام", 80);

async function showGroups(cb: BotCallback | null, chatId: string) {
  await setSession(chatId, "order_group");
  await show(cb, chatId, "📦 <b>ثبت سفارش</b>\n\nدسته‌بندی خدمت موردنظرت رو انتخاب کن:", { inline_keyboard: [...serviceGroups.map((group, index) => [button(group.label, `p:og:${index}`)]), cancelRow] });
}

async function showServices(cb: BotCallback, chatId: string, groupIndex: number) {
  const group = serviceGroups[groupIndex];
  if (!group) return showGroups(cb, chatId);
  await show(cb, chatId, `📦 <b>${escapeTelegramHtml(group.label)}</b>\n\nخدمت دقیق رو انتخاب کن:`, { inline_keyboard: [...group.options.map((option, index) => [button(option.slice(0, 60), `p:os:${groupIndex}:${index}`)]), [button("⬅️ دسته‌ها", "p:order"), ...cancelRow]] });
}

async function askPriority(cb: BotCallback, chatId: string, groupIndex: number, optionIndex: number) {
  const service = serviceGroups[groupIndex]?.options[optionIndex];
  if (!service) return showGroups(cb, chatId);
  await setSession(chatId, "order_priority", { service });
  await show(cb, chatId, `✅ خدمت: <b>${escapeTelegramHtml(service)}</b>\n\nاولویت کار چقدره؟`, { inline_keyboard: [[button("عادی", "p:op:normal"), button("⚡ فوری", "p:op:urgent"), button("🚨 اضطراری", "p:op:critical")], cancelRow] });
}

async function askDetails(cb: BotCallback, chatId: string, session: Session | null, priority: string) {
  const service = String(session?.data.service || "");
  if (!service || !priorityLabels[priority]) return showGroups(cb, chatId);
  await setSession(chatId, "order_details", { service, priority });
  await show(cb, chatId, `✍️ حالا توضیح بده دقیقاً چی لازم داری.\n\nهرچی جزئیات بیشتر بدی، برآورد دقیق‌تر می‌گیری (حداقل ۱۰ کاراکتر).`, { inline_keyboard: [cancelRow] });
}

async function confirmOrder(chatId: string, session: Session, details: string) {
  const data = { service: session.data.service, priority: session.data.priority, details };
  await setSession(chatId, "order_confirm", data);
  await send(chatId, ["🧾 <b>خلاصه سفارش</b>", "", `<b>خدمت:</b> ${escapeTelegramHtml(data.service)}`, `<b>اولویت:</b> ${priorityLabels[String(data.priority)]}`, "", "<b>توضیحات:</b>", escapeTelegramHtml(details).slice(0, 1500), "", "ثبت بشه؟"].join("\n"), { inline_keyboard: [[button("✅ ثبت سفارش", "p:ok"), button("✖️ لغو", "p:cancel")]] });
}

async function submitOrder(cb: BotCallback, chatId: string, session: Session | null, from?: BotMessage["from"]) {
  if (!session || session.state !== "order_confirm") return show(cb, chatId, "این مرحله منقضی شده. دوباره شروع کن.", { inline_keyboard: [[button("📦 ثبت سفارش", "p:order")], backRow] });
  if (await limited(`bot:order:${chatId}`, 5, HOURS)) return show(cb, chatId, "⏳ تعداد سفارش‌های این ساعت به سقف رسیده. کمی بعد دوباره امتحان کن.", { inline_keyboard: [backRow] });
  const open = (await supportDb(`nexvor_service_requests?telegram_chat_id=eq.${encodeURIComponent(chatId)}&status=in.(new,reviewing,in_progress)&select=id`)) as Array<{ id: string }>;
  if ((open?.length || 0) >= 5) return show(cb, chatId, "تا الان ۵ سفارش در جریان داری. بعد از تکمیل یا بسته‌شدن، می‌تونی سفارش جدید بدی.", { inline_keyboard: [[button("📋 پیگیری من", "p:my")], backRow] });
  const rows = (await supportDb("nexvor_service_requests", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({
    customer_name: fullName(from), telegram_contact: from?.username ? `@${from.username}` : `ID:${chatId}`, service_type: String(session.data.service), priority: String(session.data.priority), details: cleanText(session.data.details, 2000), status: "new", telegram_chat_id: chatId,
  }) })) as Row[];
  await clearSession(chatId);
  const id = rows?.[0]?.id;
  if (id) await notifyAdminAboutNewServiceRequest(id).catch(() => null);
  await show(cb, chatId, "🎉 سفارشت ثبت شد!\n\nتیم NexvorDEV بررسیش می‌کنه و هزینه و جزئیات رو همین‌جا برات می‌فرسته. هر تغییر وضعیتی هم به خودت اطلاع داده می‌شه.", { inline_keyboard: [[button("📋 پیگیری سفارش‌ها", "p:my")], backRow] });
}

async function startTicket(cb: BotCallback | null, chatId: string) {
  const openTickets = (await supportDb(`nexvor_support_tickets?telegram_chat_id=eq.${encodeURIComponent(chatId)}&status=neq.closed&select=id`)) as Array<{ id: string }>;
  if ((openTickets?.length || 0) >= 3) return show(cb, chatId, "الان ۳ تیکت باز داری. اول یکی‌شون رو پیگیری یا ببند.", { inline_keyboard: [[button("📋 پیگیری من", "p:my")], backRow] });
  await setSession(chatId, "tk_subject");
  await show(cb, chatId, "🎫 <b>تیکت پشتیبانی</b>\n\nموضوع مشکل یا سؤالت رو در یک خط بنویس:", { inline_keyboard: [cancelRow] });
}

async function createTicket(chatId: string, data: Record<string, unknown>, message: string, from?: BotMessage["from"]) {
  if (await limited(`bot:ticket:${chatId}`, 3, HOURS)) return send(chatId, "⏳ تعداد تیکت‌های این ساعت به سقف رسیده. کمی بعد دوباره امتحان کن.", { inline_keyboard: [backRow] });
  const accessToken = newAccessToken();
  const rows = (await supportDb("nexvor_support_tickets", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({
    first_name: cleanText(from?.first_name || "کاربر", 60), last_name: cleanText(from?.last_name || "تلگرام", 60), age: Number(data.age), telegram_username: from?.username || `id${chatId}`, subject: cleanText(data.subject, 120), status: "waiting", access_token_hash: hashAccessToken(accessToken), telegram_chat_id: chatId,
  }) })) as Row[];
  const id = rows?.[0]?.id;
  if (!id) return send(chatId, "ثبت تیکت انجام نشد؛ دوباره تلاش کن.", { inline_keyboard: [backRow] });
  await supportDb("nexvor_support_messages", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ticket_id: id, sender_role: "customer", body: message }) });
  await clearSession(chatId);
  await notifyAdminAboutNewTicket(id).catch(() => null);
  await send(chatId, ["✅ تیکتت ثبت شد.", "", "پاسخ پشتیبانی همین‌جا برات ارسال می‌شه. اگه خواستی تو سایت هم پیگیری کنی، از لینک زیر استفاده کن."].join("\n"), { inline_keyboard: [[button("🎫 باز کردن تیکت", `p:t:${id}`)], [{ text: "🌐 گفت‌وگو در سایت", url: `${siteUrl}/support/ticket/${id}?token=${accessToken}` }], backRow] });
}

async function showMine(cb: BotCallback | null, chatId: string, from?: BotMessage["from"]) {
  await linkRecords(chatId, from?.username).catch(() => null);
  const id = encodeURIComponent(chatId);
  const [requests, tickets] = await Promise.all([
    supportDb(`nexvor_service_requests?telegram_chat_id=eq.${id}&select=id,service_type,status,created_at&order=created_at.desc&limit=6`) as Promise<Row[]>,
    supportDb(`nexvor_support_tickets?telegram_chat_id=eq.${id}&select=id,subject,status,last_message_at&order=last_message_at.desc&limit=6`) as Promise<Row[]>,
  ]);
  if (!requests?.length && !tickets?.length) return show(cb, chatId, "هنوز سفارش یا تیکتی نداری.", { inline_keyboard: [[button("📦 ثبت سفارش", "p:order"), button("🎫 تیکت جدید", "p:ticket")], backRow] });
  const keyboard = [
    ...(requests || []).map(item => [button(`📦 ${String(item.service_type).slice(0, 28)} · ${requestLabels[String(item.status)] || item.status}`, `p:r:${item.id}`)]),
    ...(tickets || []).map(item => [button(`🎫 ${String(item.subject).slice(0, 28)} · ${ticketLabels[String(item.status)] || item.status}`, `p:t:${item.id}`)]),
    backRow,
  ];
  await show(cb, chatId, "📋 <b>سفارش‌ها و تیکت‌های من</b>\n\nروی هر مورد بزن تا جزئیاتش رو ببینی:", { inline_keyboard: keyboard });
}

async function showRequest(cb: BotCallback, chatId: string, id: string) {
  const rows = (await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}&telegram_chat_id=eq.${encodeURIComponent(chatId)}&select=id,service_type,priority,status,quoted_price,created_at,updated_at&limit=1`)) as Row[];
  const item = rows?.[0];
  if (!item) return show(cb, chatId, "این سفارش پیدا نشد.", { inline_keyboard: [[button("📋 پیگیری من", "p:my")]] });
  const index = requestSteps.indexOf(String(item.status));
  const steps = item.status === "rejected" ? "" : requestSteps.map((step, i) => `${i <= index ? "🟢" : "⚪️"} ${requestLabels[step].replace(/^\S+\s/, "")}`).join("\n");
  const text = ["📦 <b>سفارش شما</b>", "", `<b>خدمت:</b> ${escapeTelegramHtml(item.service_type)}`, `<b>اولویت:</b> ${priorityLabels[String(item.priority)] || item.priority}`, `<b>وضعیت:</b> ${requestLabels[String(item.status)] || item.status}`, `<b>هزینه اعلام‌شده:</b> ${item.quoted_price ? escapeTelegramHtml(item.quoted_price) : "هنوز اعلام نشده"}`, `<b>ثبت:</b> ${new Date(String(item.created_at)).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}`, steps ? `\n${steps}` : ""].join("\n");
  await show(cb, chatId, text, { inline_keyboard: [[button("🔄 بروزرسانی", `p:r:${id}`), button("📋 فهرست", "p:my")], backRow] });
}

async function showTicket(cb: BotCallback | null, chatId: string, id: string) {
  const rows = (await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&telegram_chat_id=eq.${encodeURIComponent(chatId)}&select=id,subject,status&limit=1`)) as Row[];
  const ticket = rows?.[0];
  if (!ticket) return show(cb, chatId, "این تیکت پیدا نشد.", { inline_keyboard: [[button("📋 پیگیری من", "p:my")]] });
  const messages = (await supportDb(`nexvor_support_messages?ticket_id=eq.${encodeURIComponent(id)}&select=sender_role,body&order=created_at.desc&limit=6`)) as Array<{ sender_role: string; body: string }>;
  const lines = [...messages].reverse().map(item => `${item.sender_role === "admin" ? "🛠 پشتیبانی" : "👤 شما"}: ${escapeTelegramHtml(item.body).slice(0, 500)}`);
  while (lines.join("\n\n").length > 2800 && lines.length > 1) lines.shift();
  const closed = ticket.status === "closed";
  const keyboard = [
    closed ? [button("📋 فهرست", "p:my")] : [button("✍️ پاسخ", `p:tr:${id}`), button("🔒 بستن", `p:tc:${id}`)],
    [button("🔄 بروزرسانی", `p:t:${id}`), button("📋 فهرست", "p:my")],
  ];
  await show(cb, chatId, [`🎫 <b>${escapeTelegramHtml(ticket.subject)}</b>`, `${ticketLabels[String(ticket.status)] || ticket.status}`, "", lines.join("\n\n") || "هنوز پیامی نیست."].join("\n"), { inline_keyboard: keyboard });
}

async function closeTicket(cb: BotCallback, chatId: string, id: string) {
  await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&telegram_chat_id=eq.${encodeURIComponent(chatId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "closed", updated_at: new Date().toISOString() }) });
  await showTicket(cb, chatId, id);
}

async function customerReply(chatId: string, ticketId: string, text: string) {
  if (await limited(`bot:msg:${chatId}`, 20, 10 * MINUTES)) return send(chatId, "پیام‌های زیادی در مدت کوتاه فرستادی؛ کمی صبر کن.");
  const rows = (await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(ticketId)}&telegram_chat_id=eq.${encodeURIComponent(chatId)}&select=id,status&limit=1`)) as Row[];
  const ticket = rows?.[0];
  if (!ticket || ticket.status === "closed") { await clearSession(chatId); return send(chatId, "این تیکت بسته شده یا پیدا نشد.", { inline_keyboard: [backRow] }); }
  const now = new Date().toISOString();
  await supportDb("nexvor_support_messages", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ticket_id: ticketId, sender_role: "customer", body: text }) });
  await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(ticketId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "waiting", last_message_at: now, updated_at: now }) });
  await clearSession(chatId);
  await notifyAdminAboutCustomerMessage(ticketId).catch(() => null);
  await send(chatId, "✅ پیامت برای پشتیبانی ارسال شد.", { inline_keyboard: [[button("🎫 بازگشت به تیکت", `p:t:${ticketId}`)], backRow] });
}

const pricesText = () => ["💰 <b>تعرفه خدمات</b>", "", "بازه تعرفه برای همه‌ی خدمات (سرور، پلاگین و بات، طراحی وب و زیرساخت):", "", "از <b>۶۵٬۰۰۰</b> تا <b>۲٬۰۰۰٬۰۰۰</b> تومان", "", "مبلغ دقیق بعد از بررسی جزئیات، حجم کار و امکانات درخواستی اعلام می‌شه. بدون هزینه پنهان."].join("\n");

const servicesText = () => ["🛠 <b>خدمات NexvorDEV</b>", "", ...serviceGroups.map(group => `• <b>${escapeTelegramHtml(group.label)}</b> (${group.options.length.toLocaleString("fa-IR")} خدمت)`), "", "برای سفارش، دکمه زیر رو بزن."].join("\n");

export async function sendMenu(chatId: string, from?: BotMessage["from"]) {
  await clearSession(chatId).catch(() => null);
  await send(chatId, welcome(from?.first_name || from?.username || "دوست عزیز"), mainMenu());
}

export async function handlePublicMessage(message: BotMessage, command: string | null, admin: boolean) {
  const chatId = String(message.chat?.id);
  const from = message.from;
  const text = (message.text || "").trim();
  if (await limited(`bot:chat:${chatId}`, 40, MINUTES)) return;

  if (command === "/start" || command === "/menu") { await linkRecords(chatId, from?.username).catch(() => null); return sendMenu(chatId, from); }
  if (command === "/help") return send(chatId, helpText(), { inline_keyboard: [backRow] });
  if (command === "/cancel") { await clearSession(chatId); return send(chatId, "لغو شد.", mainMenu()); }
  if (command === "/order") return showGroups(null, chatId);
  if (command === "/newticket") return startTicket(null, chatId);
  if (command === "/my") return showMine(null, chatId, from);
  if (command === "/prices") return send(chatId, pricesText(), { inline_keyboard: [[button("📦 ثبت سفارش", "p:order")], [{ text: "🌐 صفحه تعرفه", url: `${siteUrl}/pricing` }], backRow] });
  if (command === "/services") return send(chatId, servicesText(), { inline_keyboard: [[button("📦 ثبت سفارش", "p:order")], backRow] });
  if (command) return;

  const session = await getSession(chatId);
  if (!session) { if (!admin) await send(chatId, "برای شروع از منوی زیر استفاده کن 👇", mainMenu()); return; }

  if (session.state === "order_details") {
    if (text.length < 10) return send(chatId, "توضیحات کوتاهه؛ حداقل ۱۰ کاراکتر بنویس.", { inline_keyboard: [cancelRow] });
    return confirmOrder(chatId, session, cleanText(text, 2000));
  }
  if (session.state === "tk_subject") {
    if (text.length < 3) return send(chatId, "موضوع خیلی کوتاهه.", { inline_keyboard: [cancelRow] });
    const previous = (await supportDb(`nexvor_support_tickets?telegram_chat_id=eq.${encodeURIComponent(chatId)}&select=age&order=created_at.desc&limit=1`)) as Array<{ age: number }>;
    const age = previous?.[0]?.age;
    if (age) { await setSession(chatId, "tk_message", { subject: cleanText(text, 120), age }); return send(chatId, "✍️ حالا مشکل یا سؤالت رو با جزئیات بنویس:", { inline_keyboard: [cancelRow] }); }
    await setSession(chatId, "tk_age", { subject: cleanText(text, 120) });
    return send(chatId, "سن شما چنده؟ (فقط عدد، بین ۱۳ تا ۱۱۰)", { inline_keyboard: [cancelRow] });
  }
  if (session.state === "tk_age") {
    const age = Number(text.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))));
    if (!Number.isInteger(age) || age < 13 || age > 110) return send(chatId, "یه عدد معتبر بین ۱۳ تا ۱۱۰ بفرست.", { inline_keyboard: [cancelRow] });
    await setSession(chatId, "tk_message", { ...session.data, age });
    return send(chatId, "✍️ حالا مشکل یا سؤالت رو با جزئیات بنویس:", { inline_keyboard: [cancelRow] });
  }
  if (session.state === "tk_message") {
    if (text.length < 5) return send(chatId, "پیام کوتاهه؛ کمی بیشتر توضیح بده.", { inline_keyboard: [cancelRow] });
    return createTicket(chatId, session.data, cleanText(text, 4000), from);
  }
  if (session.state === "tk_reply") return customerReply(chatId, String(session.data.id), cleanText(text, 4000));
  if (!admin) await send(chatId, "از دکمه‌های همین پیام ادامه بده یا /cancel بزن.", mainMenu());
}

export async function handlePublicCallback(cb: BotCallback) {
  const chatId = String(cb.message?.chat?.id || "");
  const data = cb.data || "";
  if (!chatId || cb.from?.is_bot || String(cb.from?.id) !== chatId) return;
  try { await tg("answerCallbackQuery", { callback_query_id: cb.id }); } catch {}
  if (await limited(`bot:chat:${chatId}`, 40, MINUTES)) return;
  const [, action, a, b] = data.split(":");

  if (action === "menu") { await clearSession(chatId); return show(cb, chatId, welcome(cb.from?.first_name || cb.from?.username || "دوست عزیز"), mainMenu()); }
  if (action === "cancel") { await clearSession(chatId); return show(cb, chatId, "لغو شد. هر وقت خواستی از منو ادامه بده.", mainMenu()); }
  if (action === "help") return show(cb, chatId, helpText(), { inline_keyboard: [backRow] });
  if (action === "prices") return show(cb, chatId, pricesText(), { inline_keyboard: [[button("📦 ثبت سفارش", "p:order")], [{ text: "🌐 صفحه تعرفه", url: `${siteUrl}/pricing` }], backRow] });
  if (action === "services") return show(cb, chatId, servicesText(), { inline_keyboard: [[button("📦 ثبت سفارش", "p:order")], backRow] });
  if (action === "order") return showGroups(cb, chatId);
  if (action === "og") return showServices(cb, chatId, Number(a));
  if (action === "os") return askPriority(cb, chatId, Number(a), Number(b));
  if (action === "op") return askDetails(cb, chatId, await getSession(chatId), String(a));
  if (action === "ok") return submitOrder(cb, chatId, await getSession(chatId), cb.from);
  if (action === "ticket") return startTicket(cb, chatId);
  if (action === "my") return showMine(cb, chatId, cb.from);
  if (action === "r" && a) return showRequest(cb, chatId, a);
  if (action === "t" && a) return showTicket(cb, chatId, a);
  if (action === "tc" && a) return closeTicket(cb, chatId, a);
  if (action === "tr" && a) { await setSession(chatId, "tk_reply", { id: a }); return show(cb, chatId, "✍️ پیامت رو بنویس تا برای پشتیبانی ارسال بشه:", { inline_keyboard: [cancelRow] }); }
}

export async function notifyCustomerAboutReply(ticketId: string) {
  const rows = (await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(ticketId)}&select=id,subject,telegram_chat_id,user_id&limit=1`)) as Array<Row & { telegram_chat_id: string | null; user_id: string | null }>;
  const ticket = rows?.[0];
  if (!ticket) return;
  const messages = (await supportDb(`nexvor_support_messages?ticket_id=eq.${encodeURIComponent(ticketId)}&sender_role=eq.admin&select=body&order=created_at.desc&limit=1`)) as Array<{ body: string }>;
  const body = messages?.[0]?.body || "";
  if (ticket.user_id) {
    const profile = await getProfile(ticket.user_id).catch(() => null);
    await createNotification(ticket.user_id, "ticket", "پاسخ جدید به تیکت شما", String(ticket.subject), `/support/ticket/${ticketId}`);
    if (profile?.email && profile.email_verified_at) await sendMail({ to: profile.email, ...ticketReplyMessage(displayName(profile), String(ticket.subject), body.slice(0, 1500), `${siteUrl}/support/ticket/${ticketId}`) }).catch(() => null);
  }
  if (!ticket.telegram_chat_id) return;
  await send(ticket.telegram_chat_id, [`💬 <b>پاسخ جدید از پشتیبانی</b>`, `🎫 ${escapeTelegramHtml(ticket.subject)}`, "", escapeTelegramHtml(body).slice(0, 2500)].join("\n"), { inline_keyboard: [[button("✍️ پاسخ", `p:tr:${ticketId}`), button("🎫 مشاهده", `p:t:${ticketId}`)]] }).catch(() => null);
}

export async function notifyCustomerAboutRequest(item: { id: string; service_type: string; status: string; quoted_price?: string | null; telegram_chat_id?: string | null; user_id?: string | null }, kind: "status" | "quote") {
  if (item.user_id) await createNotification(item.user_id, "order", kind === "quote" ? "هزینه سفارش اعلام شد" : "وضعیت سفارش تغییر کرد", `${item.service_type} — ${kind === "quote" ? item.quoted_price || "" : requestLabels[item.status] || item.status}`, "/account");
  if (!item.telegram_chat_id) return;
  const text = kind === "quote"
    ? [`💰 <b>هزینه سفارش شما اعلام شد</b>`, `📦 ${escapeTelegramHtml(item.service_type)}`, "", `<b>مبلغ:</b> ${escapeTelegramHtml(item.quoted_price || "")}`, "", "برای هماهنگی بیشتر همین‌جا یا با تیکت پیام بده."].join("\n")
    : [`🔔 <b>وضعیت سفارش شما تغییر کرد</b>`, `📦 ${escapeTelegramHtml(item.service_type)}`, "", `<b>وضعیت جدید:</b> ${requestLabels[item.status] || escapeTelegramHtml(item.status)}`].join("\n");
  await send(item.telegram_chat_id, text, { inline_keyboard: [[button("📦 مشاهده سفارش", `p:r:${item.id}`)]] }).catch(() => null);
}
