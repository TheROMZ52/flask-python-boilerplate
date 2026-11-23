import { NextResponse } from "next/server";
import { clientKey, HOURS, limited } from "@/lib/rate-limit";
import { consumeEmailToken, createNotification, displayName, getProfile } from "@/lib/auth/account";
import { updateAuthUser } from "@/lib/supabase/admin";
import { passwordChangedMessage, sendMail } from "@/lib/mail";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return NextResponse.json({ ok: false, error: "رمز عبور باید حداقل ۸ کاراکتر و شامل حرف انگلیسی و عدد باشد." }, { status: 400 });
    if (await limited(`reset:ip:${clientKey(request)}`, 10, HOURS)) return NextResponse.json({ ok: false, error: "تلاش‌های زیادی انجام شد؛ کمی بعد دوباره امتحان کن." }, { status: 429 });
    const userId = await consumeEmailToken(token, "reset");
    if (!userId) return NextResponse.json({ ok: false, error: "لینک بازیابی نامعتبر یا منقضی شده است. دوباره درخواست بده." }, { status: 400 });
    const updated = await updateAuthUser(userId, { password, email_confirm: true });
    if (!updated.ok) return NextResponse.json({ ok: false, error: "تغییر رمز انجام نشد؛ دوباره تلاش کن." }, { status: 502 });
    const profile = await getProfile(userId);
    await createNotification(userId, "account", "رمز عبور تغییر کرد", "رمز عبور حساب شما با لینک بازیابی تغییر کرد.", "/account");
    if (profile?.email) await sendMail({ to: profile.email, ...passwordChangedMessage(displayName(profile)) }).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "مشکلی پیش آمد؛ دوباره تلاش کن." }, { status: 500 });
  }
}
