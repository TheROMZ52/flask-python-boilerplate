import { NextResponse } from "next/server";
import { clientKey, HOURS, limited } from "@/lib/rate-limit";
import { createAuthUser, deleteAuthUser } from "@/lib/supabase/admin";
import { createEmailToken, getProfileByEmail, normalizeEmail, upsertProfile, validEmail } from "@/lib/auth/account";
import { sendMail, verifyEmailMessage } from "@/lib/mail";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
const clean = (value: unknown, max: number) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return fail("درخواست نامعتبر است."); }
  const firstName = clean(body.first_name, 40);
  const lastName = clean(body.last_name, 40);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (firstName.length < 2 || lastName.length < 2) return fail("نام و نام خانوادگی را وارد کن.");
  if (!validEmail(email)) return fail("ایمیل واردشده معتبر نیست.");
  if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return fail("رمز عبور باید حداقل ۸ کاراکتر و شامل حرف انگلیسی و عدد باشد.");
  if (await limited(`signup:ip:${clientKey(request)}`, 6, HOURS) || await limited(`signup:email:${email}`, 4, HOURS)) return fail("تلاش‌های زیادی انجام شد؛ کمی بعد دوباره امتحان کن.", 429);

  try {
    const existing = await getProfileByEmail(email);
    if (existing?.email_verified_at) return fail("با این ایمیل قبلاً حساب ساخته شده است. وارد شو یا رمزت را بازیابی کن.", 409);
    let userId = existing?.user_id;
    if (!userId) {
      const created = await createAuthUser({ email, password, firstName, lastName });
      if (!created.ok) {
        const code = String(created.data.error_code || created.data.code || "");
        if (code === "email_exists" || created.status === 422) return fail("با این ایمیل قبلاً حساب ساخته شده است. وارد شو یا رمزت را بازیابی کن.", 409);
        return fail("ساخت حساب انجام نشد؛ دوباره تلاش کن.", 502);
      }
      userId = String(created.data.id);
      await upsertProfile({ user_id: userId, email, first_name: firstName, last_name: lastName, email_verified_at: null });
    }
    const token = await createEmailToken(userId, "verify", 24 * HOURS);
    try {
      const message = verifyEmailMessage(`${firstName} ${lastName}`, `${siteUrl}/auth/verify?token=${token}`);
      await sendMail({ to: email, ...message });
    } catch {
      if (!existing) await deleteAuthUser(userId).catch(() => null);
      return fail("ارسال ایمیل تأیید انجام نشد؛ کمی بعد دوباره تلاش کن.", 502);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return fail("مشکلی پیش آمد؛ کمی بعد دوباره تلاش کن.", 500);
  }
}
