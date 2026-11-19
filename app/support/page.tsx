import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import SupportForm from "@/components/support-form";

export const metadata = { title: "پشتیبانی | NexvorDEV", description: "ثبت درخواست و گفت‌وگو با تیم پشتیبانی NexvorDEV." };

export default function SupportPage() {
  return <main className="support-page"><div className="support-shell">
    <Link href="/" className="support-back"><ArrowRight size={16} /> بازگشت به سایت</Link>
    <section className="support-card">
      <span className="support-kicker">NEXVORDEV / SUPPORT CENTER</span>
      <h1><LifeBuoy size={25} style={{ display: "inline", verticalAlign: "middle", color: "var(--accent)" }} /> پشتیبانی در کنارته.</h1>
      <p className="support-intro">مشخصاتت رو وارد کن و درخواستت رو توضیح بده. بعد از ثبت، یک گفت‌وگوی اختصاصی برای پیگیری همین درخواست باز می‌شه.</p>
      <SupportForm />
    </section>
  </div></main>;
}
