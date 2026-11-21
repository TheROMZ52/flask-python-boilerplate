import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Blocks, Check, ClipboardCheck, Cpu, Gamepad2, Gauge, MessageCircle, Puzzle, Server, SlidersHorizontal, Sparkles } from "lucide-react";
import { PageHero, PageShell, Words } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "تعرفه خدمات",
  description: "تعرفه خدمات توسعه، راه‌اندازی و بهینه‌سازی سرورهای ماینکرفت جاوا، بدراک و کانتر استرایک ۱.۶ در NexvorDEV.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "تعرفه خدمات NexvorDEV", description: "بازه قیمت و جزئیات خدمات توسعه سرورهای بازی.", url: "/pricing", images: [{ url: "/nexvordev-logo.jpg", width: 180, height: 180, alt: "لوگوی NexvorDEV" }] },
};

const platforms = [
  { title: "ماینکرفت جاوا", english: "Minecraft Java", mark: "JAVA", icon: Blocks, detail: "توسعه و راه‌اندازی سرورهای جاوا" },
  { title: "ماینکرفت بدراک", english: "Minecraft Bedrock", mark: "BEDROCK", icon: Gamepad2, detail: "راه‌اندازی و شخصی‌سازی تجربه بدراک" },
  { title: "کانتر استرایک ۱.۶", english: "Counter-Strike 1.6", mark: "CS 1.6", icon: Cpu, detail: "کانفیگ و آماده‌سازی سرور کانتر" },
];
const services = [
  { icon: Puzzle, title: "توسعه اختصاصی", detail: "ساخت پلاگین و قابلیت‌های متناسب با نیاز پروژه" },
  { icon: Server, title: "راه‌اندازی سرور", detail: "نصب و آماده‌سازی ساختار اولیه سرور" },
  { icon: SlidersHorizontal, title: "نصب و کانفیگ", detail: "تنظیم سرویس‌ها و هماهنگ‌سازی اجزای موردنیاز" },
  { icon: Gauge, title: "بهینه‌سازی", detail: "بررسی تنظیمات و بهبود عملکرد سرور" },
];
const factors = [
  { title: "جزئیات و پیچیدگی پروژه", detail: "هرچه قابلیت‌ها و منطق اجرایی اختصاصی‌تر باشند، زمان و هزینه بررسی‌شده متفاوت خواهد بود." },
  { title: "محدوده خدمات", detail: "اینکه فقط کانفیگ نیاز داری یا توسعه و راه‌اندازی کامل هم می‌خواهی، روی برآورد اثر می‌گذارد." },
  { title: "وضعیت فعلی سرور", detail: "سرور آماده، پروژه نیمه‌کاره یا راه‌اندازی از صفر، هرکدام بررسی متفاوتی لازم دارند." },
];
const steps = [
  { icon: MessageCircle, title: "ارسال درخواست", detail: "پلتفرم و چیزی که لازم داری رو توضیح بده." },
  { icon: ClipboardCheck, title: "بررسی و برآورد", detail: "جزئیات پروژه بررسی و هزینه اعلام می‌شه." },
  { icon: Sparkles, title: "اجرا و تحویل", detail: "پس از توافق، کار انجام و نتیجه تحویل داده می‌شه." },
];

export default function PricingPage() {
  return (
    <PageShell active="/pricing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "صفحه اصلی", item: "https://nexvordev-site.vercel.app/" }, { "@type": "ListItem", position: 2, name: "تعرفه خدمات", item: "https://nexvordev-site.vercel.app/pricing" }] }) }} />
      <PageHero badge={<><span className="hx-live" /> تعرفه خدمات NexvorDEV</>} title="قیمت روشن؛" accent="متناسب با پروژه‌ات." lead="از یک تنظیم ساده تا توسعه اختصاصی؛ اول نیاز پروژه رو بررسی می‌کنیم و بعد هزینه نهایی رو شفاف بهت می‌گیم.">
        <div className="hx-actions">
          <Link className="hx-cta" href="/request" data-magnetic>دریافت برآورد هزینه <ArrowLeft size={18} /></Link>
          <span className="hx-note"><Check size={15} /> بدون قیمت‌سازی و هزینه پنهان</span>
        </div>
        <div className="hx-range" data-reveal>
          <div className="hx-range-top"><span>بازه تعرفه خدمات</span><span className="hx-chip"><i /> قابل استعلام</span></div>
          <div className="hx-range-nums">
            <div><strong data-count="65000">۶۵٬۰۰۰</strong><span>حداقل شروع</span></div>
            <span className="hx-range-to">تا</span>
            <div><strong data-count="2000000">۲٬۰۰۰٬۰۰۰</strong><span>حد بالای بازه</span></div>
          </div>
          <div className="hx-range-track"><span /></div>
          <div className="hx-range-foot"><span>تومان</span><span>برای هر سه پلتفرم</span></div>
          <p>مبلغ دقیق با توجه به جزئیات، حجم کار و امکانات درخواستی مشخص می‌شه.</p>
        </div>
      </PageHero>

      <section className="hx-section">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal><h2><Words text="برای کدوم پلتفرم؟" /></h2><p>بازه تعرفه برای هر سه پلتفرم یکسانه؛ نوع سفارش و جزئیات اجرایی، مبلغ نهایی رو تعیین می‌کنه.</p></div>
          <div className="hx-trio">
            {platforms.map((platform, index) => { const Icon = platform.icon; return (
              <article className="hx-card" key={platform.mark} data-tilt data-reveal data-delay={index * 100}>
                <span className="hx-mark" aria-hidden="true">{platform.mark}</span>
                <div className="hx-icon"><Icon size={24} /></div>
                <h3>{platform.title}</h3><div className="hx-latin">{platform.english}</div>
                <p>{platform.detail}</p>
                <Link className="hx-textlink" href="/request">ثبت سفارش این پلتفرم <ArrowUpLeft size={15} /></Link>
              </article>
            ); })}
          </div>
        </div>
      </section>

      <section className="hx-section hx-alt">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal><h2><Words text="چه خدماتی شامل می‌شه؟" /></h2><p>می‌تونی یک خدمت مشخص سفارش بدی یا چند بخش رو در قالب یک پروژه جلو ببری.</p></div>
          <div className="hx-quad">
            {services.map((service, index) => { const Icon = service.icon; return (
              <article className="hx-mini" key={service.title} data-tilt data-reveal data-delay={index * 80}>
                <div className="hx-icon"><Icon size={22} /></div><h3>{service.title}</h3><p>{service.detail}</p>
              </article>
            ); })}
          </div>
        </div>
      </section>

      <section className="hx-section">
        <div className="hx-wrap hx-split">
          <div className="hx-split-intro" data-reveal>
            <h2>چی قیمت نهایی رو<br /><span className="hx-grad">مشخص می‌کنه؟</span></h2>
            <p>چون سفارش‌ها با هم فرق دارن، قبل از اعلام مبلغ این موارد رو بررسی می‌کنیم.</p>
            <Link className="hx-textlink" href="/request">پروژه‌ات رو مطرح کن <ArrowUpLeft size={16} /></Link>
          </div>
          <div className="hx-factors">
            {factors.map((factor, index) => (
              <article className="hx-factor" key={factor.title} data-reveal data-delay={index * 100}><span>{(index + 1).toLocaleString("fa-IR")}</span><div><h3>{factor.title}</h3><p>{factor.detail}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section className="hx-section hx-alt">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal><h2><Words text="از درخواست تا تحویل" /></h2><p>مسیر سفارش کوتاه و مشخصه؛ قبل از شروع، درباره محدوده کار و هزینه هماهنگ می‌کنیم.</p></div>
          <div className="hx-trio">
            {steps.map((step, index) => { const Icon = step.icon; return (
              <article className="hx-mini" key={step.title} data-tilt data-reveal data-delay={index * 100}>
                <div className="hx-icon"><Icon size={22} /></div><span className="hx-mini-no">مرحله {(index + 1).toLocaleString("fa-IR")}</span><h3>{step.title}</h3><p>{step.detail}</p>
              </article>
            ); })}
          </div>
        </div>
      </section>

      <section className="hx-section hx-contact">
        <div className="hx-wrap">
          <div className="hx-panel" data-reveal>
            <span className="hx-watermark" aria-hidden="true" data-depth="0.08">NX</span>
            <h2>پروژه‌ات رو <span className="hx-grad">شروع کنیم؟</span></h2>
            <p>فقط کافیه بگی چه چیزی لازم داری؛ برای بررسی و اعلام هزینه در تلگرام پیام بده.</p>
            <div className="hx-actions hx-center">
              <a className="hx-cta hx-cta-lg" href="https://t.me/TheROMZDEV" target="_blank" rel="noreferrer" data-magnetic>استعلام قیمت در تلگرام <ArrowUpLeft size={19} /></a>
              <Link className="hx-ghost" href="/request">ثبت سفارش در سایت</Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
