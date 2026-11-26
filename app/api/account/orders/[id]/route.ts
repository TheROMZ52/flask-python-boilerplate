import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/account";
import { cleanText, supportDb } from "@/lib/support/server";
import { limited, MINUTES } from "@/lib/rate-limit";
import { notifyAdminAboutOrderMessage } from "@/lib/support/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

async function ownedRequest(id: string, userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}&select=id,service_type,priority,status,quoted_price,created_at,updated_at,details&limit=1`) as Array<Record<string, unknown>>;
  return rows[0] || null;
}

export async function GET(_request: Request, context: Context) {
  const account = await currentAccount();
  if (!account?.verified) return NextResponse.json({ error: "برای مشاهده سفارش وارد حساب تأییدشده شو." }, { status: 401 });
  try {
    const { id } = await context.params;
    const order = await ownedRequest(id, account.user.id);
    if (!order) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    const messages = await supportDb(`nexvor_order_messages?request_id=eq.${encodeURIComponent(id)}&select=id,sender_role,body,created_at&order=created_at.asc`);
    return NextResponse.json({ order, messages });
  } catch {
    return NextResponse.json({ error: "دریافت گفت‌وگوی سفارش ممکن نشد." }, { status: 503 });
  }
}

export async function POST(request: Request, context: Context) {
  const account = await currentAccount();
  if (!account?.verified) return NextResponse.json({ error: "برای ارسال پیام وارد حساب تأییدشده شو." }, { status: 401 });
  try {
    const { id } = await context.params;
    const order = await ownedRequest(id, account.user.id);
    if (!order) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    if (await limited(`order-message:${id}:${account.user.id}`, 20, MINUTES)) return NextResponse.json({ error: "پیام‌های زیادی فرستاده‌ای؛ کمی بعد دوباره تلاش کن." }, { status: 429 });
    const body = cleanText((await request.json()).body, 4000);
    if (!body) return NextResponse.json({ error: "متن پیام خالی است." }, { status: 400 });
    await supportDb("nexvor_order_messages", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ request_id: id, sender_role: "customer", body }) });
    await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ awaiting_reply: true, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
    await notifyAdminAboutOrderMessage(id).catch(() => null);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ارسال پیام انجام نشد." }, { status: 503 });
  }
}
