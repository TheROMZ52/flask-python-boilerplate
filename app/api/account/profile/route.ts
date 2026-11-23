import { NextResponse } from "next/server";
import { currentAccount, upsertProfile } from "@/lib/auth/account";
import { updateAuthUser } from "@/lib/supabase/admin";
import { limited, MINUTES } from "@/lib/rate-limit";

export const runtime = "nodejs";
const clean = (value: unknown, max: number) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function PATCH(request: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ ok: false, error: "وارد حساب نشده‌ای." }, { status: 401 });
  if (await limited(`profile:${account.user.id}`, 20, 10 * MINUTES)) return NextResponse.json({ ok: false, error: "کمی بعد دوباره تلاش کن." }, { status: 429 });
  try {
    const body = await request.json();
    const firstName = clean(body.first_name, 40), lastName = clean(body.last_name, 40), telegram = clean(body.telegram, 64).replace(/^@/, "");
    if (firstName.length < 2 || lastName.length < 2) return NextResponse.json({ ok: false, error: "نام و نام خانوادگی را کامل وارد کن." }, { status: 400 });
    if (telegram && !/^[A-Za-z0-9_]{3,32}$/.test(telegram)) return NextResponse.json({ ok: false, error: "آیدی تلگرام معتبر نیست." }, { status: 400 });
    await upsertProfile({ user_id: account.user.id, first_name: firstName, last_name: lastName });
    await updateAuthUser(account.user.id, { user_metadata: { ...(account.user.user_metadata || {}), first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`, telegram } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "ذخیره پروفایل انجام نشد." }, { status: 500 });
  }
}
