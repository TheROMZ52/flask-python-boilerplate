"use client";

import {
  ArrowLeft,
  ArrowUpLeft,
  Blocks,
  Check,
  Code2,
  Cpu,
  Gamepad2,
  Gauge,
  Menu,
  MessageCircle,
  MoveUpLeft,
  Network,
  Puzzle,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import { useState } from "react";

const services = [
  {
    number: "01",
    icon: Puzzle,
    title: "توسعه پلاگین اختصاصی",
    description: "ایده‌ات رو به قابلیتی واقعی تبدیل می‌کنیم؛ دقیقاً مطابق نیاز و ساختار سرورت.",
    tags: ["Paper / Spigot", "Velocity", "Java"],
  },
  {
    number: "02",
    icon: Server,
    title: "راه‌اندازی سرور بازی",
    description: "از نصب اولیه تا تحویل یک سرور آماده، پایدار و قابل مدیریت همراهت هستیم.",
    tags: ["Minecraft", "Counter-Strike", "VPS"],
  },
  {
    number: "03",
    icon: Gauge,
    title: "کانفیگ و بهینه‌سازی",
    description: "بررسی گلوگاه‌ها، کاهش لگ و تنظیم منابع برای تجربه‌ای روان‌تر.",
    tags: ["Performance", "Optimization", "Linux"],
  },
  {
    number: "04",
    icon: Code2,
    title: "ابزار و برنامه‌نویسی",
    description: "ربات، ابزار مدیریتی و اتوماسیون‌هایی که کارهای تکراری را ساده می‌کنند.",
    tags: ["Python", "Node.js", "Automation"],
  },
];

const steps = [
  ["01", "نیازسنجی", "اول دقیق می‌فهمیم چه چیزی می‌خواهی و محدودیت‌های پروژه چیست."],
  ["02", "طراحی راهکار", "راه‌حل فنی و محدوده کار را شفاف می‌کنیم؛ بدون قابلیت‌های اضافه."],
  ["03", "توسعه و تست", "پیاده‌سازی، تست و رفع ایراد پیش از تحویل."],
  ["04", "تحویل و پشتیبانی", "پروژه را تحویل می‌گیری و برای ادامه مسیر تنها نمی‌مانی."],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main>
      <div className="announcement">
        <span className="announcement-dot" />
        برای شروع پروژه جدید آماده‌ایم
        <a href="#contact">گفت‌وگو درباره پروژه <ArrowLeft size={13} /></a>
      </div>

      <header className="site-header">
        <div className="container nav-wrap">
          <a className="brand" href="#" aria-label="NexvorDEV صفحه اصلی">
            <span className="brand-mark"><Terminal size={20} strokeWidth={2.3} /></span>
            <span>NEXVOR<span className="brand-accent">DEV</span><small>GAME SERVER ENGINEERING</small></span>
          </a>
          <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="نمایش منو">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <nav className={menuOpen ? "nav-links open" : "nav-links"}>
            <a href="#services" onClick={() => setMenuOpen(false)}>خدمات</a>
            <a href="#process" onClick={() => setMenuOpen(false)}>روند همکاری</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>درباره ما</a>
            <a className="nav-cta" href="#contact" onClick={() => setMenuOpen(false)}>شروع یک پروژه <ArrowUpLeft size={15} /></a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span /> GAME SERVER DEVELOPMENT STUDIO</div>
            <h1>سرور بازی‌ات را<br /><span>متفاوت</span> بساز.</h1>
            <p className="hero-description">
              از توسعه پلاگین اختصاصی تا راه‌اندازی و بهینه‌سازی سرور؛
              زیرساخت فنی پروژه‌ات را با دقت مهندسی می‌کنیم.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#contact">پروژه‌ات رو شروع کن <ArrowLeft size={17} /></a>
              <a className="button button-quiet" href="#services">مشاهده خدمات <MoveUpLeft size={16} /></a>
            </div>
            <div className="hero-proof">
              <div className="proof-icon"><ShieldCheck size={17} /></div>
              <span>تمرکز روی پایداری، عملکرد و جزئیات</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="نمایی از محیط فنی سرور">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-core"><Network size={43} strokeWidth={1.2} /></div>
            <div className="float-card float-top">
              <span className="float-icon"><Cpu size={16} /></span>
              <span><b>Performance</b><small>بهینه‌سازی منابع</small></span>
              <span className="status-live">LIVE</span>
            </div>
            <div className="float-card float-bottom">
              <span className="float-icon purple"><Blocks size={16} /></span>
              <span><b>Custom plugins</b><small>توسعه اختصاصی</small></span>
              <Check className="check-icon" size={17} />
            </div>
            <div className="visual-caption"><span>NX / SYSTEMS</span><span>01 — 04</span></div>
          </div>
        </div>
        <div className="container hero-bottom">
          <span>SCROLL TO EXPLORE</span>
          <span className="scroll-line" />
          <span>ساخته‌شده برای تجربه بهتر بازی</span>
        </div>
      </section>

      <section className="services section" id="services">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span /> WHAT WE DO</div>
              <h2>از ایده تا <span>اجرای واقعی.</span></h2>
            </div>
            <p>برای ساخت یک تجربه بازی حرفه‌ای، فقط یک سرور روشن کافی نیست. جزئیات فنی تفاوت را می‌سازند.</p>
          </div>
          <div className="services-grid">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article className="service-card" key={service.number}>
                  <div className="service-top"><span>{service.number}</span><Icon size={22} strokeWidth={1.6} /></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="tag-list">{service.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <a href="#contact" aria-label={`سفارش ${service.title}`}><ArrowLeft size={18} /></a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about section" id="about">
        <div className="container about-layout">
          <div className="about-statement">
            <div className="eyebrow"><span /> WHY NEXVORDEV</div>
            <h2>فقط اجرا نمی‌کنیم؛<br /><span>درست مهندسی</span> می‌کنیم.</h2>
          </div>
          <div className="about-details">
            <p>هر پروژه باید متناسب با نیاز واقعی خودش ساخته شود. نه پیچیدگی بی‌دلیل، نه راه‌حل موقت. ما روی معماری تمیز، عملکرد پایدار و تحویل قابل اتکا تمرکز می‌کنیم.</p>
            <div className="principles">
              <div><Sparkles size={18} /><span><b>راهکار متناسب</b><small>هر پروژه، طراحی مخصوص خودش</small></span></div>
              <div><ShieldCheck size={18} /><span><b>کیفیت قابل اتکا</b><small>تست و بررسی پیش از تحویل</small></span></div>
              <div><Gamepad2 size={18} /><span><b>درک دنیای بازی</b><small>توسعه با شناخت نیاز گیمرها</small></span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="process section" id="process">
        <div className="container">
          <div className="section-heading process-heading">
            <div><div className="eyebrow"><span /> HOW WE WORK</div><h2>مسیر همکاری، <span>شفاف و ساده.</span></h2></div>
            <p>از اولین پیام تا تحویل نهایی، می‌دانی در چه مرحله‌ای هستیم.</p>
          </div>
          <div className="steps-grid">
            {steps.map(([number, title, description]) => (
              <div className="step" key={number}>
                <span className="step-number">{number}</span>
                <div className="step-line" />
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="container">
          <div className="contact-panel">
            <div className="contact-glow" />
            <div className="contact-content">
              <div className="eyebrow"><span /> LET’S BUILD SOMETHING</div>
              <h2>ایده‌ای داری؟<br /><span>بیایم بسازیمش.</span></h2>
              <p>جزئیات پروژه‌ات رو بگو تا درباره بهترین مسیر اجرا صحبت کنیم.</p>
              <a className="button button-primary" href="https://t.me/TheROMZDEV" target="_blank" rel="noreferrer">شروع گفت‌وگو در تلگرام <MessageCircle size={17} /></a>
            </div>
            <div className="contact-mark">NX<span>.</span></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <a className="brand footer-brand" href="#"><span className="brand-mark"><Terminal size={18} /></span><span>NEXVOR<span className="brand-accent">DEV</span><small>GAME SERVER ENGINEERING</small></span></a>
          <span className="footer-note">ساخت تجربه‌های بهتر، با مهندسی دقیق.</span>
          <span className="copyright">© {new Date().getFullYear()} NEXVORDEV</span>
        </div>
      </footer>
    </main>
  );
}
