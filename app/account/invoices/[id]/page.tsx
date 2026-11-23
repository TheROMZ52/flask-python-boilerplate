import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import InvoiceActions from "@/components/invoice-actions";
import { PageShell } from "@/components/site-chrome";
import { verifiedAccount } from "@/lib/auth/account";
import { getInvoice, paymentLabels } from "@/lib/invoice";

export const metadata: Metadata = { title: "فاکتور", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const account = await verifiedAccount();
  if (!account) redirect(`/account?next=/account/invoices/${id}`);
  const invoice = await getInvoice(id);
  if (!invoice || invoice.user_id !== account.user.id) notFound();
  const date = new Date(invoice.issued_at).toLocaleDateString("fa-IR-u-ca-persian", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tehran" });
  return (
    <PageShell bare>
      <section className="hx-account inv-wrap">
        <article className="inv hx-glass">
          <header><div><h1>فاکتور</h1><span dir="ltr">{invoice.number}</span></div><span className={`dash-chip pay-${invoice.payment_status}`}>{paymentLabels[invoice.payment_status]}</span></header>
          <dl>
            <div><dt>تاریخ صدور</dt><dd>{date}</dd></div>
            <div><dt>مشتری</dt><dd>{invoice.customer_name}</dd></div>
            <div><dt>ایمیل</dt><dd dir="ltr">{invoice.customer_email}</dd></div>
          </dl>
          <div className="inv-line"><span>{invoice.description}</span><strong>{invoice.amount === null ? "پس از بررسی اعلام می‌شود" : `${invoice.amount.toLocaleString("fa-IR")} تومان`}</strong></div>
          <InvoiceActions id={invoice.id} />
        </article>
      </section>
    </PageShell>
  );
}
