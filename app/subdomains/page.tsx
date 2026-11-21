import type { Metadata } from "next";
import { Globe2, ShieldCheck, Zap } from "lucide-react";
import SubdomainOrderForm from "@/components/subdomain-order-form";
import { PageHero, PageShell } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "خرید ساب‌دامنه",
  description: "درخواست ساب‌دامنه اختصاصی روی nexvordev.ir با دوره‌های اشتراک متنوع.",
  alternates: { canonical: "/subdomains" },
};

export default function SubdomainsPage() {
  return (
    <PageShell active="/subdomains">
      <PageHero badge={<><Globe2 size={15} /> ساب‌دامنه اختصاصی</>} title="آدرس اختصاصی" accent="خودت رو داشته باش." lead="برای سایت، فروشگاه، سرور بازی یا پروژه‌ات یک نام دلخواه روی دامنه NexvorDEV درخواست کن.">
        <div className="hx-url" dir="ltr" data-reveal><span>yourname</span>.nexvordev.ir</div>
        <div className="hx-feats" data-reveal data-delay="100">
          <span><Zap size={16} /> ثبت درخواست ساده</span><span><ShieldCheck size={16} /> بررسی نام پیش از فعال‌سازی</span><span><Globe2 size={16} /> مناسب سایت و سرور</span>
        </div>
      </PageHero>
      <section className="hx-section hx-tight">
        <div className="hx-wrap hx-narrow">
          <div className="hx-glass hx-form-card" data-reveal>
            <div className="hx-form-head"><h2>درخواست خرید ساب‌دامنه</h2><p>مدت اشتراک و نام موردنظرت رو انتخاب کن.</p></div>
            <SubdomainOrderForm />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
