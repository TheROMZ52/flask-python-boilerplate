import { NextResponse } from "next/server";
import { clientKey, HOURS, limited } from "@/lib/rate-limit";
import { createEmailToken, displayName, getProfileByEmail, normalizeEmail, validEmail } from "@/lib/auth/account";
import { sendMail, verifyEmailMessage } from "@/lib/mail";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ok = NextResponse.json({ ok: true });
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    if (!validEmail(email)) return ok;
    if (await limited(`resend:ip:${clientKey(request)}`, 6, HOURS) || await limited(`resend:email:${email}`, 3, HOURS)) return NextResponse.json({ ok: false, error: "تعداد درخواست‌ها زیاد بود؛ کمی بعد دوباره امتحان کن." }, { status: 429 });
    const profile = await getProfileByEmail(email);
    if (!profile || profile.email_verified_at) return ok;
    const token = await createEmailToken(profile.user_id, "verify", 24 * HOURS);
    await sendMail({ to: email, ...verifyEmailMessage(displayName(profile), `${siteUrl}/auth/verify?token=${token}`) });
  } catch {}
  return ok;
}
