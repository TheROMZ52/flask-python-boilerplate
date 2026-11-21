import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";

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

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${siteUrl}/api/telegram/webhook`,
      secret_token: webhookSecret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    return NextResponse.json({ ok: false, error: "Telegram rejected webhook setup" }, { status: 502 });
  }
  const call = (method: string, payload: Record<string, unknown>) => fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store",
  }).then(res => res.json()).catch(() => ({ ok: false }));
  const publicCommands = [
    { command: "start", description: "شروع و منوی اصلی" },
    { command: "order", description: "ثبت سفارش جدید" },
    { command: "newticket", description: "باز کردن تیکت پشتیبانی" },
    { command: "my", description: "سفارش‌ها و تیکت‌های من" },
    { command: "prices", description: "تعرفه خدمات" },
    { command: "services", description: "فهرست خدمات" },
    { command: "cancel", description: "لغو مرحله فعلی" },
    { command: "help", description: "راهنما" },
  ];
  const adminCommands = [
    { command: "panel", description: "داشبورد مدیریت پشتیبانی" },
    { command: "requests", description: "فهرست درخواست‌های خدمات" },
    { command: "request", description: "جزئیات درخواست خدمات" },
    { command: "searchrequest", description: "جست‌وجوی درخواست خدمات" },
    { command: "setstatus", description: "تغییر وضعیت درخواست" },
    { command: "assign", description: "اختصاص درخواست به خود" },
    { command: "quote", description: "ثبت قیمت پیشنهادی" },
    { command: "note", description: "یادداشت داخلی درخواست" },
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
  const commandsResult = commandsResponse as { ok?: boolean };
  return NextResponse.json({
    ok: true,
    webhook: "configured",
    updates: ["message", "callback_query"],
    commands: Boolean(commandsResult.ok),
  });
}
