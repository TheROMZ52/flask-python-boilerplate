import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";
import { telegramApiRequest } from "@/lib/support/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  const setupKey = process.env.TELEGRAM_SETUP_KEY;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!setupKey || key !== setupKey) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  if (!token || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Telegram configuration is incomplete" }, { status: 503 });
  }

  let result: { ok?: boolean };
  try {
    result = await telegramApiRequest("setWebhook", {
      url: `${siteUrl}/api/telegram/webhook`,
      secret_token: webhookSecret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Telegram rejected webhook setup" }, { status: 502 });
  }
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Telegram rejected webhook setup" }, { status: 502 });
  }
  const call = (method: string, payload: Record<string, unknown>) =>
    telegramApiRequest(method, payload).catch(() => ({ ok: false }));
  const publicCommands = [
    { command: "start", description: "شروع و منوی اصلی" },
    { command: "order", description: "ثبت سفارش جدید" },
    { command: "newticket", description: "باز کردن تیکت پشتیبانی" },
    { command: "my", description: "سفارش‌ها و تیکت‌های من" },
    { command: "prices", description: "تعرفه خدمات" },
    { command: "services", description: "فهرست خدمات" },
    { command: "cancel", description: "لغو مرحله فعلی" },
    { command: "link", description: "اتصال حساب سایت و تلگرام" },
    { command: "account", description: "ورود، ثبت‌نام و وضعیت حساب" },
    { command: "login", description: "ورود با کد یک‌بارمصرف ایمیل" },
    { command: "register", description: "ساخت حساب با تأیید ایمیل" },
    { command: "help", description: "راهنما" },
  ];
  const adminCommands = [
    { command: "panel", description: "داشبورد مدیریت پشتیبانی" },
    { command: "broadcast", description: "ارسال پیام به مشتریان" },
    { command: "requests", description: "فهرست درخواست‌های خدمات" },
    { command: "request", description: "جزئیات درخواست خدمات" },
    { command: "searchrequest", description: "جست‌وجوی درخواست خدمات" },
    { command: "setstatus", description: "تغییر وضعیت درخواست" },
    { command: "assign", description: "اختصاص درخواست به خود" },
    { command: "quote", description: "ثبت قیمت پیشنهادی" },
    { command: "replyorder", description: "پاسخ به سفارش مشتری" },
    { command: "replyrequest", description: "پاسخ جایگزین به سفارش مشتری" },
    { command: "note", description: "یادداشت داخلی درخواست" },
    { command: "paid", description: "ثبت پرداخت فاکتور" },
    { command: "unpaid", description: "ثبت پرداخت‌نشده فاکتور" },
    { command: "cancelinvoice", description: "لغو فاکتور" },
    { command: "history", description: "تاریخچه درخواست" },
    { command: "tickets", description: "فهرست تیکت‌ها" },
    { command: "ticket", description: "جزئیات یک تیکت" },
    { command: "reply", description: "پاسخ به مشتری" },
    { command: "search", description: "جست‌وجوی تیکت‌ها" },
    { command: "stats", description: "آمار پشتیبانی" },
    { command: "close", description: "بستن تیکت" },
    { command: "open", description: "بازکردن تیکت" },
    { command: "menu", description: "منوی مشتری" },
    { command: "whoami", description: "نمایش شناسه مدیر" },
  ];
  const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(value => value.trim()).filter(Boolean);
  const commandsResponse = await call("setMyCommands", { commands: publicCommands });
  await Promise.all(adminIds.map(id => call("setMyCommands", { commands: [...adminCommands, ...publicCommands.filter(item => item.command !== "help"), { command: "help", description: "راهنمای دستورات" }], scope: { type: "chat", chat_id: Number(id) } })));
  await call("setMyShortDescription", { short_description: "بات رسمی NexvorDEV: ثبت سفارش، پشتیبانی و پیگیری پروژه" });
  await call("setMyDescription", { description: "با این بات می‌تونی برای سرور بازی، پلاگین، سایت و زیرساخت سفارش بدی، تیکت پشتیبانی باز کنی، تعرفه رو ببینی و وضعیت کارهات رو پیگیری کنی." });
  await call("setChatMenuButton", { menu_button: { type: "commands" } });
  const webhookInfoResponse = await call("getWebhookInfo", {});
  const webhookInfo = webhookInfoResponse as {
    ok?: boolean;
    result?: {
      url?: string;
      has_custom_certificate?: boolean;
      pending_update_count?: number;
      ip_address?: string;
      last_error_date?: number;
      last_error_message?: string;
      allowed_updates?: string[];
    };
  };
  const info = webhookInfo.result;
  const commandsResult = commandsResponse as { ok?: boolean };
  return NextResponse.json({
    webhookInfo: webhookInfo.ok && info ? {
      url: info.url || null,
      pendingUpdates: info.pending_update_count ?? null,
      lastErrorDate: info.last_error_date ?? null,
      lastError: info.last_error_message || null,
      allowedUpdates: info.allowed_updates || [],
      ipAddress: info.ip_address || null,
    } : null,
    ok: true,
    webhook: "configured",
    updates: ["message", "callback_query"],
    commands: Boolean(commandsResult.ok),
  });
}
