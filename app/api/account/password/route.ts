import { NextResponse } from "next/server";
import { currentAccount, createNotification, displayName } from "@/lib/auth/account";
import { checkPassword, updateAuthUser } from "@/lib/supabase/admin";
import { limited, MINUTES } from "@/lib/rate-limit";
import { passwordChangedMessage, sendMail } from "@/lib/mail";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ ok: false, error: "وارد حساب نشده‌ای." }, { status: 401 });
  if (await limited(`password:${account.user.id}`, 6, 30 * MINUTES)) return NextResponse.json({ ok: false, error: "تلاش‌های زیادی انجام شد؛ کمی بعد دوباره امتحان کن." }, { status: 429 });
  try {
    const body = await request.json();
    const current = typeof body.current === "string" ? body.current : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return NextResponse.json({ ok: false, error: "رمز جدید باید حداقل ۸ کاراکتر و شامل حرف انگلیسی و عدد باشد." }, { status: 400 });
    if (!account.email || !(await checkPassword(account.email, current))) return NextResponse.json({ ok: false, error: "رمز فعلی درست نیست." }, { status: 400 });
    const updated = await updateAuthUser(account.user.id, { password });
    if (!updated.ok) return NextResponse.json({ ok: false, error: "تغییر رمز انجام نشد." }, { status: 502 });
    await createNotification(account.user.id, "account", "رمز عبور تغییر کرد", "رمز عبور حساب شما از طریق پنل کاربری تغییر کرد.", "/account");
    await sendMail({ to: account.email, ...passwordChangedMessage(displayName(account.profile, account.user)) }).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "مشکلی پیش آمد." }, { status: 500 });
  }
}
