import { NextResponse } from "next/server";
import { supportDb } from "@/lib/support/server";
import { currentAccount } from "@/lib/auth/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const userId = encodeURIComponent(account.user.id);
  const filter = typeof body.id === "string" && /^[0-9a-f-]{36}$/i.test(body.id) ? `&id=eq.${body.id}` : "";
  await supportDb(`nexvor_notifications?user_id=eq.${userId}&read_at=is.null${filter}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ read_at: new Date().toISOString() }) });
  return NextResponse.json({ ok: true });
}
