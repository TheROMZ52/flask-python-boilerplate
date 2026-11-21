import { NextResponse } from "next/server";
import { hashAccessToken, safeEqual, supportDb } from "@/lib/support/server";
import { sessionUser } from "@/lib/supabase/server";
import { limited, MINUTES } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "وارد حساب نشده‌ای." }, { status: 401 });
  try {
    if (await limited(`claim:${user.id}`, 10, 10 * MINUTES)) return NextResponse.json({ ok: false, error: "کمی بعد دوباره تلاش کن." }, { status: 429 });
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    let claimed = 0;
    for (const item of items) {
      const id = typeof item?.id === "string" ? item.id : "";
      const token = typeof item?.token === "string" ? item.token.slice(0, 200) : "";
      if (!/^[0-9a-f-]{36}$/i.test(id) || !token) continue;
      const rows = (await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&select=id,access_token_hash,user_id&limit=1`)) as Array<{ id: string; access_token_hash: string; user_id: string | null }>;
      const ticket = rows?.[0];
      if (!ticket || ticket.user_id || !safeEqual(ticket.access_token_hash, hashAccessToken(token))) continue;
      await supportDb(`nexvor_support_tickets?id=eq.${encodeURIComponent(id)}&user_id=is.null`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ user_id: user.id }) });
      claimed++;
    }
    return NextResponse.json({ ok: true, claimed });
  } catch {
    return NextResponse.json({ ok: false, error: "اضافه‌کردن تیکت‌ها ممکن نشد." }, { status: 503 });
  }
}
