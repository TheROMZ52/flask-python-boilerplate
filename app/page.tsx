import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Blocks, Check, Code2, Globe, LifeBuoy, Server } from "lucide-react";
import HomeFx from "@/components/home-fx";
import ScratchReveal from "@/components/scratch-reveal";
import HelpedBar from "@/components/helped-bar";
import { SiteFooter, SiteHeader, Words } from "@/components/site-chrome";
import { serviceGroups } from "@/lib/services";

export const metadata: Metadata = {
  title: "توسعه، وب و زیرساخت سرورهای بازی",
  description: "NexvorDEV؛ راه‌اندازی و کانفیگ سرور ماینکرفت، پلاگین و بات اختصاصی، طراحی وب‌سایت و زیرساخت سرور؛ با هزینه‌ی روشن قبل از شروع و پیگیری کامل سفارش.",
  alternates: { canonical: "/" },
};

const total = serviceGroups.filter(group => group.label !== "سایر").reduce((sum, group) => sum + group.options.length, 0);
const groupMeta = [
  { icon: Blocks, text: "نصب، کانفیگ و راه‌اندازی کامل سرور و گیم‌مودها." },
  { icon: Code2, text: "پلاگین، ربات و ابزارهای اختصاصی متناسب با نیاز پروژه." },
  { icon: Globe, text: "سایت، فروشگاه و پنل مدیریت؛ از طراحی تا انتشار." },
  { icon: Server, text: "راه‌اندازی VPS، پروکسی، شبکه‌ی سرورها و تنظیمات امنیتی." },
  { icon: LifeBuoy, text: "عیب‌یابی، نگهداری و مشاوره‌ی فنی برای پروژه‌های فعال." },
];
const steps = [
  ["ثبت درخواست", "پلتفرم و نیازت رو از سایت یا بات تلگرام ثبت می‌کنی."],
  ["بررسی و برآورد", "جزئیات بررسی می‌شود و هزینه و محدوده‌ی کار اعلام می‌شود."],
  ["اجرا و بررسی", "کار انجام می‌شود و موارد توافق‌شده تست می‌شوند."],
  ["تحویل", "خروجی نهایی طبق توافق تحویل داده می‌شود."],
];

export default function Home() {
  return (
    <main className="hx">
      <HomeFx />
      <div className="hx-progress" aria-hidden="true" />
      <SiteHeader />

      <section className="hx-hero" id="top">
        <ScratchReveal />
        <div className="hx-veil" aria-hidden="true" />
        <div className="hx-wrap hx-hero-in">
          <div className="hx-hero-copy">
            <div className="hx-badge">توسعه، وب و زیرساخت سرورهای بازی</div>
            <h1>
              <span className="hx-line"><Words text="سرور و نرم‌افزاری که" /></span>
              <span className="hx-line hx-grad">می‌شه بهش تکیه کرد.</span>
            </h1>
            <p className="hx-lead">راه‌اندازی و کانفیگ سرور ماینکرفت، پلاگین و بات اختصاصی، طراحی وب‌سایت و زیرساخت. قبل از شروع، محدوده‌ی کار و هزینه رو روشن می‌کنیم و تا تحویل، مسیر سفارش قابل پیگیریه.</p>
            <div className="hx-actions">
              <Link className="hx-cta" href="/request">ثبت سفارش <ArrowLeft size={18} /></Link>
              <Link className="hx-ghost" href="/pricing">دیدن تعرفه</Link>
            </div>
            <dl className="hx-facts">
              <div><dt>دسته‌ی خدمت</dt><dd>{(groupMeta.length).toLocaleString("fa-IR")}</dd></div>
              <div><dt>خدمت مشخص</dt><dd>{total.toLocaleString("fa-IR")}</dd></div>
              <div><dt>شروع تعرفه</dt><dd>{(65000).toLocaleString("fa-IR")}<small>تومان</small></dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="hx-section" id="services">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2><Words text="خدماتی که ارائه می‌دیم" /></h2>
            <p>پنج دسته‌ی خدمت با {total.toLocaleString("fa-IR")} خدمت مشخص. اگه چیزی دقیقاً در فهرست نبود، توی فرم سفارش می‌تونی توضیح بدی.</p>
          </div>
          <div className="hx-svc-grid">
            {serviceGroups.filter(group => group.label !== "سایر").map((group, index) => { const meta = groupMeta[index]; const Icon = meta.icon; return (
              <article className="hx-svc" key={group.label} data-reveal data-delay={index * 70}>
                <div className="hx-svc-top"><span className="hx-icon"><Icon size={22} /></span><span className="hx-svc-count">{group.options.length.toLocaleString("fa-IR")} خدمت</span></div>
                <h3>{group.label}</h3>
                <p>{meta.text}</p>
                <ul>{group.options.slice(0, 4).map(option => <li key={option}><Check size={14} />{option}</li>)}</ul>
                <Link className="hx-textlink" href="/request">ثبت سفارش <ArrowUpLeft size={15} /></Link>
              </article>
            ); })}
            <article className="hx-svc hx-svc-other" data-reveal data-delay="350">
              <h3>چیزی که دنبالشی توی فهرست نبود؟</h3>
              <p>پروژه‌ات رو توضیح بده؛ اگه توی حوزه‌ی کار ما باشه، برآورد و مسیر اجرا رو بررسی می‌کنیم.</p>
              <Link className="hx-cta hx-cta-sm" href="/request">ثبت درخواست <ArrowUpLeft size={15} /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="hx-section" id="process">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2><Words text="مسیر یک سفارش" /></h2>
            <p>چهار مرحله‌ی مشخص، از اولین پیام تا تحویل نهایی.</p>
          </div>
          <ol className="hx-steps">
            {steps.map(([title, text], index) => (
              <li key={title} data-reveal data-delay={index * 80}><span>{(index + 1).toLocaleString("fa-IR")}</span><h3>{title}</h3><p>{text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <HelpedBar />

      <section className="hx-section hx-contact" id="contact">
        <div className="hx-wrap">
          <div className="hx-cta-band" data-reveal>
            <div><h2>پروژه‌ات رو توضیح بده.</h2><p>هزینه و محدوده‌ی کار رو قبل از شروع، شفاف اعلام می‌کنیم.</p></div>
            <div className="hx-actions"><Link className="hx-cta hx-cta-lg" href="/request">ثبت سفارش <ArrowLeft size={19} /></Link><Link className="hx-ghost" href="/support">پشتیبانی</Link></div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
