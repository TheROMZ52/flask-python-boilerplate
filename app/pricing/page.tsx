import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Blocks, Check, Cpu, Gamepad2, Braces, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "تعرفه خدمات",
  description: "تعرفه خدمات توسعه، راه‌اندازی و بهینه‌سازی سرورهای ماینکرفت جاوا، بدراک و کانتر استرایک ۱.۶ در NexvorDEV.",
};

const platforms = [
  { number: "01", title: "ماینکرفت جاوا", name: "Minecraft Java", icon: Blocks },
  { number: "02", title: "ماینکرفت بدراک", name: "Minecraft Bedrock", icon: Gamepad2 },
  { number: "03", title: "کانتر استرایک ۱.۶", name: "Counter-Strike 1.6", icon: Cpu },
];

const services = [
  "ساخت پلاگین و توسعه اختصاصی",
  "نصب، راه‌اندازی و کانفیگ",
  "بهینه‌سازی و تنظیمات سرور",
];

export default function PricingPage() {
  return (
    <main>
      <div className="top-strip"><span className="online-dot" /> تعرفه خدمات NexvorDEV <Link href="/#contact">برای ثبت سفارش پیام بده <ArrowUpLeft size={13} /></Link></div>
      <header className="site-header">
        <div className="container nav-wrap">
          <Link className="brand" href="/" aria-label="NexvorDEV صفحه اصلی"><span className="brand-mark"><Braces size={21} /></span><span>NEXVOR<span className="brand-accent">DEV</span><small>GAME SERVER SOLUTIONS</small></span></Link>
          <nav className="nav-links desktop-nav" aria-label="منوی اصلی">
            <Link href="/#services">خدمات</Link><Link href="/#platforms">پلتفرم‌ها</Link><Link href="/pricing" aria-current="page">تعرفه</Link><Link href="/#process">طرز کار ما</Link><Link className="nav-cta" href="/#contact">ارتباط با ما <ArrowUpLeft size={15} /></Link>
          </nav>
          <details className="mobile-menu"><summary className="mobile-toggle">فهرست <span>☰</span></summary><nav className="nav-links" aria-label="منوی موبایل">
            <Link href="/#services">خدمات</Link><Link href="/#platforms">پلتفرم‌ها</Link><Link href="/pricing" aria-current="page">تعرفه</Link><Link href="/#process">طرز کار ما</Link><Link className="nav-cta" href="/#contact">ارتباط با ما <ArrowUpLeft size={15} /></Link>
          </nav></details>
        </div>
      </header>

      <section className="section pricing pricing-page">
        <div className="container">
          <div className="pricing-page-intro">
            <div className="eyebrow"><span /> SIMPLE & TRANSPARENT PRICING</div>
            <h1>تعرفه خدمات، <span>شفاف و مشخص.</span></h1>
            <p>برای هر سه پلتفرم، بازه قیمت یکسانه. هزینه نهایی بعد از بررسی جزئیات و محدوده سفارش اعلام می‌شه.</p>
          </div>
          <div className="pricing-grid">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <article className="price-card" key={platform.number}>
                  <div className="price-platform"><Icon size={20} /><span>{platform.title}</span></div>
                  <div className="platform-en">{platform.name}</div>
                  <div className="price-label">بازه تعرفه خدمات</div>
                  <div className="price-range"><strong>۶۵,۰۰۰</strong><span>تا</span><strong>۲,۰۰۰,۰۰۰</strong></div>
                  <div className="price-currency">تومان</div>
                  <div className="price-divider" />
                  <ul>{services.map((service) => <li key={service}><Check size={15} /> {service}</li>)}</ul>
                  <Link href="/#contact" className="price-link">استعلام و ثبت سفارش <ArrowUpLeft size={16} /></Link>
                </article>
              );
            })}
          </div>
          <p className="pricing-note"><span>*</span> قیمت نهایی پس از بررسی جزئیات سفارش، امکانات موردنیاز و زمان اجرا اعلام می‌شود.</p>
          <div className="pricing-page-cta">
            <div><h2>برای برآورد هزینه آماده‌ای؟</h2><p>جزئیات پروژه‌ات رو بفرست تا سفارش بررسی بشه.</p></div>
            <Link className="button button-primary" href="/#contact">شروع سفارش <ArrowLeft size={17} /></Link>
            <a className="pricing-telegram" href="https://t.me/TheROMZDEV" target="_blank" rel="noreferrer">تلگرام <MessageCircle size={16} /></a>
          </div>
        </div>
      </section>

      <footer className="footer"><div className="container footer-inner">
        <Link className="brand footer-brand" href="/"><span className="brand-mark"><Braces size={18} /></span><span>NEXVOR<span className="brand-accent">DEV</span><small>GAME SERVER SOLUTIONS</small></span></Link>
        <nav className="footer-links"><Link href="/#services">خدمات</Link><Link href="/pricing">تعرفه</Link><Link href="/#process">طرز کار ما</Link><Link href="/#contact">ارتباط با ما</Link></nav>
        <span className="copyright">© {new Date().getFullYear()} NEXVORDEV</span>
      </div></footer>
    </main>
  );
}
