import { NextResponse } from "next/server";
import { cleanText, hashAccessToken, newAccessToken, supportDb } from "@/lib/support/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const first_name = cleanText(body.first_name, 80);
    const last_name = cleanText(body.last_name, 80);
    const telegram_username = cleanText(body.telegram_username, 64).replace(/^@/, "");
    const subject = cleanText(body.subject, 120);
    const message = cleanText(body.message, 4000);
    const age = Number(body.age);

    if (!first_name || !last_name || !telegram_username || !subject || !message || !Number.isInteger(age) || age < 13 || age > 110) {
      return NextResponse.json({ error: "لطفاً همه فیلدها را درست تکمیل کن." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]{4,32}$/.test(telegram_username)) {
      return NextResponse.json({ error: "آیدی تلگرام معتبر نیست." }, { status: 400 });
    }

    const accessToken = newAccessToken();
    const tickets = await supportDb("nexvor_support_tickets", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        first_name, last_name, age, telegram_username, subject,
        access_token_hash: hashAccessToken(accessToken),
      }),
    }) as Array<{ id: string; status: string }>;

    const ticket = tickets?.[0];
    if (!ticket?.id) throw new Error("Ticket could not be created");

    try {
      await supportDb("nexvor_support_messages", {
        method: "POST",
        body: JSON.stringify({ ticket_id: ticket.id, sender_role: "customer", body: message }),
      });
    } catch (error) {
      await supportDb(`nexvor_support_tickets?id=eq.${ticket.id}`, { method: "DELETE" }).catch(() => null);
      throw error;
    }

    return NextResponse.json({ ticketId: ticket.id, accessToken, status: ticket.status });
  } catch {
    return NextResponse.json({ error: "ثبت درخواست با مشکل روبه‌رو شد. کمی بعد دوباره تلاش کن." }, { status: 503 });
  }
}
