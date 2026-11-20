import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCOUNT_COOKIE, createSession, findAccount, hashPassword, readSession, verifyPassword } from "@/lib/account";
import { cleanText, supportDb } from "@/lib/support/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

function setCookie(response: NextResponse, id: string, remember: boolean) {
  const session = createSession(id, remember);
  response.cookies.set(ACCOUNT_COOKIE, session.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: session.maxAge });
}

export async function GET() {
  const id = readSession((await cookies()).get(ACCOUNT_COOKIE)?.value);
  if (!id) return NextResponse.json({ ok: true, user: null });
  try {
    const account = await findAccount(`id=eq.${encodeURIComponent(id)}`);
    return NextResponse.json({ ok: true, user: account ? { username: account.username } : null });
  } catch {
    return NextResponse.json({ ok: true, user: null });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return fail("درخواست نامعتبر است."); }
  const action = cleanText(body.action, 10);

  if (action === "logout") {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ACCOUNT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  const username = cleanText(body.username, 24);
  const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";
  if (!/^[A-Za-z0-9_.]{3,24}$/.test(username)) return fail("نام کاربری باید ۳ تا ۲۴ حرف انگلیسی، عدد، نقطه یا خط زیر باشد.");

  try {
    if (action === "signup") {
      const email = cleanText(body.email, 120).toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("ایمیل واردشده معتبر نیست.");
      if (password.length < 8) return fail("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      if (await findAccount(`username=ilike.${encodeURIComponent(username)}`)) return fail("این نام کاربری قبلاً گرفته شده است.", 409);
      if (email && (await findAccount(`email=eq.${encodeURIComponent(email)}`))) return fail("با این ایمیل قبلاً حساب ساخته شده است.", 409);
      const rows = (await supportDb("nexvor_accounts", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ username, email: email || null, password_hash: hashPassword(password) }),
      })) as { id: string }[];
      const response = NextResponse.json({ ok: true, user: { username } });
      setCookie(response, rows[0].id, true);
      return response;
    }

    if (action === "login") {
      const account = await findAccount(`username=ilike.${encodeURIComponent(username)}`);
      if (!account || !verifyPassword(password, account.password_hash)) return fail("نام کاربری یا رمز عبور درست نیست.", 401);
      const response = NextResponse.json({ ok: true, user: { username: account.username } });
      setCookie(response, account.id, body.remember === true);
      return response;
    }
  } catch {
    return fail("مشکلی پیش آمد، چند لحظه بعد دوباره تلاش کنید.", 500);
  }
  return fail("درخواست نامعتبر است.");
}
