import { NextResponse } from "next/server";
import { verifiedAccount } from "@/lib/auth/account";
import { getInvoice, resendInvoice } from "@/lib/invoice";
import { limited, HOURS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const account = await verifiedAccount();
  if (!account || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, error: "پیدا نشد." }, { status: 404 });
  const invoice = await getInvoice(id);
  if (!invoice || invoice.user_id !== account.user.id) return NextResponse.json({ ok: false, error: "پیدا نشد." }, { status: 404 });
  if (await limited(`invoice-resend:${id}`, 3, HOURS)) return NextResponse.json({ ok: false, error: "این فاکتور اخیراً چند بار ارسال شده؛ کمی بعد دوباره امتحان کن." }, { status: 429 });
  try {
    await resendInvoice({ ...invoice, customer_email: account.email || invoice.customer_email });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "ارسال ایمیل انجام نشد؛ کمی بعد دوباره تلاش کن." }, { status: 502 });
  }
}
