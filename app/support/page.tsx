import { LifeBuoy } from "lucide-react";
import SupportForm from "@/components/support-form";
import MySupportTickets from "@/components/my-support-tickets";
import { PageHero, PageShell } from "@/components/site-chrome";

export const metadata = { title: "پشتیبانی", description: "ثبت درخواست و گفت‌وگو با تیم پشتیبانی NexvorDEV.", alternates: { canonical: "/support" }, robots: { index: false, follow: true } };

export default function SupportPage() {
  return (
    <PageShell active="/support">
      <PageHero badge={<><LifeBuoy size={15} /> مرکز پشتیبانی</>} title="پشتیبانی" accent="در کنارته." lead="مشخصاتت رو وارد کن و درخواستت رو توضیح بده. بعد از ثبت، یک گفت‌وگوی اختصاصی برای پیگیری همین درخواست باز می‌شه." />
      <section className="hx-section hx-tight">
        <div className="hx-wrap hx-narrow">
          <div className="hx-glass hx-form-card" data-reveal><SupportForm /></div>
          <div className="hx-glass hx-form-card" data-reveal data-delay="100"><MySupportTickets /></div>
        </div>
      </section>
    </PageShell>
  );
}
