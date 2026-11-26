import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminSessionValid, supportDb } from "@/lib/support/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  if (!isAdminSessionValid(store.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "ابتدا وارد پنل مدیریت شو." }, { status: 401 });
  try {
    const requests = await supportDb("nexvor_service_requests?select=id,customer_name,telegram_contact,service_type,priority,status,quoted_price,assigned_to,awaiting_reply,last_message_at,created_at,updated_at&order=created_at.desc&limit=200");
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "دریافت سفارش‌ها ممکن نشد." }, { status: 503 });
  }
}
