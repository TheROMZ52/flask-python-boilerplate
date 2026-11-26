import { NextResponse } from "next/server";
import { cleanText, hashAccessToken, safeEqual, supportDb } from "@/lib/support/server";
import { escapeTelegramHtml, sendTelegramMessage } from "@/lib/support/telegram";
import { setInvoicePayment, syncInvoiceAmount } from "@/lib/invoice";
import { handlePublicCallback, handlePublicMessage, handleTelegramLinkStart, notifyCustomerAboutOrderReply, notifyCustomerAboutReply, notifyCustomerAboutRequest, type BotCallback, type BotMessage } from "@/lib/bot/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TelegramMessage = BotMessage;

type TelegramCallbackQuery = BotCallback;

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
    `nexvor_support_messages?ticket_id=eq.${encodeURIComponent(id)}&select=sender_role,body,created_at&order=created_at.desc&limit=12`,
  ) as Array<{ sender_role: string; body: string; created_at?: string }>;
  messages.reverse();
  const historyLines = messages.map(item => {
    const role = item.sender_role === "admin" ? "🛠 مدیر" : "👤 مشتری";
    const body = escapeTelegramHtml(item.body).slice(0, 650);
    return `${role}: ${body}`;
  });
  while (historyLines.join("\n\n").length > 3000 && historyLines.length > 1) historyLines.shift();
  const history = historyLines.join("\n\n");
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
  const serviceRows = await supportDb("nexvor_service_requests?select=status,priority") as Array<{status:string;priority:string}>;
  const openRequests=serviceRows.filter(item=>!["completed","rejected"].includes(item.status)).length;
  const criticalRequests=serviceRows.filter(item=>item.priority==="critical" && !["completed","rejected"].includes(item.status)).length;
  const text = [
    "⚡ <b>NexvorDEV · داشبورد مدیریت</b>",
    "",
    `🎫 کل تیکت‌ها: <b>${total}</b>`,
    `⏳ منتظر پاسخ: <b>${waiting}</b>`,
    `✅ پاسخ داده‌شده: <b>${answered}</b>`,
    `🔒 بسته‌شده: <b>${closed}</b>`,
    "",
    `📦 کل درخواست‌های خدمات: <b>${serviceRows.length}</b>`,
    `🛠 درخواست‌های باز: <b>${openRequests}</b>`,
    `🚨 درخواست‌های اضطراری باز: <b>${criticalRequests}</b>`,
    "",
    "از منوی زیر برای مدیریت استفاده کن.",
  ].join("\n");
  const markup = {
    inline_keyboard: [
      [{ text: "📦 درخواست‌های خدمات", callback_data: "requests:0" }],
      [{ text: "📣 ارسال پیام به مشتریان", callback_data: "broadcast:start" }],
      [{ text: "📬 مشاهده تیکت‌ها", callback_data: "tickets:0" }],
      [{ text: "🔎 جست‌وجوی تیکت", callback_data: "search_help" }, { text: "🔄 بروزرسانی آمار", callback_data: "dashboard" }],
      [{ text: "📖 راهنمای دستورات", callback_data: "help" }, { text: "👤 منوی مشتری", callback_data: "p:menu" }],
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


type ServiceRequest = {
  id: string; customer_name: string; telegram_contact: string; service_type: string;
  priority: "normal" | "urgent" | "critical"; details: string; status: string;
  assigned_to?: string | null; quoted_price?: string | null; internal_note?: string | null;
  created_at: string; updated_at: string; telegram_chat_id?: string | null;
};
const serviceStatusLabels: Record<string,string> = {
  new:"🆕 جدید", reviewing:"🔍 در حال بررسی", in_progress:"🛠 در حال انجام",
  completed:"✅ تکمیل‌شده", rejected:"⛔ ردشده"
};
const priorityLabels: Record<string,string> = { normal:"عادی", urgent:"فوری", critical:"🚨 اضطراری" };

async function getServiceRequest(id:string) {
  const rows=await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}&select=*&limit=1`) as ServiceRequest[];
  return rows[0] || null;
}
async function logServiceEvent(id:string, actor:string, type:string, oldValue?:string|null, newValue?:string|null, note?:string) {
  await supportDb("nexvor_service_request_events",{method:"POST",body:JSON.stringify({
    request_id:id,actor_telegram_id:actor,event_type:type,old_value:oldValue ?? null,new_value:newValue ?? null,note:note ?? null
  })});
}
function serviceRequestKeyboard(item:ServiceRequest) {
  return {inline_keyboard:[
    [{text:"🔍 بررسی",callback_data:`srstatus:${item.id}:reviewing`},{text:"🛠 شروع کار",callback_data:`srstatus:${item.id}:in_progress`}],
    [{text:"✅ تکمیل",callback_data:`srstatus:${item.id}:completed`},{text:"⛔ رد درخواست",callback_data:`srstatus:${item.id}:rejected`}],
    [{text:"✍️ پاسخ به مشتری",callback_data:`srreply:${item.id}`},{text:"👤 اختصاص به من",callback_data:`srassign:${item.id}`}],
    [{text:"🧾 تاریخچه",callback_data:`srhistory:${item.id}`}],
    [{text:"🔄 تازه‌سازی",callback_data:`srview:${item.id}`}],
    [{text:"📋 فهرست درخواست‌ها",callback_data:"requests:0"},{text:"📊 داشبورد",callback_data:"dashboard"}]
  ]};
}
async function serviceRequestText(item:ServiceRequest) {
  const text=[
    "📦 <b>جزئیات درخواست خدمات</b>",
    `<code>${escapeTelegramHtml(item.id)}</code>`,
    "",
    `<b>مشتری:</b> ${escapeTelegramHtml(item.customer_name)}`,
    `<b>راه ارتباطی:</b> ${escapeTelegramHtml(item.telegram_contact)}`,
    `<b>خدمت:</b> ${escapeTelegramHtml(item.service_type)}`,
    `<b>اولویت:</b> ${priorityLabels[item.priority] || item.priority}`,
    `<b>وضعیت:</b> ${serviceStatusLabels[item.status] || item.status}`,
    `<b>مسئول:</b> ${item.assigned_to ? escapeTelegramHtml(item.assigned_to) : "تعیین نشده"}`,
    `<b>قیمت اعلامی:</b> ${item.quoted_price ? escapeTelegramHtml(item.quoted_price) : "اعلام نشده"}`,
    `<b>ثبت:</b> ${new Date(item.created_at).toLocaleString("fa-IR",{timeZone:"Asia/Tehran"})}`,
    "",
    "<b>توضیحات مشتری:</b>",
    escapeTelegramHtml(item.details).slice(0,1800),
    "",
    "<b>گفت‌وگوی سفارش:</b>",
    ...((await supportDb(`nexvor_order_messages?request_id=eq.${encodeURIComponent(item.id)}&select=sender_role,body&order=created_at.desc&limit=5`) as Array<{sender_role:string;body:string}>).reverse().map(message => `${message.sender_role === "admin" ? "🛠 مدیر" : "👤 مشتری"}: ${escapeTelegramHtml(message.body).slice(0,450)}`)),
    "",
    `<b>یادداشت داخلی:</b> ${item.internal_note ? escapeTelegramHtml(item.internal_note).slice(0,500) : "ندارد"}`
  ];
  return text.join("\n").slice(0,3900);
}
async function sendOrderReply(requestId: string, body: string, actor: string) {
  const item = await getServiceRequest(requestId);
  if (!item) return false;
  await supportDb("nexvor_order_messages", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ request_id: requestId, sender_role: "admin", body: cleanText(body, 4000) }) });
  await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(requestId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ awaiting_reply: false, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
  await logServiceEvent(requestId, actor, "message", null, null, cleanText(body, 1000));
  await notifyCustomerAboutOrderReply(requestId, cleanText(body, 4000)).catch(() => null);
  return true;
}

async function showServiceRequest(id:string,chatId:string,edit?:TelegramCallbackQuery) {
  const item=await getServiceRequest(id);
  if(!item) {
    if(edit) await editCallbackMessage(edit,"درخواست پیدا نشد.");
    else await reply(chatId,"درخواست پیدا نشد.");
    return;
  }
  const text=await serviceRequestText(item);
  if(edit) await editCallbackMessage(edit,text,serviceRequestKeyboard(item));
  else await reply(chatId,text,serviceRequestKeyboard(item));
}
async function showServiceRequests(chatId:string,page=0,edit?:TelegramCallbackQuery) {
  const safePage=Math.max(0,Math.min(page,100)), offset=safePage*7;
  const rows=await supportDb(`nexvor_service_requests?select=id,customer_name,service_type,priority,status,created_at&order=created_at.desc&limit=8&offset=${offset}`) as ServiceRequest[];
  const more=rows.length>7, visible=rows.slice(0,7);
  const labels=visible.map((item,i)=>`${offset+i+1}. <b>${escapeTelegramHtml(item.service_type).slice(0,65)}</b>\n${escapeTelegramHtml(item.customer_name)} · ${priorityLabels[item.priority]} · ${serviceStatusLabels[item.status]}`);
  const keyboard=visible.map(item=>[{text:`${item.priority==="critical"?"🚨":item.priority==="urgent"?"⚡":"📦"} ${String(item.customer_name).slice(0,18)} · ${String(item.service_type).slice(0,18)}`,callback_data:`srview:${item.id}`}]);
  const nav=[];
  if(safePage>0) nav.push({text:"⬅️ قبلی",callback_data:`requests:${safePage-1}`});
  if(more) nav.push({text:"بعدی ➡️",callback_data:`requests:${safePage+1}`});
  if(nav.length) keyboard.push(nav);
  keyboard.push([{text:"📊 داشبورد",callback_data:"dashboard"},{text:"🔄 بروزرسانی",callback_data:`requests:${safePage}`}]);
  const text=visible.length?`<b>📦 درخواست‌های خدمات</b> · صفحه ${safePage+1}\n\n${labels.join("\n\n")}`:"📭 هنوز درخواستی ثبت نشده است.";
  if(edit) await editCallbackMessage(edit,text,{inline_keyboard:keyboard});
  else await reply(chatId,text,{inline_keyboard:keyboard});
}
async function updateServiceStatus(id:string,status:string,actor:string) {
  if(!Object.hasOwn(serviceStatusLabels,status)) return null;
  const item=await getServiceRequest(id); if(!item) return null;
  const now=new Date().toISOString();
  await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({
    status,updated_at:now,completed_at:status==="completed"?now:null
  })});
  await logServiceEvent(id,actor,"status",item.status,status);
  const updated=await getServiceRequest(id);
  if(updated) await notifyCustomerAboutRequest(updated,"status").catch(()=>null);
  return updated;
}
async function assignServiceRequest(id:string,actor:string) {
  const item=await getServiceRequest(id); if(!item) return null;
  await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({assigned_to:actor,updated_at:new Date().toISOString()})});
  await logServiceEvent(id,actor,"assigned",item.assigned_to,actor);
  return getServiceRequest(id);
}
async function showServiceEvents(id:string,chatId:string) {
  const rows=await supportDb(`nexvor_service_request_events?request_id=eq.${encodeURIComponent(id)}&select=actor_telegram_id,event_type,old_value,new_value,note,created_at&order=created_at.desc&limit=12`) as Array<Record<string,unknown>>;
  const text=rows.length?rows.map(row=>`• ${escapeTelegramHtml(row.event_type)}: ${escapeTelegramHtml(row.old_value||"—")} ← ${escapeTelegramHtml(row.new_value||row.note||"—")}\n<code>${escapeTelegramHtml(row.actor_telegram_id)}</code>`).join("\n\n"):"هنوز رویدادی ثبت نشده است.";
  await reply(chatId,`🧾 <b>تاریخچه درخواست</b>\n<code>${escapeTelegramHtml(id)}</code>\n\n${text}`,{inline_keyboard:[[{text:"⬅️ بازگشت به درخواست",callback_data:`srview:${id}`}]]});
}

async function getBroadcastRecipients() {
  const [requests, tickets] = await Promise.all([
    supportDb("nexvor_service_requests?telegram_chat_id=not.is.null&select=telegram_chat_id&order=created_at.desc&limit=2000") as Promise<Array<{ telegram_chat_id: string | null }>>,
    supportDb("nexvor_support_tickets?telegram_chat_id=not.is.null&select=telegram_chat_id&order=created_at.desc&limit=2000") as Promise<Array<{ telegram_chat_id: string | null }>>,
  ]);
  return [...new Set([...requests, ...tickets].map(row => String(row.telegram_chat_id || "").trim()).filter(id => /^\d+$/.test(id)))].slice(0, 1000);
}

async function startBroadcast(chatId: string) {
  await supportDb("nexvor_bot_sessions?on_conflict=chat_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ chat_id: chatId, state: "admin_broadcast_compose", data: {}, updated_at: new Date().toISOString() }) });
  await reply(chatId, "📣 <b>ارسال پیام به مشتریان</b>\n\nمتن پیام را بفرست. این پیام برای مشتریانی ارسال می‌شود که قبلاً از طریق بات سفارش یا تیکت ثبت کرده‌اند.\n\nبرای لغو /cancel را بزن.");
}

async function sendBroadcast(chatId: string) {
  const sessions = await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(chatId)}&select=state,data&limit=1`) as Array<{ state: string; data: Record<string, unknown> }>;
  const session = sessions[0];
  const body = typeof session?.data?.body === "string" ? session.data.body.trim() : "";
  if (session?.state !== "admin_broadcast_confirm" || !body) {
    await reply(chatId, "پیش‌نویس پیام پیدا نشد؛ دوباره /broadcast را بزن.");
    return;
  }
  await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(chatId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  const recipients = await getBroadcastRecipients();
  if (!recipients.length) {
    await reply(chatId, "هیچ مشتری دارای گفت‌وگوی تلگرامی پیدا نشد.");
    return;
  }
  let sent = 0;
  let failed = 0;
  const message = `📢 <b>پیام از NexvorDEV</b>\n\n${escapeTelegramHtml(body).slice(0, 3500)}`;
  for (let index = 0; index < recipients.length; index += 20) {
    const batch = recipients.slice(index, index + 20);
    const results = await Promise.allSettled(batch.map(id => sendTelegramMessage(id, message)));
    for (const result of results) {
      if (result.status === "fulfilled") sent++;
      else failed++;
    }
    if (index + 20 < recipients.length) await new Promise(resolve => setTimeout(resolve, 750));
  }
  await reply(chatId, `📣 <b>ارسال پیام به پایان رسید</b>\n\n✅ موفق: ${sent}\n❌ ناموفق: ${failed}\n👥 کل گیرندگان: ${recipients.length}`);
}

async function handleCallback(callback: TelegramCallbackQuery) {
  if ((callback.data || "").startsWith("p:")) { await handlePublicCallback(callback); return; }
  const senderId = callback.from?.id;
  const chatId = callback.message?.chat?.id;
  if (!senderId || !chatId || String(senderId) !== String(chatId) || !adminIds().includes(String(senderId))) {
    await answerCallback(callback.id, "⛔ دسترسی غیرمجاز");
    return;
  }
  const data = callback.data || "";
  try {
    if (data === "broadcast:start") { await startBroadcast(String(chatId)); }
    else if (data === "broadcast:send") { await answerCallback(callback.id, "ارسال پیام شروع شد؛ کمی صبر کن."); await sendBroadcast(String(chatId)); }
    else if (data === "broadcast:cancel") {
      await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(String(chatId))}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      await editCallbackMessage(callback, "ارسال پیام لغو شد.", { inline_keyboard: [[{ text: "📊 داشبورد", callback_data: "dashboard" }]] });
    }
    else if (data.startsWith("srview:")) { await showServiceRequest(data.slice(7),String(chatId),callback); }
    else if (data.startsWith("srreply:")) {
      const id = data.slice(8);
      const item = await getServiceRequest(id);
      if (!item) { await editCallbackMessage(callback, "درخواست پیدا نشد."); return; }
      await supportDb("nexvor_bot_sessions?on_conflict=chat_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ chat_id: String(chatId), state: "admin_order_reply", data: { id }, updated_at: new Date().toISOString() }) });
      await editCallbackMessage(callback, `✍️ پاسخ به سفارش «${escapeTelegramHtml(item.service_type)}» را در پیام بعدی بنویس.\n\nبرای لغو /cancel را بفرست.`, { inline_keyboard: [[{ text: "📦 بازگشت به سفارش", callback_data: `srview:${id}` }]] });
    }
    else if (data.startsWith("requests:")) { const page=Number(data.split(":")[1]); await showServiceRequests(String(chatId),Number.isFinite(page)?page:0,callback); }
    else if (data.startsWith("srstatus:")) { const [,id,status]=data.split(":"); const item=await updateServiceStatus(id,status,String(senderId)); if(item) { await editCallbackMessage(callback,await serviceRequestText(item),serviceRequestKeyboard(item)); await answerCallback(callback.id,"وضعیت درخواست به‌روزرسانی شد."); return; } }
    else if (data.startsWith("srassign:")) { const item=await assignServiceRequest(data.slice(9),String(senderId)); if(item) { await editCallbackMessage(callback,await serviceRequestText(item),serviceRequestKeyboard(item)); await answerCallback(callback.id,"درخواست به شما اختصاص داده شد."); return; } }
    else if (data.startsWith("srhistory:")) { await showServiceEvents(data.slice(10),String(chatId)); }
    else if (data === "dashboard") {
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
      const ticket = await getTicket(id);
      if (!ticket || ticket.status === "closed") { await editCallbackMessage(callback, "این تیکت پیدا نشد یا بسته است."); return; }
      await supportDb("nexvor_bot_sessions?on_conflict=chat_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ chat_id: String(chatId), state: "admin_ticket_reply", data: { id }, updated_at: new Date().toISOString() }) });
      await editCallbackMessage(callback, `✍️ پاسخ به تیکت «${escapeTelegramHtml(ticket.subject)}» را در پیام بعدی بنویس.\n\nبرای لغو /cancel را بفرست.`, { inline_keyboard: [[{ text: "⬅️ بازگشت به تیکت", callback_data: `ticket:${id}` }]] });
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
    "/broadcast — ارسال پیام گروهی به مشتریان",
    "/requests — فهرست درخواست‌های خدمات",
    "/searchrequest عبارت — جست‌وجوی درخواست‌ها",
    "/request شناسه — جزئیات درخواست خدمات",
    "/setstatus شناسه وضعیت — تغییر وضعیت درخواست",
    "/assign شناسه — اختصاص درخواست به خود",
    "/quote شناسه مبلغ — ثبت قیمت پیشنهادی",
    "/replyorder شناسه متن — پاسخ به سفارش مشتری از سایت و بات",
    "/paid شماره‌فاکتور — ثبت پرداخت فاکتور (/unpaid ، /cancelinvoice)",
    "/note شناسه متن — یادداشت داخلی",
    "/history شناسه — تاریخچه تغییرات درخواست",
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
  if (!chatId || !senderId || message.from?.is_bot || !text) return;
  if (message.chat?.type !== "private" || String(chatId) !== String(senderId)) {
    if (text.startsWith("/")) await reply(String(chatId), "برای استفاده از بات، در گفت‌وگوی خصوصی استارتش کن 🙂");
    return;
  }
  const admin = adminIds().includes(String(senderId));
  const tokens = text.split(/\s+/);
  const first = text.startsWith("/") ? tokens[0].split("@")[0].toLowerCase() : null;
  const startPayload = tokens.slice(1).join(" ").trim();
  if (first === "/start" && startPayload.startsWith("link_")) {
    await handleTelegramLinkStart(message, startPayload.slice(5));
    return;
  }
  const publicCommands = ["/menu", "/order", "/newticket", "/my", "/prices", "/services", "/cancel", "/link"];
  if (admin && first === "/cancel") {
    await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(String(chatId))}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    await reply(String(chatId), "عملیات لغو شد.", { inline_keyboard: [[{ text: "📊 داشبورد", callback_data: "dashboard" }]] });
    return;
  }
  if (!first && admin) {
    const broadcastSessions = await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(String(chatId))}&select=state,data&limit=1`) as Array<{ state: string; data: Record<string, unknown> }>;
    if (broadcastSessions[0]?.state === "admin_broadcast_compose") {
      const body = cleanText(text, 3500);
      if (body.length < 2) { await reply(String(chatId), "متن پیام خیلی کوتاه است؛ دوباره بنویس یا /cancel بزن."); return; }
      await supportDb("nexvor_bot_sessions?on_conflict=chat_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ chat_id: String(chatId), state: "admin_broadcast_confirm", data: { body }, updated_at: new Date().toISOString() }) });
      const recipients = await getBroadcastRecipients();
      await reply(String(chatId), `👀 <b>پیش‌نمایش پیام</b>\n\n${escapeTelegramHtml(body)}\n\n👥 تعداد گیرندگان فعلی: <b>${recipients.length}</b>\n\nارسال برای همه این مشتریان انجام شود؟`, { inline_keyboard: [[{ text: "✅ تأیید و ارسال", callback_data: "broadcast:send" }, { text: "❌ لغو", callback_data: "broadcast:cancel" }]] });
      return;
    }
  }
  if (!first && admin) {
    const sessions = await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(String(chatId))}&select=state,data&limit=1`) as Array<{state:string;data:Record<string,unknown>}>;
    const pending = sessions[0];
    if (pending?.state === "admin_order_reply" && typeof pending.data?.id === "string") {
      const sent = await sendOrderReply(pending.data.id, text, String(senderId));
      await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(String(chatId))}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      await reply(String(chatId), sent ? "✅ پاسخ سفارش برای مشتری ارسال شد." : "سفارش پیدا نشد.", { inline_keyboard: sent ? [[{text:"📦 مشاهده سفارش",callback_data:`srview:${pending.data.id}`}]] : [] });
      return;
    }
    if (pending?.state === "admin_ticket_reply" && typeof pending.data?.id === "string") {
      const id = pending.data.id;
      const ticket = await getTicket(id);
      if (ticket && ticket.status !== "closed") {
        await supportDb("nexvor_support_messages", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ticket_id: id, sender_role: "admin", body: cleanText(text, 4000) }) });
        await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "answered", last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
        await notifyCustomerAboutReply(id).catch(() => null);
      }
      await supportDb(`nexvor_bot_sessions?chat_id=eq.${encodeURIComponent(String(chatId))}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      await reply(String(chatId), ticket && ticket.status !== "closed" ? "✅ پاسخ تیکت برای مشتری ارسال شد." : "تیکت پیدا نشد یا بسته است.");
      return;
    }
  }
  if (!first || publicCommands.includes(first) || (!admin && (first === "/start" || first === "/help"))) {
    await handlePublicMessage(message, first, admin);
    return;
  }
  if (!admin) {
    await handlePublicMessage(message, "/menu", false);
    return;
  }

  const [rawCommand, ...parts] = text.split(/\s+/);
  const command = rawCommand.split("@")[0].toLowerCase();
  const argument = parts.join(" ").trim();

  if (command === "/start" || command === "/panel") {
    await showDashboard(String(chatId));
    return;
  }
  if (command === "/broadcast") { await startBroadcast(String(chatId)); return; }
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
  if (command === "/requests") { await showServiceRequests(String(chatId),0); return; }
  if (command === "/searchrequest") { if(!argument){await reply(String(chatId),"فرمت: <code>/searchrequest نام یا خدمت یا آیدی تلگرام</code>");return;} const term=argument.replace(/[,%()]/g," ").trim().slice(0,70); const pattern=encodeURIComponent(`*${term}*`); const rows=await supportDb(`nexvor_service_requests?or=(customer_name.ilike.${pattern},telegram_contact.ilike.${pattern},service_type.ilike.${pattern})&select=id,customer_name,service_type,priority,status&order=created_at.desc&limit=10`) as ServiceRequest[]; if(!rows.length){await reply(String(chatId),"🔎 موردی پیدا نشد.");return;} const keyboard=rows.map(item=>[{text:`📦 ${String(item.customer_name).slice(0,18)} · ${String(item.service_type).slice(0,18)}`,callback_data:`srview:${item.id}`}]); await reply(String(chatId),`🔎 <b>نتایج درخواست خدمات</b> برای «${escapeTelegramHtml(term)}»\n\n${rows.map((item,i)=>`${i+1}. ${escapeTelegramHtml(item.customer_name)} · ${serviceStatusLabels[item.status]} · ${priorityLabels[item.priority]}`).join("\n")}`,{inline_keyboard:keyboard}); return; }
  if (command === "/request") { if(!/^[0-9a-f-]{36}$/i.test(argument)) { await reply(String(chatId),"فرمت: <code>/request شناسه</code>"); return; } await showServiceRequest(argument,String(chatId)); return; }
  if (command === "/setstatus") { const match=argument.match(/^([0-9a-f-]{36})\s+(new|reviewing|in_progress|completed|rejected)$/i); if(!match){await reply(String(chatId),"فرمت: <code>/setstatus شناسه new|reviewing|in_progress|completed|rejected</code>");return;} const item=await updateServiceStatus(match[1],match[2],String(senderId)); if(!item){await reply(String(chatId),"درخواست پیدا نشد.");return;} await reply(String(chatId),await serviceRequestText(item),serviceRequestKeyboard(item)); return; }
  if (command === "/assign") { if(!/^[0-9a-f-]{36}$/i.test(argument)){await reply(String(chatId),"فرمت: <code>/assign شناسه</code>");return;} const item=await assignServiceRequest(argument,String(senderId)); if(!item){await reply(String(chatId),"درخواست پیدا نشد.");return;} await reply(String(chatId),await serviceRequestText(item),serviceRequestKeyboard(item)); return; }
  if (command === "/paid" || command === "/unpaid" || command === "/cancelinvoice") {
    const number = argument.trim().toUpperCase();
    if (!/^NX-\d{4}-\d{6}$/.test(number)) { await reply(String(chatId), `فرمت: <code>${command} NX-2026-001001</code>`); return; }
    const invoice = await setInvoicePayment(number, command === "/paid" ? "paid" : command === "/unpaid" ? "unpaid" : "cancelled");
    await reply(String(chatId), invoice ? `✅ وضعیت پرداخت فاکتور <code>${number}</code> ثبت شد.` : "فاکتوری با این شماره پیدا نشد.");
    return;
  }
  if (command === "/replyorder" || command === "/replyrequest") {
    const match = argument.match(/^([0-9a-f-]{36})\s+([\s\S]+)$/i);
    if (!match) { await reply(String(chatId), "فرمت: <code>/replyorder شناسه متن پاسخ</code>"); return; }
    const sent = await sendOrderReply(match[1], match[2], String(senderId));
    await reply(String(chatId), sent ? "✅ پاسخ سفارش ارسال شد." : "سفارش پیدا نشد.");
    return;
  }
  if (command === "/quote") { const match=argument.match(/^([0-9a-f-]{36})\s+([\s\S]+)$/i); if(!match){await reply(String(chatId),"فرمت: <code>/quote شناسه مبلغ</code>");return;} const item=await getServiceRequest(match[1]); if(!item){await reply(String(chatId),"درخواست پیدا نشد.");return;} const price=cleanText(match[2],80); await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(item.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({quoted_price:price,updated_at:new Date().toISOString()})}); await logServiceEvent(item.id,String(senderId),"quote",item.quoted_price,price); await notifyCustomerAboutRequest({...item,quoted_price:price},"quote").catch(()=>null); await syncInvoiceAmount(item.id,price).catch(()=>null); await reply(String(chatId),`💰 قیمت پیشنهادی ثبت شد: <b>${escapeTelegramHtml(price)}</b>`,{inline_keyboard:[[{text:"مشاهده درخواست",callback_data:`srview:${item.id}`}]]}); return; }
  if (command === "/note") { const match=argument.match(/^([0-9a-f-]{36})\s+([\s\S]+)$/i); if(!match){await reply(String(chatId),"فرمت: <code>/note شناسه متن یادداشت</code>");return;} const item=await getServiceRequest(match[1]); if(!item){await reply(String(chatId),"درخواست پیدا نشد.");return;} const note=cleanText(match[2],1000); await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(item.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({internal_note:note,updated_at:new Date().toISOString()})}); await logServiceEvent(item.id,String(senderId),"note",null,null,note); await reply(String(chatId),"📝 یادداشت داخلی ذخیره شد.",{inline_keyboard:[[{text:"مشاهده درخواست",callback_data:`srview:${item.id}`}]]}); return; }
  if (command === "/history") { if(!/^[0-9a-f-]{36}$/i.test(argument)){await reply(String(chatId),"فرمت: <code>/history شناسه</code>");return;} await showServiceEvents(argument,String(chatId)); return; }
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
    await notifyCustomerAboutReply(id).catch(() => null);
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
  if (!secret || !safeEqual(hashAccessToken(request.headers.get("x-telegram-bot-api-secret-token") || ""), hashAccessToken(secret))) {
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

