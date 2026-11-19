import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found-page" dir="rtl">
      <div className="not-found-code">404</div>
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>این صفحه پیدا نشد.</h1>
      <p className="not-found-description">ممکنه آدرس اشتباه باشه یا صفحه جابه‌جا شده باشه.</p>
      <Link className="button button-primary" href="/"><Home size={17} /> بازگشت به صفحه اصلی <ArrowLeft size={16} /></Link>
    </main>
  );
}
