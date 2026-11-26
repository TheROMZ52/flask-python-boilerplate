import { NextResponse } from "next/server";
import { verifiedAccount } from "@/lib/auth/account";
import { createSiteLinkToken, completeBotLink, unlinkTelegram } from "@/lib/telegram/link";
import { limited, MINUTES } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const account = await verifiedAccount();
  if (!account) return NextResponse.json({ ok: false, error: "برای اتصال تلگرام ابتدا وارد حساب تأییدشده شو." }, { status: 401 });
  if (await limited(`telegram-link:${account.user.id}`, 8, MINUTES)) return NextResponse.json({ ok: false, error: "درخواست‌های زیادی ثبت شده؛ کمی بعد دوباره تلاش کن." }, { status: 429 });
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.code === "string" && body.code.trim()) {
      const linked = await completeBotLink(account.user.id, body.code);
      if (!linked) return NextResponse.json({ ok: false, error: "کد اتصال نامعتبر، منقضی یا قبلاً استفاده شده است." }, { status: 400 });
      return NextResponse.json({ ok: true, linked: true });
    }
    const token = await createSiteLinkToken(account.user.id);
    const username = (process.env.TELEGRAM_BOT_USERNAME || "nexvordev").replace(/^@/, "");
    return NextResponse.json({ ok: true, linked: false, url: `https://t.me/${username}?start=link_${token}`, expiresIn: 600 });
  } catch {
    return NextResponse.json({ ok: false, error: "ساخت لینک اتصال انجام نشد." }, { status: 503 });
  }
}

export async function DELETE() {
  const account = await verifiedAccount();
  if (!account) return NextResponse.json({ ok: false, error: "وارد حساب نشده‌ای." }, { status: 401 });
  try {
    await unlinkTelegram(account.user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "قطع اتصال تلگرام انجام نشد." }, { status: 503 });
  }
}
