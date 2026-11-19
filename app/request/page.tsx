import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import ServiceRequestForm from "@/components/service-request-form";

export const metadata: Metadata = {
  title: "ثبت درخواست خدمات",
  description: "ثبت درخواست خدمات تخصصی ماینکرفت، برنامه‌نویسی، طراحی وب و زیرساخت در NexvorDEV.",
  alternates: { canonical: "/request" },
};

const advantages = [
  "اجرای پروژه متناسب با نیاز مشتری",
  "توجه به کیفیت و جزئیات فنی",
  "طراحی اختصاصی به‌جای راهکارهای تکراری",
  "بررسی و تست پیش از تحویل",
  "امکان توسعه و ارتقای پروژه در آینده",
  "ارتباط مستقیم برای پیگیری سفارش",
];

export default function ServiceRequestPage() {
  return (
    <main className="service-request-page">
      <div className="service-request-shell">
        <Link href="/" className="service-request-back"><ArrowRight size={16} /> بازگشت به صفحه اصلی</Link>
        <section className="service-request-card">
          <div className="service-request-kicker"><ClipboardList size={15} /> NEXVORDEV / SERVICE REQUEST</div>
          <h1>درخواست خدمات تخصصی</h1>
          <p className="service-request-intro">Development • Minecraft • Web Solutions</p>
          <p className="service-request-intro">در NexvorDEV تلاش می‌کنیم ایده‌های شما رو به پروژه‌های واقعی و حرفه‌ای تبدیل کنیم؛ از راه‌اندازی و مدیریت سرورهای ماینکرفت تا برنامه‌نویسی اختصاصی، طراحی سایت و توسعه زیرساخت‌های آنلاین.</p>
          <ServiceRequestForm />
        </section>

        <section className="service-request-card service-request-why">
          <div className="service-request-kicker">WHY NEXVORDEV</div>
          <h2>چرا NexvorDEV؟</h2>
          <ul>
            {advantages.map(item => <li key={item}>{item}</li>)}
          </ul>
          <p className="service-request-intro">ایده شما، تخصص ما، نتیجه‌ای فراتر از انتظار.</p>
          <p className="service-request-intro">برای ثبت سفارش و دریافت مشاوره، درخواستت رو از طریق فرم بالا ارسال کن.</p>
        </section>

        <p className="service-request-note">با ثبت درخواست، اطلاعات برای بررسی به تیم NexvorDEV ارسال می‌شه.</p>
      </div>
    </main>
  );
}
