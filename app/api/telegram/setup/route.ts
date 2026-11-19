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
  return NextResponse.json({ ok: true, webhook: "configured", updates: ["message", "callback_query"] });
}
