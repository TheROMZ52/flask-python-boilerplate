import { NextResponse } from "next/server";
import { verifiedAccount } from "@/lib/auth/account";
import { getInvoice, invoiceDocumentHtml } from "@/lib/invoice";
import { htmlToPdf } from "@/lib/invoice-pdf";
import { limited, MINUTES } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const account = await verifiedAccount();
  if (!account || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "پیدا نشد." }, { status: 404 });
  const invoice = await getInvoice(id);
  if (!invoice || invoice.user_id !== account.user.id) return NextResponse.json({ error: "پیدا نشد." }, { status: 404 });
  if (await limited(`pdf:${account.user.id}`, 12, 10 * MINUTES)) return NextResponse.json({ error: "کمی بعد دوباره تلاش کن." }, { status: 429 });
  try {
    const pdf = await htmlToPdf(invoiceDocumentHtml(invoice));
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "تولید PDF انجام نشد." }, { status: 500 });
  }
}
