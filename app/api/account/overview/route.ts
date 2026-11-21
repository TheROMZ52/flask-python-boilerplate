import { NextResponse } from "next/server";
import { supportDb } from "@/lib/support/server";
import { sessionUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "وارد حساب نشده‌ای." }, { status: 401 });
  try {
    const id = encodeURIComponent(user.id);
    const [tickets, requests] = await Promise.all([
      supportDb(`nexvor_support_tickets?user_id=eq.${id}&select=id,subject,status,created_at,last_message_at&order=last_message_at.desc&limit=100`),
      supportDb(`nexvor_service_requests?user_id=eq.${id}&select=id,service_type,priority,status,quoted_price,created_at,updated_at&order=created_at.desc&limit=100`),
    ]);
    const meta = user.user_metadata || {};
    const providers = Array.isArray(user.app_metadata?.providers) ? (user.app_metadata.providers as string[]) : [];
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email ?? null,
        name: String(meta.full_name || meta.name || meta.user_name || meta.preferred_username || ""),
        avatar: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
        telegram: String(meta.telegram || ""),
        providers,
        createdAt: user.created_at,
      },
      tickets: tickets || [],
      requests: requests || [],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "دریافت اطلاعات حساب ممکن نشد." }, { status: 503 });
  }
}
