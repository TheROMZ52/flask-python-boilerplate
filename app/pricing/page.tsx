import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PricingInteractions from "./pricing-interactions";
import {
  ArrowLeft, ArrowUpLeft, Blocks, Check, Cpu, Gamepad2, Braces,
  MessageCircle, Puzzle, Server, SlidersHorizontal, Gauge, ClipboardCheck,
  Layers3, Clock3, Sparkles
} from "lucide-react";

export const metadata: Metadata = {
  title: "تعرفه خدمات",
  description: "تعرفه خدمات توسعه، راه‌اندازی و بهینه‌سازی سرورهای ماینکرفت جاوا، بدراک و کانتر استرایک ۱.۶ در NexvorDEV.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "تعرفه خدمات NexvorDEV", description: "بازه قیمت و جزئیات خدمات توسعه سرورهای بازی.", url: "/pricing", images: [{ url: "/nexvordev-logo.jpg", width: 180, height: 180, alt: "لوگوی NexvorDEV" }] },
};

const platforms = [
  { title: "ماینکرفت جاوا", english: "MINECRAFT JAVA", icon: Blocks, detail: "توسعه و راه‌اندازی سرورهای جاوا" },
  { title: "ماینکرفت بدراک", english: "MINECRAFT BEDROCK", icon: Gamepad2, detail: "راه‌اندازی و شخصی‌سازی تجربه بدراک" },
  { title: "کانتر استرایک ۱.۶", english: "COUNTER-STRIKE 1.6", icon: Cpu, detail: "کانفیگ و آماده‌سازی سرور کانتر" },
];

const services = [
  { icon: Puzzle, title: "توسعه اختصاصی", detail: "ساخت پلاگین و قابلیت‌های متناسب با نیاز پروژه" },
  { icon: Server, title: "راه‌اندازی سرور", detail: "نصب و آماده‌سازی ساختار اولیه سرور" },
  { icon: SlidersHorizontal, title: "نصب و کانفیگ", detail: "تنظیم سرویس‌ها و هماهنگ‌سازی اجزای موردنیاز" },
  { icon: Gauge, title: "بهینه‌سازی", detail: "بررسی تنظیمات و بهبود عملکرد سرور" },
];

const factors = [
  { number: "01", title: "جزئیات و پیچیدگی پروژه", detail: "هرچه قابلیت‌ها و منطق اجرایی اختصاصی‌تر باشند، زمان و هزینه بررسی‌شده متفاوت خواهد بود." },
  { number: "02", title: "محدوده خدمات", detail: "اینکه فقط کانفیگ نیاز داری یا توسعه و راه‌اندازی کامل هم می‌خواهی، روی برآورد اثر می‌گذارد." },
  { number: "03", title: "وضعیت فعلی سرور", detail: "سرور آماده، پروژه نیمه‌کاره یا راه‌اندازی از صفر، هرکدام بررسی متفاوتی لازم دارند." },
];

const steps = [
  { icon: MessageCircle, title: "ارسال درخواست", detail: "پلتفرم و چیزی که لازم داری رو توضیح بده." },
  { icon: ClipboardCheck, title: "بررسی و برآورد", detail: "جزئیات پروژه بررسی و هزینه اعلام می‌شه." },
  { icon: Sparkles, title: "اجرا و تحویل", detail: "پس از توافق، کار انجام و نتیجه تحویل داده می‌شه." },
];

export default function PricingPage() {
  return (
    <main className="pricing-page-shell">
      <PricingInteractions />
      <div className="top-strip"><span className="online-dot" /> تعرفه خدمات NexvorDEV <Link href="/#contact">برای ثبت سفارش پیام بده <ArrowUpLeft size={13} /></Link></div>
      <header className="site-header">
        <div className="container nav-wrap">
          <Link className="brand" href="/" aria-label="NexvorDEV صفحه اصلی"><Image className="brand-logo" src="/nexvordev-logo.jpg" alt="لوگوی NexvorDEV" width={48} height={48} priority /><span>NEXVOR<span className="brand-accent">DEV</span><small>GAME SERVER SOLUTIONS</small></span></Link>
          <nav className="nav-links desktop-nav" aria-label="منوی اصلی">
            <Link href="/#services">خدمات</Link><Link href="/#platforms">پلتفرم‌ها</Link><Link href="/pricing" aria-current="page">تعرفه</Link><Link href="/#process">طرز کار ما</Link><Link className="nav-cta" href="/#contact">ارتباط با ما <ArrowUpLeft size={15} /></Link>
          </nav>
          <details className="mobile-menu"><summary className="mobile-toggle">فهرست <span>☰</span></summary><nav className="nav-links" aria-label="منوی موبایل">
            <Link href="/#services">خدمات</Link><Link href="/#platforms">پلتفرم‌ها</Link><Link href="/pricing" aria-current="page">تعرفه</Link><Link href="/#process">طرز کار ما</Link><Link className="nav-cta" href="/#contact">ارتباط با ما <ArrowUpLeft size={15} /></Link>
          </nav></details>
        </div>
      </header>

      <section className="pricing-hero">
        <div className="container">
          <div className="pricing-hero-copy">
            <Image className="pricing-hero-logo" src="/nexvordev-logo.jpg" alt="نشان NexvorDEV" width={104} height={104} priority />
            <div className="eyebrow"><span /> PRICING & PROJECT ESTIMATE</div>
            <h1>قیمت روشن؛<br /><span>متناسب با پروژه‌ات.</span></h1>
            <p>از یک تنظیم ساده تا توسعه اختصاصی؛ اول نیاز پروژه رو بررسی می‌کنیم و بعد هزینه نهایی رو شفاف بهت می‌گیم.</p>
            <div className="pricing-hero-actions">
              <Link className="button button-primary" href="/#contact">دریافت برآورد هزینه <ArrowLeft size={17} /></Link>
              <span><Check size={15} /> بدون قیمت‌سازی و هزینه پنهان</span>
            </div>
          </div>
          <div className="pricing-range-panel">
            <div className="range-panel-top"><span>بازه تعرفه خدمات</span><span className="range-status"><i /> قابل استعلام</span></div>
            <div className="range-numbers" dir="rtl"><div><strong data-count="65000">۶۵,۰۰۰</strong><span>حداقل شروع</span></div><div className="range-dash">تا</div><div><strong data-count="2000000">۲,۰۰۰,۰۰۰</strong><span>حد بالای بازه</span></div></div>
            <div className="range-track"><span /></div>
            <div className="range-panel-bottom"><span>تومان</span><span>برای هر سه پلتفرم</span></div>
            <p>مبلغ دقیق با توجه به جزئیات، حجم کار و امکانات درخواستی مشخص می‌شه.</p>
          </div>
          <div className="pricing-hero-foot"><span>01 / تعرفه شفاف</span><span>JAVA · BEDROCK · CS 1.6</span></div>
        </div>
      </section>

      <nav className="breadcrumbs container" aria-label="مسیر صفحه"><Link href="/">صفحه اصلی</Link><span aria-hidden="true">/</span><span aria-current="page">تعرفه خدمات</span></nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "صفحه اصلی", item: "https://nexvordev-site.vercel.app/" }, { "@type": "ListItem", position: 2, name: "تعرفه خدمات", item: "https://nexvordev-site.vercel.app/pricing" }] }) }} />
      <section className="pricing-platform-section">
        <div className="container">
          <div className="pricing-section-heading"><div><div className="eyebrow"><span /> SUPPORTED PLATFORMS</div><h2>برای کدوم پلتفرم؟</h2></div><p>بازه تعرفه برای هر سه پلتفرم یکسانه؛ نوع سفارش و جزئیات اجرایی، مبلغ نهایی رو تعیین می‌کنه.</p></div>
          <div className="pricing-platform-grid">
            {platforms.map((platform, index) => {
              const Icon = platform.icon;
              return <article className="pricing-platform-card" key={platform.english}>
                <div className="pricing-platform-card-top"><span>0{index + 1}</span><Icon size={23} /></div>
                <div className="pricing-platform-english">{platform.english}</div>
                <h3>{platform.title}</h3>
                <p>{platform.detail}</p>
                <Link href="/#contact">ثبت سفارش این پلتفرم <ArrowUpLeft size={15} /></Link>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="pricing-services-section">
        <div className="container">
          <div className="pricing-section-heading"><div><div className="eyebrow"><span /> WHAT WE DO</div><h2>چه خدماتی شامل می‌شه؟</h2></div><p>می‌تونی یک خدمت مشخص سفارش بدی یا چند بخش رو در قالب یک پروژه جلو ببری.</p></div>
          <div className="pricing-service-grid">
            {services.map((service, index) => {
              const Icon = service.icon;
              return <article className="pricing-service-card" key={service.title}><span className="pricing-service-index">0{index + 1}</span><div className="pricing-service-icon"><Icon size={21} /></div><h3>{service.title}</h3><p>{service.detail}</p></article>;
            })}
          </div>
        </div>
      </section>

      <section className="pricing-factors-section">
        <div className="container pricing-factors-layout">
          <div className="pricing-factors-intro"><div className="eyebrow"><span /> HOW WE ESTIMATE</div><h2>چی قیمت نهایی رو<br /><span>مشخص می‌کنه؟</span></h2><p>چون سفارش‌ها با هم فرق دارن، قبل از اعلام مبلغ این موارد رو بررسی می‌کنیم.</p><Link href="/#contact" className="text-link">پروژه‌ات رو مطرح کن <ArrowUpLeft size={16} /></Link></div>
          <div className="pricing-factor-list">{factors.map((factor) => <article className="pricing-factor" key={factor.number}><span>{factor.number}</span><div><h3>{factor.title}</h3><p>{factor.detail}</p></div></article>)}</div>
        </div>
      </section>

      <section className="pricing-process-section">
        <div className="container">
          <div className="pricing-section-heading"><div><div className="eyebrow"><span /> SIMPLE ORDER FLOW</div><h2>از درخواست تا تحویل</h2></div><p>مسیر سفارش کوتاه و مشخصه؛ قبل از شروع، درباره محدوده کار و هزینه هماهنگ می‌کنیم.</p></div>
          <div className="pricing-steps">{steps.map((step, index) => { const Icon = step.icon; return <article className="pricing-step" key={step.title}><div className="pricing-step-icon"><Icon size={20} /></div><span>مرحله 0{index + 1}</span><h3>{step.title}</h3><p>{step.detail}</p></article>; })}</div>
        </div>
      </section>

      <section className="pricing-final-cta">
        <div className="container"><div className="pricing-final-panel"><div className="pricing-final-orb" /><div className="pricing-final-copy"><div className="eyebrow"><span /> LET'S BUILD SOMETHING</div><h2>پروژه‌ات رو شروع کنیم؟</h2><p>فقط کافیه بگی چه چیزی لازم داری؛ برای بررسی و اعلام هزینه در تلگرام پیام بده.</p></div><div className="pricing-final-actions"><a className="button button-primary" href="https://t.me/TheROMZDEV" target="_blank" rel="noreferrer">استعلام قیمت در تلگرام <ArrowUpLeft size={17} /></a><Link href="/" className="pricing-back-link">بازگشت به صفحه اصلی <ArrowLeft size={15} /></Link></div></div></div>
      </section>

      <footer className="footer"><div className="container footer-inner">
        <Link className="brand footer-brand" href="/"><Image className="brand-logo" src="/nexvordev-logo.jpg" alt="لوگوی NexvorDEV" width={40} height={40} /><span>NEXVOR<span className="brand-accent">DEV</span><small>GAME SERVER SOLUTIONS</small></span></Link>
        <nav className="footer-links"><Link href="/#services">خدمات</Link><Link href="/pricing">تعرفه</Link><Link href="/#process">طرز کار ما</Link><Link href="/#contact">ارتباط با ما</Link></nav>
        <span className="copyright">© {new Date().getFullYear()} NEXVORDEV</span>
      </div></footer>
    </main>
  );
}
