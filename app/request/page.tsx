import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import ServiceRequestForm from "@/components/service-request-form";

export const metadata: Metadata = {
  title: "ثبت درخواست خدمات",
  description: "ثبت درخواست خدمات توسعه، راه‌اندازی و پیکربندی سرورهای بازی در NexvorDEV.",
  alternates: { canonical: "/request" },
};

export default function ServiceRequestPage() {
  return (
    <main className="service-request-page">
      <div className="service-request-shell">
        <Link href="/" className="service-request-back"><ArrowRight size={16} /> بازگشت به صفحه اصلی</Link>
        <section className="service-request-card">
          <div className="service-request-kicker"><ClipboardList size={15} /> NEXVORDEV / SERVICE REQUEST</div>
          <h1>درخواست خدمات</h1>
          <p className="service-request-intro">جزئیات پروژه‌ات رو بنویس تا درخواستت بررسی بشه و برای هماهنگی و اعلام هزینه باهات تماس بگیریم.</p>
          <ServiceRequestForm />
        </section>
        <p className="service-request-note">با ثبت درخواست، اطلاعات برای بررسی به تیم NexvorDEV ارسال می‌شه.</p>
      </div>
    </main>
  );
}
