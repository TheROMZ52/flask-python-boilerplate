import { NextResponse } from "next/server";
import { escapeTelegramHtml, sendTelegramMessage } from "@/lib/support/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const priorities: Record<string, string> = {
  normal: "عادی",
  urgent: "فوری",
  critical: "اضطراری",
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = clean(body.name, 100);
    const telegram = clean(body.telegram, 100);
    const service = clean(body.service, 100);
    const priority = clean(body.priority, 20);
    const details = clean(body.details, 3000);

    if (!name || !telegram || !service || !details) {
      return NextResponse.json({ ok: false, error: "لطفاً همه فیلدها را کامل کن." }, { status: 400 });
    }
    if (!Object.hasOwn(priorities, priority)) {
      return NextResponse.json({ ok: false, error: "اولویت انتخاب‌شده معتبر نیست." }, { status: 400 });
    }
    if (details.length < 10) {
      return NextResponse.json({ ok: false, error: "توضیحات پروژه باید حداقل ۱۰ کاراکتر باشد." }, { status: 400 });
    }

    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(value => value.trim()).filter(Boolean);
    if (!adminIds.length) {
      return NextResponse.json({ ok: false, error: "سیستم دریافت درخواست موقتاً در دسترس نیست." }, { status: 503 });
    }

    const message = [
      "🆕 <b>درخواست خدمات جدید NexvorDEV</b>",
      "",
      `<b>نام:</b> ${escapeTelegramHtml(name)}`,
      `<b>راه ارتباطی:</b> ${escapeTelegramHtml(telegram)}`,
      `<b>نوع خدمات:</b> ${escapeTelegramHtml(service)}`,
      `<b>اولویت:</b> ${priorities[priority]}`,
      "",
      "<b>توضیحات پروژه:</b>",
      escapeTelegramHtml(details),
    ].join("\n");

    const deliveries = await Promise.allSettled(adminIds.map(id => sendTelegramMessage(id, message)));
    if (!deliveries.some(item => item.status === "fulfilled")) {
      return NextResponse.json({ ok: false, error: "ارسال درخواست ناموفق بود؛ لطفاً کمی بعد دوباره تلاش کن." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "در پردازش درخواست مشکلی پیش آمد." }, { status: 400 });
  }
}
