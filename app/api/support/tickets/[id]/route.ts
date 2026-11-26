import { NextResponse } from "next/server";
import { hashAccessToken, safeEqual, supportDb } from "@/lib/support/server";
import { sessionUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

async function getAuthorizedTicket(id: string, token: string, userId?: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || token.length > 200) return null;
  const rows = await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id,first_name,last_name,subject,status,created_at,last_message_at,access_token_hash,user_id&limit=1`) as Array<Record<string, string>>;
  const ticket = rows?.[0];
  if (!ticket) return null;
  const owner = !!userId && ticket.user_id === userId;
  if (!owner && (!token || !safeEqual(ticket.access_token_hash, hashAccessToken(token)))) return null;
  return ticket;
}

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const token = request.headers.get("x-ticket-token") || "";
    const user = await sessionUser();
    const ticket = await getAuthorizedTicket(id, token, user?.id);
    if (!ticket) return NextResponse.json({ error: "درخواست پیدا نشد یا لینک دسترسی معتبر نیست." }, { status: 404 });
    const messages = await supportDb(`nexvor_support_messages?ticket_id=eq.${encodeURIComponent(id)}&select=id,sender_role,body,created_at&order=created_at.asc`);
    const safeTicket = Object.fromEntries(Object.entries(ticket).filter(([key]) => key !== "access_token_hash" && key !== "user_id"));
    return NextResponse.json({ ticket: safeTicket, messages });
  } catch {
    return NextResponse.json({ error: "دریافت پیام‌ها ممکن نشد." }, { status: 503 });
  }
}
