"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, Blocks, Braces, Code2, Cpu, Gauge, Gamepad2, MessageCircle, Puzzle, Server, Settings2, ShieldCheck } from "lucide-react";

const platforms = [
  { number: "01", name: "Minecraft Java", title: "ماینکرفت جاوا", description: "توسعه قابلیت‌های اختصاصی، راه‌اندازی و تنظیم سرورهای جاوا.", icon: Blocks, tags: ["Plugin Development", "Setup", "Optimization"] },
  { number: "02", name: "Minecraft Bedrock", title: "ماینکرفت بدراک", description: "پیاده‌سازی قابلیت‌ها و آماده‌سازی سرور بدراک متناسب با نیاز پروژه.", icon: Gamepad2, tags: ["Add-ons", "Configuration", "Server Setup"] },
  { number: "03", name: "Counter-Strike 1.6", title: "کانتر استرایک ۱.۶", description: "ساخت و تنظیم سرور کانتر، توسعه پلاگین و بهینه‌سازی تجربه بازی.", icon: Cpu, tags: ["AMX Mod X", "Plugins", "Server Setup"] },
];
const services = [
  { icon: Puzzle, title: "ساخت پلاگین اختصاصی", description: "تبدیل ایده‌ها و نیازهای سرور به قابلیت‌های اختصاصی." },
  { icon: Server, title: "راه‌اندازی سرور", description: "نصب، آماده‌سازی و پیکربندی سرور بازی." },
  { icon: Settings2, title: "نصب و کانفیگ", description: "تنظیم پلاگین‌ها، مودها و اجزای موردنیاز سرور." },
  { icon: Gauge, title: "بهینه‌سازی", description: "بررسی تنظیمات و بهبود عملکرد و پایداری سرور." },
];
const steps = [
  ["01", "ثبت درخواست", "پلتفرم و چیزی که لازم داری رو از طریق تلگرام توضیح می‌دی."],
  ["02", "بررسی و اعلام هزینه", "جزئیات سفارش بررسی می‌شه و هزینه و محدوده کار مشخص می‌شه."],
  ["03", "اجرا و بررسی", "کار انجام می‌شه و موارد توافق‌شده بررسی می‌شن."],
  ["04", "تحویل سفارش", "خروجی نهایی طبق توافق بهت تحویل داده می‌شه."],
];
const codeSamples = [
  "const server = await nexvor.boot();",
  "plugins.register(customPlugin);",
  "world.optimize({ performance: true });",
  "if (server.ready) return success;",
  "import { GameServer } from 'nexvor';",
  "config.set('online-mode', true);",
  "function buildProject() { ... }",
  "await database.connect();",
  "const players = server.getOnlinePlayers();",
  "console.log('NexvorDEV initialized');",
  "server.listen(25565);",
  "return { status: 'READY' };",
];
const codeStreams = Array.from({ length: 8 }, (_, index) => index);

export default function Home() {
  const [codeFrame, setCodeFrame] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setCodeFrame((frame) => (frame + 1) % codeSamples.length), 1250);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty("--scroll-progress", scrollable > 0 ? `${(window.scrollY / scrollable) * 100}%` : "0%");
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    document.body.classList.add("motion-ready");
    const revealItems = document.querySelectorAll(".section-heading, .platform-card, .service-card, .price-card, .step, .contact-panel");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item, index) => {
      (item as HTMLElement).style.setProperty("--reveal-delay", `${(index % 4) * 85}ms`);
      item.classList.add("reveal-item");
      revealObserver.observe(item);
    });

    const cards = document.querySelectorAll<HTMLElement>(".platform-card, .service-card, .price-card");
    const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const tiltMove = (event: PointerEvent) => {
      const card = event.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--pointer-x", `${x * 100}%`);
      card.style.setProperty("--pointer-y", `${y * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-5px)`;
    };
    const tiltReset = (event: PointerEvent) => {
      (event.currentTarget as HTMLElement).style.transform = "";
    };
    if (canTilt) cards.forEach((card) => {
      card.addEventListener("pointermove", tiltMove);
      card.addEventListener("pointerleave", tiltReset);
    });

    const hero = document.querySelector<HTMLElement>(".hero");
    const moveGlow = (event: PointerEvent) => {
      if (!hero || !canTilt) return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
      hero.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
    };
    hero?.addEventListener("pointermove", moveGlow);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      revealObserver.disconnect();
      cards.forEach((card) => {
        card.removeEventListener("pointermove", tiltMove);
        card.removeEventListener("pointerleave", tiltReset);
      });
      hero?.removeEventListener("pointermove", moveGlow);
      document.body.classList.remove("motion-ready");
    };
  }, []);

  return (
    <main>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="top-strip"><span className="online-dot" /> توسعه و خدمات سرورهای بازی <a href="#contact">برای شروع سفارش پیام بده <ArrowUpLeft size={13} /></a></div>
      <header className="site-header">
        <div className="container nav-wrap">
          <a className="brand" href="#" aria-label="NexvorDEV صفحه اصلی"><span className="brand-mark"><Braces size={21} /></span><span>NEXVOR<span className="brand-accent">DEV</span><small>GAME SERVER SOLUTIONS</small></span></a>
          <nav className="nav-links desktop-nav" aria-label="منوی اصلی">
            <a href="#services">خدمات</a><a href="#platforms">پلتفرم‌ها</a><a href="/pricing">تعرفه</a><a href="#process">طرز کار ما</a><a className="nav-cta" href="#contact">ارتباط با ما <ArrowUpLeft size={15} /></a>
          </nav>
          <details className="mobile-menu"><summary className="mobile-toggle">فهرست <span>☰</span></summary><nav className="nav-links" aria-label="منوی موبایل">
            <a href="#services">خدمات</a><a href="#platforms">پلتفرم‌ها</a><a href="/pricing">تعرفه</a><a href="#process">طرز کار ما</a><a className="nav-cta" href="#contact">ارتباط با ما <ArrowUpLeft size={15} /></a>
          </nav></details>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" /><div className="hero-grid" />
        <div className="code-rain" aria-hidden="true">{codeStreams.map((column) => <div className={"code-stream stream-" + (column + 1)} key={column}>{Array.from({ length: 10 }, (_, line) => <span key={line}>{codeSamples[(codeFrame + column * 2 + line) % codeSamples.length]}</span>)}</div>)}</div>
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span /> NEXVORDEV / GAME SERVER DEVELOPMENT</div>
            <h1>ایده‌ات رو به<br /><span>دنیای بازی</span> بیار.</h1>
            <p className="hero-description">از ساخت پلاگین اختصاصی تا راه‌اندازی، کانفیگ و بهینه‌سازی سرور؛ خدمات فنی سرورهای بازی در یک مسیر ساده و شفاف.</p>
            <div className="hero-actions"><a className="button button-primary" href="#contact">شروع سفارش <ArrowLeft size={17} /></a><a className="button button-quiet" href="#services">دیدن خدمات <ArrowDownLeft size={16} /></a></div>
            <div className="hero-meta"><span><ShieldCheck size={16} /> سه پلتفرم تخصصی</span><i /><span><Code2 size={16} /> توسعه تا راه‌اندازی</span></div>
          </div>
          <div className="hero-console" dir="ltr">
            <div className="console-top"><div className="window-dots"><i /><i /><i /></div><span>NEXVOR_TERMINAL</span><span className="console-live">● READY</span></div>
            <div className="console-body">
              <div className="console-line"><span className="line-no">01</span><span className="syntax-muted">$</span> nexvor init --project game-server</div>
              <div className="console-line"><span className="line-no">02</span><span className="syntax-blue">›</span> Loading development tools...</div>
              <div className="console-line"><span className="line-no">03</span><span className="syntax-blue">›</span> Platform: <span className="syntax-white">Java / Bedrock / CS 1.6</span></div>
              <div className="console-line"><span className="line-no">04</span><span className="syntax-blue">›</span> Services: <span className="syntax-white">plugins, setup, config</span></div>
              <div className="console-line"><span className="line-no">05</span><span className="syntax-green">✓</span> Ready for your idea<span className="cursor-blink">_</span></div>
            </div>
            <div className="console-footer"><span><span className="pulse-dot" /> SYSTEM READY</span><span>BUILD / 2026</span></div>
            <div className="console-orbit orbit-a" /><div className="console-orbit orbit-b" />
          </div>
        </div>
        <div className="container hero-bottom"><span>SCROLL TO EXPLORE</span><span className="scroll-line" /><span>ساخت، توسعه، بهینه‌سازی</span></div>
      </section>

      <section className="section platforms" id="platforms"><div className="container">
        <div className="section-heading"><div><div className="eyebrow"><span /> SUPPORTED PLATFORMS</div><h2>برای دنیای بازی <span>تو.</span></h2></div><p>خدمات NexvorDEV برای سه پلتفرم؛ با یک بازه تعرفه مشخص و خدمات کامل.</p></div>
        <div className="platform-grid">{platforms.map((platform) => { const Icon = platform.icon; return <article className="platform-card" key={platform.number}>
          <div className="platform-card-top"><span>{platform.number} / PLATFORM</span><Icon size={25} /></div><h3>{platform.title}</h3><div className="platform-en">{platform.name}</div><p>{platform.description}</p>
          <div className="tag-list">{platform.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><a href="#contact" aria-label={"سفارش برای " + platform.title}><ArrowUpLeft size={18} /></a>
        </article>; })}</div>
      </div></section>

      <section className="section services" id="services"><div className="container">
        <div className="section-heading"><div><div className="eyebrow"><span /> WHAT WE DO</div><h2>از کدنویسی تا <span>اجرای سرور.</span></h2></div><p>هر چیزی که برای آماده‌سازی و توسعه سرور بازی لازم داری، از همین‌جا شروع می‌شه.</p></div>
        <div className="services-grid">{services.map((service, index) => { const Icon = service.icon; return <article className="service-card" key={service.title}>
          <div className="service-top"><span>0{index + 1}</span><Icon size={23} /></div><h3>{service.title}</h3><p>{service.description}</p><a href="#contact" aria-label={"درخواست " + service.title}><ArrowUpLeft size={17} /></a>
        </article>; })}</div>
      </div></section>

      <section className="section process" id="process"><div className="container">
        <div className="section-heading"><div><div className="eyebrow"><span /> HOW WE WORK</div><h2>طرز کار ما، <span>قدم‌به‌قدم.</span></h2></div><p>از پیام اول تا تحویل نهایی، مسیر سفارش روشن و قابل پیگیریه.</p></div>
        <div className="steps-grid">{steps.map(([number, title, description]) => <article className="step" key={number}><span className="step-number">{number}</span><div className="step-line" /><h3>{title}</h3><p>{description}</p></article>)}</div>
      </div></section>

      <section className="contact section" id="contact"><div className="container"><div className="contact-panel"><div className="contact-glow" /><div className="contact-content">
        <div className="eyebrow"><span /> LET’S BUILD YOUR SERVER</div><h2>آماده‌ای شروع کنیم؟<br /><span>با ما در ارتباط باش.</span></h2><p>پلتفرم و توضیح کوتاهی از چیزی که لازم داری بفرست تا درباره جزئیات سفارش صحبت کنیم.</p>
        <a className="button button-primary" href="https://t.me/TheROMZDEV" target="_blank" rel="noreferrer">ارتباط در تلگرام <MessageCircle size={17} /></a>
      </div><div className="contact-mark">NX<span>.</span></div></div></div></section>

      <footer className="footer"><div className="container footer-inner">
        <a className="brand footer-brand" href="#"><span className="brand-mark"><Braces size={18} /></span><span>NEXVOR<span className="brand-accent">DEV</span><small>GAME SERVER SOLUTIONS</small></span></a>
        <nav className="footer-links"><a href="#services">خدمات</a><a href="/pricing">تعرفه</a><a href="#process">طرز کار ما</a><a href="#contact">ارتباط با ما</a></nav>
        <span className="copyright">© {new Date().getFullYear()} NEXVORDEV</span>
      </div></footer>
    </main>
  );
}
