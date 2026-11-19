import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, safeEqual } from "@/lib/support/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const configuredPassword = process.env.SUPPORT_ADMIN_PASSWORD;
    if (!configuredPassword) return NextResponse.json({ error: "ورود مدیریت هنوز پیکربندی نشده است." }, { status: 503 });
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";
    if (!safeEqual(password, configuredPassword)) return NextResponse.json({ error: "رمز عبور اشتباه است." }, { status: 401 });
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, createAdminSession(), {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "strict", path: "/", maxAge: 60 * 60 * 12,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "ورود انجام نشد." }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
