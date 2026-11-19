import { NextResponse } from "next/server";
import { cleanText, hashAccessToken, safeEqual, supportDb } from "@/lib/support/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const token = request.headers.get("x-ticket-token") || "";
    if (!/^[0-9a-f-]{36}$/i.test(id) || !token) return NextResponse.json({ error: "دسترسی نامعتبر است." }, { status: 401 });
    const rows = await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id,status,access_token_hash&limit=1`) as Array<{ id: string; status: string; access_token_hash: string }>;
    const ticket = rows?.[0];
    if (!ticket || !safeEqual(ticket.access_token_hash, hashAccessToken(token))) return NextResponse.json({ error: "دسترسی نامعتبر است." }, { status: 404 });
    if (ticket.status === "closed") return NextResponse.json({ error: "این درخواست بسته شده است." }, { status: 409 });
    const body = cleanText((await request.json()).body, 4000);
    if (!body) return NextResponse.json({ error: "متن پیام خالی است." }, { status: 400 });
    await supportDb("nexvor_support_messages", { method: "POST", body: JSON.stringify({ ticket_id: id, sender_role: "customer", body }) });
    await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "waiting", last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ارسال پیام انجام نشد." }, { status: 503 });
  }
}
