import "server-only";
import { supportDb } from "@/lib/support/server";
import { createNotification } from "@/lib/auth/account";
import { esc, layout, sendMail } from "@/lib/mail";
import { invoiceFonts } from "@/lib/invoice-fonts";
import { invoiceLogo } from "@/lib/invoice-logo";
import { htmlToPdf } from "@/lib/invoice-pdf";
import { siteUrl } from "@/lib/site";

export type Invoice = {
  id: string; number: string; user_id: string | null; request_id: string | null; customer_name: string; customer_email: string; description: string;
  amount: number | null; currency: string; payment_status: "unpaid" | "paid" | "cancelled"; issued_at: string; emailed_at: string | null; emailed_amount: number | null; email_count: number;
};

export const paymentLabels: Record<string, string> = { unpaid: "در انتظار پرداخت", paid: "پرداخت‌شده", cancelled: "لغوشده" };

export function parseAmount(text?: string | null) {
  if (!text) return null;
  const ascii = text.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[,٬،\s]/g, "");
  const match = ascii.match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

const money = (amount: number | null) => (amount === null ? "پس از بررسی اعلام می‌شود" : `${amount.toLocaleString("fa-IR")} تومان`);
const jalali = (value: string) => new Date(value).toLocaleDateString("fa-IR-u-ca-persian", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tehran" });

export async function getInvoice(id: string) {
  const rows = (await supportDb(`nexvor_invoices?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)) as Invoice[];
  return rows?.[0] ?? null;
}

export async function createInvoiceForRequest(input: { requestId: string; userId: string; name: string; email: string; description: string; quotedPrice?: string | null }) {
  const rows = (await supportDb("nexvor_invoices?on_conflict=request_id", {
    method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ request_id: input.requestId, user_id: input.userId, customer_name: input.name, customer_email: input.email, description: input.description, amount: parseAmount(input.quotedPrice) }),
  })) as Invoice[];
  return rows?.[0] ?? null;
}

export function invoiceDocumentHtml(invoice: Invoice) {
  const fonts = (Object.entries(invoiceFonts) as Array<[string, string]>).map(([weight, data]) => `@font-face{font-family:NXV;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`).join("");
  const paid = invoice.payment_status;
  const badge = paid === "paid" ? "#0f9d6a" : paid === "cancelled" ? "#8a94a6" : "#d97706";
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>فاکتور ${esc(invoice.number)}</title><style>${fonts}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:NXV,Tahoma,sans-serif;color:#13233a;background:#fff;font-size:14px;line-height:1.9}
.page{width:210mm;min-height:297mm;padding:0 0 18mm;position:relative}
.top{background:#061631;color:#fff;padding:14mm 16mm;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:12px;direction:ltr}.brand img{width:46px;height:46px;border-radius:50%}.brand b{font:900 22px Arial,sans-serif;letter-spacing:.3px}
.top h1{margin:0;font-size:26px;font-weight:900;color:#5cd6ff}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:10mm;padding:12mm 16mm 4mm}
.box{border:1px solid #dbe5f0;border-radius:10px;padding:12px 16px;background:#f7fafd}.box h3{margin:0 0 6px;font-size:12px;color:#6b7c93;font-weight:700}.box p{margin:0;font-weight:700;font-size:14px}.box small{display:block;color:#6b7c93;font-weight:400}
table{width:calc(100% - 32mm);margin:8mm 16mm 0;border-collapse:collapse}th{background:#eaf3fb;color:#27415f;font-size:12px;text-align:right;padding:10px 14px;border-bottom:2px solid #c9dcee}td{padding:14px;border-bottom:1px solid #e3ebf4;vertical-align:top}
.total{margin:8mm 16mm 0;display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-radius:12px;background:#061631;color:#fff}.total span{font-size:13px;color:#b9c9de}.total strong{font-size:20px;font-weight:900;color:#5cd6ff}
.pay{display:inline-block;margin:6mm 16mm 0;padding:6px 18px;border-radius:99px;color:#fff;font-weight:700;font-size:13px;background:${badge}}
.note{margin:8mm 16mm 0;color:#5a6b82;font-size:12px;line-height:2.1}
.foot{position:absolute;bottom:0;left:0;right:0;padding:6mm 16mm;border-top:1px solid #e3ebf4;display:flex;justify-content:space-between;color:#6b7c93;font-size:11px;direction:rtl}
</style></head><body><div class="page">
<div class="top"><h1>فاکتور</h1><div class="brand"><img src="${invoiceLogo}" alt=""><b>NexvorDEV</b></div></div>
<div class="meta">
<div class="box"><h3>مشخصات فاکتور</h3><p>شماره: <span dir="ltr">${esc(invoice.number)}</span></p><small>تاریخ صدور: ${esc(jalali(invoice.issued_at))}</small></div>
<div class="box"><h3>مشتری</h3><p>${esc(invoice.customer_name)}</p><small dir="ltr" style="text-align:right">${esc(invoice.customer_email)}</small></div>
</div>
<table><thead><tr><th>شرح خدمات</th><th style="width:34%">مبلغ</th></tr></thead><tbody><tr><td>${esc(invoice.description)}</td><td>${esc(money(invoice.amount))}</td></tr></tbody></table>
<div class="total"><span>مبلغ قابل پرداخت</span><strong>${esc(money(invoice.amount))}</strong></div>
<div class="pay">وضعیت پرداخت: ${esc(paymentLabels[paid])}</div>
<p class="note">${invoice.amount === null ? "مبلغ نهایی پس از بررسی جزئیات سفارش اعلام و فاکتور به‌روزرسانی می‌شود. " : ""}برای پیگیری سفارش و دریافت نسخه‌ی فاکتور، وارد حساب کاربری خود در ${esc("nexvordev.ir")} شوید.</p>
<div class="foot"><span>NexvorDEV</span><span dir="ltr">info@nexvordev.ir · nexvordev.ir</span></div>
</div></body></html>`;
}

async function emailInvoice(invoice: Invoice, kind: "issued" | "updated" | "resend") {
  const title = kind === "updated" ? "فاکتور شما به‌روزرسانی شد" : "فاکتور سفارش شما";
  const lead = kind === "updated" ? "مبلغ سفارش شما اعلام شد و فاکتور به‌روزرسانی شد." : "سفارش شما ثبت شد و فاکتور آن در ادامه آمده است.";
  const rows = [["شماره فاکتور", `<span dir="ltr">${esc(invoice.number)}</span>`], ["تاریخ", esc(jalali(invoice.issued_at))], ["شرح خدمات", esc(invoice.description)], ["مبلغ", esc(money(invoice.amount))], ["وضعیت پرداخت", esc(paymentLabels[invoice.payment_status])]]
    .map(([k, v]) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #e3ebf4;color:#6b7c93;width:34%">${k}</td><td style="padding:10px 14px;border-bottom:1px solid #e3ebf4;font-weight:bold;color:#13233a">${v}</td></tr>`).join("");
  const html = layout({ preheader: `فاکتور ${invoice.number}`, title, body: `<p style="margin:0">سلام ${esc(invoice.customer_name)}،</p><p style="margin:10px 0 16px">${lead} نسخه‌ی PDF فاکتور پیوست شده است.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3ebf4;border-radius:10px;border-collapse:separate;background:#f9fbfe">${rows}</table>`, button: { label: "مشاهده فاکتور در حساب کاربری", href: `${siteUrl}/account/invoices/${invoice.id}` } });
  const text = `سلام ${invoice.customer_name}،\n${lead}\n\nشماره فاکتور: ${invoice.number}\nتاریخ: ${jalali(invoice.issued_at)}\nشرح: ${invoice.description}\nمبلغ: ${money(invoice.amount)}\nوضعیت پرداخت: ${paymentLabels[invoice.payment_status]}\n\nمشاهده: ${siteUrl}/account/invoices/${invoice.id}`;
  let attachments;
  try { attachments = [{ filename: `${invoice.number}.pdf`, content: await htmlToPdf(invoiceDocumentHtml(invoice)), contentType: "application/pdf" }]; } catch { attachments = undefined; }
  await sendMail({ to: invoice.customer_email, subject: `${title} ${invoice.number}`, html, text, attachments });
}

async function claim(invoice: Invoice, kind: "issued" | "updated") {
  const filter = kind === "issued" ? "emailed_at=is.null" : `or=(emailed_amount.is.null,emailed_amount.neq.${invoice.amount})`;
  const rows = (await supportDb(`nexvor_invoices?id=eq.${invoice.id}&${filter}`, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ emailed_at: new Date().toISOString(), emailed_amount: invoice.amount, email_count: invoice.email_count + 1 }),
  })) as Invoice[];
  return rows?.[0] ?? null;
}

async function release(invoice: Invoice) {
  await supportDb(`nexvor_invoices?id=eq.${invoice.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ emailed_at: invoice.emailed_at, emailed_amount: invoice.emailed_amount, email_count: invoice.email_count }) }).catch(() => null);
}

export async function sendInvoiceOnce(invoice: Invoice, kind: "issued" | "updated") {
  const claimed = await claim(invoice, kind);
  if (!claimed) return false;
  try { await emailInvoice(claimed, kind); } catch (error) { await release(invoice); throw error; }
  if (invoice.user_id) await createNotification(invoice.user_id, "invoice", kind === "updated" ? "فاکتور به‌روزرسانی شد" : "فاکتور سفارش شما صادر شد", `${invoice.number} — ${money(invoice.amount)}`, `/account/invoices/${invoice.id}`);
  return true;
}

export async function resendInvoice(invoice: Invoice) {
  await emailInvoice(invoice, "resend");
  await supportDb(`nexvor_invoices?id=eq.${invoice.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ emailed_at: new Date().toISOString(), email_count: invoice.email_count + 1 }) });
}

export async function syncInvoiceAmount(requestId: string, quotedPrice: string) {
  const amount = parseAmount(quotedPrice);
  if (amount === null) return;
  const rows = (await supportDb(`nexvor_invoices?request_id=eq.${encodeURIComponent(requestId)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ amount, updated_at: new Date().toISOString() }) })) as Invoice[];
  const invoice = rows?.[0];
  if (invoice) await sendInvoiceOnce(invoice, "updated");
}

export async function setInvoicePayment(number: string, status: "paid" | "unpaid" | "cancelled") {
  const rows = (await supportDb(`nexvor_invoices?number=eq.${encodeURIComponent(number)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ payment_status: status, updated_at: new Date().toISOString() }) })) as Invoice[];
  const invoice = rows?.[0];
  if (invoice?.user_id) await createNotification(invoice.user_id, "invoice", `وضعیت پرداخت: ${paymentLabels[status]}`, `${invoice.number}`, `/account/invoices/${invoice.id}`);
  return invoice ?? null;
}
