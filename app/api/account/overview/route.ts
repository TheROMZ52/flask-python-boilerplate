import { NextResponse } from "next/server";
import { supportDb } from "@/lib/support/server";
import { currentAccount } from "@/lib/auth/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ ok: false, error: "وارد حساب نشده‌ای." }, { status: 401 });
  const { user, profile, verified } = account;
  const meta = user.user_metadata || {};
  const providers = Array.isArray(user.app_metadata?.providers) ? (user.app_metadata.providers as string[]) : [];
  const base = {
    id: user.id,
    email: user.email ?? null,
    name: account.name,
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    avatar: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
    telegram: String(meta.telegram || ""),
    providers,
    createdAt: user.created_at,
    verified,
  };
  if (!verified) return NextResponse.json({ ok: true, user: base, tickets: [], requests: [], invoices: [], notifications: [], unread: 0 });
  try {
    const id = encodeURIComponent(user.id);
    const [tickets, requests, invoices, notifications] = await Promise.all([
      supportDb(`nexvor_support_tickets?user_id=eq.${id}&select=id,subject,status,created_at,last_message_at&order=last_message_at.desc&limit=100`),
      supportDb(`nexvor_service_requests?user_id=eq.${id}&select=id,service_type,priority,status,quoted_price,created_at,updated_at&order=created_at.desc&limit=100`),
      supportDb(`nexvor_invoices?user_id=eq.${id}&select=id,number,description,amount,currency,payment_status,issued_at,request_id&order=issued_at.desc&limit=100`),
      supportDb(`nexvor_notifications?user_id=eq.${id}&select=id,kind,title,body,href,read_at,created_at&order=created_at.desc&limit=50`),
    ]);
    const list = (notifications || []) as Array<{ read_at: string | null }>;
    return NextResponse.json({ ok: true, user: base, tickets: tickets || [], requests: requests || [], invoices: invoices || [], notifications: list, unread: list.filter(item => !item.read_at).length });
  } catch {
    return NextResponse.json({ ok: false, error: "دریافت اطلاعات حساب ممکن نشد." }, { status: 503 });
  }
}
