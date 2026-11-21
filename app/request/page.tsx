import type { Metadata } from "next";
import { Check, ClipboardList } from "lucide-react";
import ServiceRequestForm from "@/components/service-request-form";
import { PageHero, PageShell } from "@/components/site-chrome";

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
    <PageShell>
      <PageHero badge={<><ClipboardList size={15} /> ثبت درخواست خدمات</>} title="درخواست خدمات" accent="تخصصی" lead="ایده‌هات رو به پروژه‌ی واقعی و حرفه‌ای تبدیل می‌کنیم؛ از راه‌اندازی سرور ماینکرفت تا برنامه‌نویسی اختصاصی، طراحی سایت و زیرساخت آنلاین." />
      <section className="hx-section hx-tight">
        <div className="hx-wrap hx-formgrid">
          <div className="hx-glass hx-form-card" data-reveal><ServiceRequestForm /></div>
          <aside className="hx-glass hx-why" data-reveal data-delay="120">
            <h2>چرا NexvorDEV؟</h2>
            <ul>{advantages.map(item => <li key={item}><Check size={15} />{item}</li>)}</ul>
            <p>ایده شما، تخصص ما، نتیجه‌ای فراتر از انتظار.</p>
            <small>با ثبت درخواست، اطلاعات برای بررسی به تیم NexvorDEV ارسال می‌شه.</small>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
