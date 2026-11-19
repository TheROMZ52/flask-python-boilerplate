import { NextResponse } from "next/server";

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
      url: "https://nexvordev-site.vercel.app/api/telegram/webhook",
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
  const commandsResponse = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
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
        { command: "whoami", description: "نمایش شناسه مدیر" },
        { command: "help", description: "راهنمای دستورات" }
      ]
    }),
    cache: "no-store",
  });
  const commandsResult = await commandsResponse.json();
  return NextResponse.json({
    ok: true,
    webhook: "configured",
    updates: ["message", "callback_query"],
    commands: Boolean(commandsResponse.ok && commandsResult.ok),
  });
}
