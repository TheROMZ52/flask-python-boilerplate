import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, cleanText, isAdminSessionValid, supportDb } from "@/lib/support/server";
import { notifyCustomerAboutOrderReply, notifyCustomerAboutRequest } from "@/lib/bot/public";
import { syncInvoiceAmount } from "@/lib/invoice";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const statuses = ["new", "reviewing", "in_progress", "completed", "rejected"];

async function authorized() {
  const store = await cookies();
  return isAdminSessionValid(store.get(ADMIN_COOKIE)?.value);
}
async function getRequest(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}&select=*&limit=1`) as Array<Record<string, unknown>>;
  return rows[0] || null;
}
async function logEvent(id: string, type: string, oldValue?: unknown, newValue?: unknown, note?: string) {
  await supportDb("nexvor_service_request_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ request_id: id, actor_telegram_id: "website-admin", event_type: type, old_value: oldValue == null ? null : String(oldValue), new_value: newValue == null ? null : String(newValue), note: note || null }) });
}

export async function GET(_request: Request, context: Context) {
  if (!await authorized()) return NextResponse.json({ error: "ابتدا وارد پنل مدیریت شو." }, { status: 401 });
  try {
    const { id } = await context.params;
    const item = await getRequest(id);
    if (!item) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    const [messages, events] = await Promise.all([
      supportDb(`nexvor_order_messages?request_id=eq.${encodeURIComponent(id)}&select=id,sender_role,body,created_at&order=created_at.asc`),
      supportDb(`nexvor_service_request_events?request_id=eq.${encodeURIComponent(id)}&select=actor_telegram_id,event_type,old_value,new_value,note,created_at&order=created_at.desc&limit=30`),
    ]);
    return NextResponse.json({ request: item, messages, events });
  } catch {
    return NextResponse.json({ error: "دریافت جزئیات سفارش ممکن نشد." }, { status: 503 });
  }
}

export async function POST(request: Request, context: Context) {
  if (!await authorized()) return NextResponse.json({ error: "ابتدا وارد پنل مدیریت شو." }, { status: 401 });
  try {
    const { id } = await context.params;
    const item = await getRequest(id);
    if (!item) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    const body = cleanText((await request.json()).body, 4000);
    if (!body) return NextResponse.json({ error: "متن پاسخ خالی است." }, { status: 400 });
    await supportDb("nexvor_order_messages", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ request_id: id, sender_role: "admin", body }) });
    await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ awaiting_reply: false, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
    await logEvent(id, "message", null, null, body.slice(0, 1000));
    await notifyCustomerAboutOrderReply(id, body).catch(() => null);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ارسال پاسخ انجام نشد." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: Context) {
  if (!await authorized()) return NextResponse.json({ error: "ابتدا وارد پنل مدیریت شو." }, { status: 401 });
  try {
    const { id } = await context.params;
    const current = await getRequest(id);
    if (!current) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    const body = await request.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) return NextResponse.json({ error: "وضعیت انتخاب‌شده معتبر نیست." }, { status: 400 });
      patch.status = body.status;
      patch.completed_at = body.status === "completed" ? new Date().toISOString() : null;
      await logEvent(id, "status", current.status, body.status);
    }
    if (body.quoted_price !== undefined) {
      const price = cleanText(body.quoted_price, 80);
      if (!price) return NextResponse.json({ error: "مبلغ پیشنهادی خالی است." }, { status: 400 });
      patch.quoted_price = price;
      await logEvent(id, "quote", current.quoted_price, price);
    }
    if (body.internal_note !== undefined) {
      const note = cleanText(body.internal_note, 1000);
      patch.internal_note = note || null;
      await logEvent(id, "note", current.internal_note, null, note);
    }
    if (body.assigned_to !== undefined) {
      const assigned = cleanText(body.assigned_to, 80);
      patch.assigned_to = assigned || null;
      await logEvent(id, "assigned", current.assigned_to, assigned || null);
    }
    await supportDb(`nexvor_service_requests?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
    const updated = await getRequest(id);
    if (updated && body.status !== undefined) await notifyCustomerAboutRequest(updated as never, "status").catch(() => null);
    if (updated && body.quoted_price !== undefined) {
      await notifyCustomerAboutRequest(updated as never, "quote").catch(() => null);
      await syncInvoiceAmount(id, String(updated.quoted_price || "")).catch(() => null);
    }
    return NextResponse.json({ success: true, request: updated });
  } catch {
    return NextResponse.json({ error: "ذخیره تغییرات سفارش انجام نشد." }, { status: 503 });
  }
}
