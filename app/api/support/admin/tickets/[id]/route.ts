import { notifyCustomerAboutReply } from "@/lib/bot/public";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, cleanText, isAdminSessionValid, supportDb } from "@/lib/support/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

async function authorized() {
  const cookieStore = await cookies();
  return isAdminSessionValid(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function GET(_request: Request, context: Context) {
  try {
    if (!await authorized()) return NextResponse.json({ error: "ابتدا وارد پنل مدیریت شو." }, { status: 401 });
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
    const tickets = await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id,first_name,last_name,age,telegram_username,subject,status,created_at,last_message_at&limit=1`) as Array<Record<string, unknown>>;
    if (!tickets?.[0]) return NextResponse.json({ error: "درخواست پیدا نشد." }, { status: 404 });
    const messages = await supportDb(`nexvor_support_messages?ticket_id=eq.${encodeURIComponent(id)}&select=id,sender_role,body,created_at&order=created_at.asc`);
    return NextResponse.json({ ticket: tickets[0], messages });
  } catch {
    return NextResponse.json({ error: "دریافت گفت‌وگو ممکن نشد." }, { status: 503 });
  }
}

export async function POST(request: Request, context: Context) {
  try {
    if (!await authorized()) return NextResponse.json({ error: "ابتدا وارد پنل مدیریت شو." }, { status: 401 });
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
    const body = cleanText((await request.json()).body, 4000);
    if (!body) return NextResponse.json({ error: "متن پاسخ خالی است." }, { status: 400 });
    const rows = await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id,status&limit=1`) as Array<{ id: string; status: string }>;
    if (!rows?.[0]) return NextResponse.json({ error: "درخواست پیدا نشد." }, { status: 404 });
    if (rows[0].status === "closed") return NextResponse.json({ error: "این درخواست بسته شده است." }, { status: 409 });
    await supportDb("nexvor_support_messages", {
      method: "POST", body: JSON.stringify({ ticket_id: id, sender_role: "admin", body }),
    });
    await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "answered", last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    });
    await notifyCustomerAboutReply(id).catch(() => null);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ارسال پاسخ انجام نشد." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    if (!await authorized()) return NextResponse.json({ error: "ابتدا وارد پنل مدیریت شو." }, { status: 401 });
    const { id } = await context.params;
    const status = cleanText((await request.json()).status, 20);
    if (!/^[0-9a-f-]{36}$/i.test(id) || !["waiting", "answered", "closed"].includes(status)) {
      return NextResponse.json({ error: "وضعیت یا شناسه نامعتبر است." }, { status: 400 });
    }
    await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "تغییر وضعیت انجام نشد." }, { status: 503 });
  }
}
