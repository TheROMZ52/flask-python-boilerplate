import { NextResponse } from "next/server";
import { invoiceDocumentHtml } from "@/lib/invoice";
import { htmlToPdf } from "@/lib/invoice-pdf";
import { sendMail, verifyEmailMessage } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!process.env.TELEGRAM_SETUP_KEY || url.searchParams.get("key") !== process.env.TELEGRAM_SETUP_KEY) return NextResponse.json({ ok: false }, { status: 404 });
  const to = "info@nexvordev.ir";
  const steps: Record<string, unknown> = {};
  try {
    const started = Date.now();
    const pdf = await htmlToPdf(invoiceDocumentHtml({ id: "t", number: "NX-TEST-000000", user_id: null, request_id: null, customer_name: "تست سیستم", customer_email: to, description: "تست تولید PDF و ارسال ایمیل", amount: 100000, currency: "IRT", payment_status: "unpaid", issued_at: new Date().toISOString(), emailed_at: null, emailed_amount: null, email_count: 0 }));
    steps.pdf = { bytes: pdf.length, ms: Date.now() - started };
    const message = verifyEmailMessage("تست سیستم", "https://nexvordev.ir/auth/verify?token=test");
    const mailStarted = Date.now();
    steps.mailId = await sendMail({ to, ...message, subject: "[تست] " + message.subject, attachments: [{ filename: "test-invoice.pdf", content: pdf, contentType: "application/pdf" }] });
    steps.mailMs = Date.now() - mailStarted;
    return NextResponse.json({ ok: true, steps });
  } catch (error) {
    return NextResponse.json({ ok: false, steps, error: error instanceof Error ? error.message.slice(0, 200) : "unknown" }, { status: 500 });
  }
}
