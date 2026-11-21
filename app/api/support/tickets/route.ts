import { NextResponse } from "next/server";
import { clientKey, DAYS, HOURS, limited } from "@/lib/rate-limit";
import { sessionUser } from "@/lib/supabase/server";
import { cleanText, hashAccessToken, newAccessToken, supportDb } from "@/lib/support/server";
import { notifyAdminAboutNewTicket } from "@/lib/support/telegram";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await sessionUser();
    if (await limited(`ticket:ip:${clientKey(request)}`, 5, HOURS) || (user && await limited(`ticket:user:${user.id}`, 8, HOURS))) return NextResponse.json({ error: "درخواست‌های زیادی ثبت شد؛ کمی بعد دوباره تلاش کن." }, { status: 429 });
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

    const open = await supportDb(`nexvor_support_tickets?telegram_username=eq.${encodeURIComponent(telegram_username)}&status=neq.closed&select=id`) as Array<{ id: string }>;
    if ((open?.length || 0) >= 3) return NextResponse.json({ error: "برای این آیدی تلگرام چند درخواست باز وجود دارد. اول درخواست‌های قبلی را پیگیری کن یا منتظر بسته‌شدنشان بمان." }, { status: 429 });
    if (await limited(`ticket:tg:${telegram_username.toLowerCase()}`, 10, DAYS)) return NextResponse.json({ error: "تعداد درخواست‌های امروز برای این آیدی به سقف رسیده است." }, { status: 429 });

    const accessToken = newAccessToken();
    const tickets = await supportDb("nexvor_support_tickets", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        first_name, last_name, age, telegram_username, subject,
        access_token_hash: hashAccessToken(accessToken), user_id: user?.id ?? null,
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

    await notifyAdminAboutNewTicket(ticket.id).catch(() => null);
    return NextResponse.json({ ticketId: ticket.id, accessToken, status: ticket.status });
  } catch {
    return NextResponse.json({ error: "ثبت درخواست با مشکل روبه‌رو شد. کمی بعد دوباره تلاش کن." }, { status: 503 });
  }
}
