import { NextResponse } from "next/server";
import { consumeEmailToken, createNotification, upsertProfile } from "@/lib/auth/account";
import { updateAuthUser } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  try {
    const userId = await consumeEmailToken(token, "verify");
    if (!userId) return NextResponse.redirect(`${siteUrl}/account?verify=invalid`);
    await upsertProfile({ user_id: userId, email_verified_at: new Date().toISOString() });
    await updateAuthUser(userId, { email_confirm: true });
    await createNotification(userId, "account", "حساب شما فعال شد", "ایمیل شما تأیید شد و می‌توانید سفارش و تیکت ثبت کنید.", "/account");
    return NextResponse.redirect(`${siteUrl}/account?verify=ok`);
  } catch {
    return NextResponse.redirect(`${siteUrl}/account?verify=error`);
  }
}
