import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { PageShell } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <PageShell bare>
      <section className="hx-404">
        <div className="hx-404-code" aria-hidden="true">404</div>
        <h1>این صفحه پیدا نشد.</h1>
        <p>ممکنه آدرس اشتباه باشه یا صفحه جابه‌جا شده باشه.</p>
        <Link className="hx-cta" href="/" data-magnetic><Home size={17} /> بازگشت به صفحه اصلی <ArrowLeft size={16} /></Link>
      </section>
    </PageShell>
  );
}
