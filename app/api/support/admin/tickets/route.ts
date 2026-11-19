import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminSessionValid, supportDb } from "@/lib/support/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    if (!isAdminSessionValid(cookieStore.get(ADMIN_COOKIE)?.value)) {
      return NextResponse.json({ error: "ابتدا وارد پنل مدیریت شو." }, { status: 401 });
    }
    const tickets = await supportDb("nexvor_support_tickets?select=id,first_name,last_name,age,telegram_username,subject,status,created_at,updated_at,last_message_at&order=last_message_at.desc");
    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ error: "دریافت درخواست‌ها ممکن نشد." }, { status: 503 });
  }
}
